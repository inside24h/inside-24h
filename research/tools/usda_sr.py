"""USDA SR Legacy CSV lookup (offline).
Usage:
  python -I usda_sr.py search <regex>        # list FDC ids + descriptions matching regex
  python -I usda_sr.py show <fdcId>...       # per-100g nutrients + portions
Library: load(), nutrients(fdc), portions(fdc)
Data: <projekt>/data/raw/usda/sr_legacy/FoodData_Central_sr_legacy_food_csv_2018-04
      <projekt>/data/raw/usda/fndds/FoodData_Central_survey_food_csv_2024-10-31 (FNDDS 2021-2023, added 2026-11-17)
FNDDS (USDA Food and Nutrient Database for Dietary Studies, the survey foods of NHANES/WWEIA) has the mixed dishes,
cocktails and coffee-shop drinks that SR Legacy lacks (sushi, burrito, mojito, latte). Its fdc ids (2705xxx-2710xxx)
never overlap SR Legacy (16xxxx-17xxxx), so one id space serves both; dataset(fdc) says which one a record is from.
Download (public, no key): https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_csv_2024-10-31.zip
"""
import csv, re, sys, functools, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
D = os.path.join(ROOT, "data", "raw", "usda", "sr_legacy", "FoodData_Central_sr_legacy_food_csv_2018-04") + os.sep
DF = os.path.join(ROOT, "data", "raw", "usda", "fndds", "FoodData_Central_survey_food_csv_2024-10-31") + os.sep
FNDDS_NAME = "FNDDS 2021-2023"
# nutrient number -> field
NUT = {"208": "kcal", "205": "carbs", "269": "sugars", "291": "fiber", "204": "fat", "606": "satFat",
       "203": "protein", "307": "sodiumMg", "262": "caffeineMg", "221": "alcoholG", "255": "waterG",
       "213": "lactose", "539": "added"}

@functools.lru_cache(None)
def fndds_foods():
    """FNDDS survey foods (empty if the FNDDS download is not there)."""
    if not os.path.exists(DF + "food.csv"): return {}
    with open(DF + "food.csv", encoding="utf-8", newline="") as f:
        return {r["fdc_id"]: r["description"] for r in csv.DictReader(f)}

@functools.lru_cache(None)
def foods():
    with open(D + "food.csv", encoding="utf-8", newline="") as f:
        out = {r["fdc_id"]: r["description"] for r in csv.DictReader(f)}
    for k, v in fndds_foods().items():
        assert k not in out, "FNDDS id overlaps SR Legacy: " + k
        out[k] = v
    return out

def dataset(fdc):
    """'SR Legacy' or 'FNDDS 2021-2023' for a record id."""
    return FNDDS_NAME if str(fdc) in fndds_foods() else "SR Legacy"

@functools.lru_cache(None)
def nutmap():
    with open(D + "nutrient.csv", encoding="utf-8", newline="") as f:
        return {r["id"]: r["nutrient_nbr"] for r in csv.DictReader(f)}

@functools.lru_cache(None)
def alln():
    nm = nutmap(); out = {}
    with open(D + "food_nutrient.csv", encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            n = nm.get(r["nutrient_id"])
            if n in NUT:
                out.setdefault(r["fdc_id"], {})[NUT[n]] = float(r["amount"])
    if fndds_foods():
        # FNDDS food_nutrient.nutrient_id holds the nutrient NUMBER (208 = energy), not nutrient.csv's id
        with open(DF + "food_nutrient.csv", encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                n = r["nutrient_id"]
                if n in NUT:
                    out.setdefault(r["fdc_id"], {})[NUT[n]] = float(r["amount"])
    return out

def nutrients(fdc):
    return alln().get(str(fdc), {})

@functools.lru_cache(None)
def units():
    with open(D + "measure_unit.csv", encoding="utf-8", newline="") as f:
        return {r["id"]: r["name"] for r in csv.DictReader(f)}

@functools.lru_cache(None)
def allp():
    out = {}
    with open(D + "food_portion.csv", encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            out.setdefault(r["fdc_id"], []).append(r)
    if fndds_foods():
        # FNDDS portions carry the whole text in portion_description ("1 drink", "1 fl oz", "1 roll (6 pieces)")
        with open(DF + "food_portion.csv", encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                if float(r["gram_weight"] or 0) > 0:
                    out.setdefault(r["fdc_id"], []).append({"amount": "", "measure_unit_id": "", "modifier": r["portion_description"], "gram_weight": r["gram_weight"]})
    return out

def portions(fdc):
    res = []
    for r in allp().get(str(fdc), []):
        res.append((r["amount"], units().get(r["measure_unit_id"], ""), r["modifier"], r["gram_weight"]))
    return res

if __name__ == "__main__":
    if sys.argv[1] == "search":
        rx = re.compile(sys.argv[2], re.I)
        for k, v in foods().items():
            if rx.search(v): print(k, v)
    else:
        for k in sys.argv[2:]:
            print(k, foods().get(k)); print(" ", nutrients(k));
            for p in portions(k): print("   ", p)
