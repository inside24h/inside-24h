# -*- coding: utf-8 -*-
"""Builds research/fooddb.json from fooddb_spec.py + USDA SR Legacy CSV (data/raw/usda).
Run:  python -I build_fooddb.py [check|build]
  check: resolve USDA records, list failures + portions
  build: write fooddb.json
"""
import sys, json, re, os, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import usda_sr as U
import fooddb_spec as S

# Atkinson FS et al. 2008, Diabetes Care, PMC2584181, Table 1 (mean +- SEM, glucose scale). Read in cached full text.
GI = {
 "white_bread": (75, "White wheat bread"), "wholemeal_bread": (74, "Whole wheat/whole meal bread"),
 "cornflakes": (81, "Cornflakes"), "porridge": (55, "Porridge, rolled oats"), "muesli": (57, "Muesli"),
 "apple": (36, "Apple, raw (average of all available data)"), "orange": (43, "Orange, raw (average of all available data)"),
 "banana": (51, "Banana, raw (average of all available data)"), "pineapple": (59, "Pineapple, raw"),
 "watermelon": (76, "Watermelon, raw"), "dates": (42, "Dates, raw"),
 "apple_juice": (41, "Apple juice"), "orange_juice": (50, "Orange juice"),
 "white_rice": (73, "White rice, boiled"), "brown_rice": (68, "Brown rice, boiled"),
 "spaghetti_white": (49, "Spaghetti, white"), "spaghetti_whole": (48, "Spaghetti, whole meal"),
 "potato_boiled": (78, "Potato, boiled"), "fries": (63, "Potato, french fries"),
 "sweet_potato": (63, "Sweet potato, boiled"), "sweet_corn": (52, "Sweet corn"),
 "veg_soup": (48, "Vegetable soup"),
 "milk_full": (39, "Milk, full fat"), "milk_skim": (37, "Milk, skim"), "ice_cream": (51, "Ice cream"),
 "yogurt_fruit": (41, "Yogurt, fruit"), "soy_milk": (34, "Soy milk"), "rice_milk": (86, "Rice milk"),
 "chickpeas": (28, "Chickpeas"), "kidney_beans": (24, "Kidney beans"), "lentils": (32, "Lentils"),
 "chocolate": (40, "Chocolate"), "popcorn": (65, "Popcorn"), "crisps": (56, "Potato crisps"),
 "softdrink": (59, "Soft drink/soda"), "rice_crackers": (87, "Rice crackers/crisps"),
 "sucrose": (65, "Sucrose"), "honey": (61, "Honey"), "jam": (49, "Strawberry jam/jelly"),
}

def norm_variants(s):
    out = {s}
    t = s.replace("đ", "dj").replace("Đ", "Dj")
    t2 = s.replace("đ", "d")
    for x in (t, t2):
        x = unicodedata.normalize("NFD", x)
        out.add("".join(c for c in x if unicodedata.category(c) != "Mn"))
    return out

def resolve(u):
    foods = U.foods()
    if isinstance(u, int):
        return str(u) if str(u) in foods else None, []
    low = {}
    for k, v in foods.items(): low.setdefault(v.lower(), []).append(k)
    if u.lower() in low: return low[u.lower()][0], []
    words = set(re.findall(r"[a-z0-9']+", u.lower()))
    sc = []
    for k, v in foods.items():
        w = set(re.findall(r"[a-z0-9']+", v.lower()))
        sc.append((len(words & w) / max(1, len(words | w)), k, v))
    sc.sort(reverse=True)
    return None, sc[:6]

def serving(sp, fdc):
    kind = sp[0]
    ports = U.portions(fdc)
    if kind == 'g':
        if sp[1] is None: return None
        return {"label": sp[2], "grams": sp[1], "source": sp[3]}
    if kind == 'p':
        alts = [re.compile(a, re.I) for a in sp[1].split("|")]
        for amt, unit, mod, g in [pp for rx in alts for pp in ports if rx.search(pp[2])][:1]:
            if g:
                label = ("%s %s" % (amt, mod)).strip() if amt not in ("1", "1.0") else ("1 " + mod).strip()
                return {"label": label, "grams": round(float(g), 1), "source": "USDA SR Legacy food_portion (%s)" % mod}
        return "FAIL"
    if kind == 'ml':
        n, rx = sp[1], re.compile(sp[2], re.I)
        for amt, unit, mod, g in ports:
            if rx.search(mod) and g:
                ml = {"fl oz": 29.5735, "cup": 236.588}
                key = "fl oz" if "fl oz" in mod else ("cup" if mod.strip().startswith("cup") else None)
                if key:
                    a = float(amt) if amt else 1.0
                    gpml = float(g) / (a * ml[key])
                    return {"label": "%d ml" % n, "grams": round(n * gpml, 1),
                            "source": "volume %d ml x USDA density %.3f g/ml (from portion '%s' = %s g)" % (n, gpml, mod, g)}
        return "FAIL"

def r(x, d=2):
    return None if x is None else round(x, d)

def per100(e, fdc):
    keys = ["kcal", "carbs", "sugars", "fiber", "fat", "satFat", "protein", "sodiumMg", "caffeineMg", "alcoholG", "waterG"]
    if e["mix"]:
        tot = sum(g for _, g in e["mix"]); acc = {}
        for k in keys:
            vals = [(U.nutrients(f).get(k), g) for f, g in e["mix"]]
            if any(v is None for v, _ in vals): acc[k] = None  # not reported by USDA for a component
            else: acc[k] = sum(v * g for v, g in vals) / tot
        lac = [(U.nutrients(f).get("lactose"), g) for f, g in e["mix"]]
        return acc, tot
    n = U.nutrients(fdc)
    return {k: n.get(k) for k in keys}, None

def lactose_of(e, fdc):
    if e["mix"]: return None
    return U.nutrients(fdc).get("lactose")

def main(mode):
    out = []; fails = 0
    for e in S.E:
        if e["usda"] is None and not e["mix"]:
            fdc = None
        else:
            fdc, cand = resolve(e["usda"] if e["usda"] is not None else e["mix"][0][0])
            if fdc is None:
                fails += 1; print("NOMATCH", e["id"], "|", e["usda"]);
                for c in cand: print("      ", c[1], c[2])
                continue
        for f, _ in (e["mix"] or []):
            if str(f) not in U.foods(): print("BAD MIX ID", e["id"], f)
        sv = None
        if fdc is not None:
            sv = serving(e["serving"], fdc if not e["mix"] else fdc)
        elif e["serving"][0] == 'g':
            sv = serving(e["serving"], None)
        if sv == "FAIL":
            fails += 1
            print("NOSERVING", e["id"], U.foods()[fdc]);
            for p in U.portions(fdc): print("      ", p)
            continue
        if mode == "check": continue
        p100, mixg = per100(e, fdc) if fdc else ({k: None for k in ["kcal","carbs","sugars","fiber","fat","satFat","protein","sodiumMg","caffeineMg","alcoholG","waterG"]}, None)
        n = U.nutrients(fdc) if fdc else {}
        sug = p100["sugars"]
        rule = e["free"]; basis = ""
        if e["mix"]:
            if rule == "none": free, basis = 0.0, "whole milk lactose and coffee: no free sugars (WHO definition)"
            else: free, basis = None, "not determined"
        elif rule == "none": free, basis = 0.0, "WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars"
        elif rule == "all":
            free = sug; basis = "all sugars counted as free (juice, honey, sugar, syrup/soft drink or jam)"
        elif rule == "minusLactose":
            lac = n.get("lactose")
            if sug is not None and lac is not None: free = max(0.0, sug - lac); basis = "total sugars minus USDA lactose (milk sugar is not free)"
            else: free = None; basis = "USDA reports no lactose value, split not possible"
        elif rule == "upper":
            free = n.get("added") if n.get("added") is not None else sug
            basis = ("USDA added sugars (539)" if n.get("added") is not None else "UPPER BOUND: all total sugars assumed added (no added-sugar value in SR Legacy)")
        else: free, basis = None, "cannot be separated from natural sugars with the sources read"
        if sug is None and rule in ("all",): free = None
        if e["gi"]:
            gv, gl = GI[e["gi"]]
            gi, gis = gv, "Atkinson 2008 (PMC2584181) Table 1: %s, mean of multiple studies" % gl
            if e["gi"] in ("softdrink","rice_crackers","chocolate","veg_soup") or e["id"] == "milk-semi-skimmed":
                gis += "; nearest tested class, not tested on this exact product"
        else: gi, gis = None, None
        ds = "SR Legacy" + (" (computed mix)" if e["mix"] else "")
        ent = {
          "id": e["id"], "name": e["name"],
          "aliases": sorted({v for a in e["aliases"] + [e["name"].lower()] for v in norm_variants(a.lower())}),
          "kind": e["kind"],
          "serving": sv,
          "per100g": {"kcal": r(p100["kcal"],0), "carbs": r(p100["carbs"]), "sugars": r(p100["sugars"]), "freeSugars": r(free),
                      "fiber": r(p100["fiber"]), "fat": r(p100["fat"]), "satFat": r(p100["satFat"]), "protein": r(p100["protein"]),
                      "sodiumMg": r(p100["sodiumMg"],1), "caffeineMg": r(p100["caffeineMg"],1), "alcoholG": r(p100["alcoholG"]), "waterG": r(p100["waterG"],1)},
          "freeSugarsBasis": basis if fdc else None,
          "gi": gi, "giSource": gis, "color": e["color"],
          "usdaFdcId": int(fdc) if (fdc and not e["mix"]) else None,
          "usdaDescription": U.foods()[fdc] if (fdc and not e["mix"]) else None,
          "usdaDataset": ds if fdc else None,
          "recipe": ([{"usdaFdcId": int(f), "usdaDescription": U.foods()[str(f)], "grams": g} for f, g in e["mix"]] if e["mix"] else None),
          "usdaProxy": bool(e["proxy"]),
          "notes": e["note"],
        }
        out.append(ent)
    print("fails", fails, "entries", len(S.E), "built", len(out))
    if mode == "build" and not fails:
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fooddb.json"), "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
        print("written", len(out))

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "check")


