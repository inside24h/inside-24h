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
# Table 1 rows marked "*Low-GI varieties were also identified" (footnote t1fn1 in the cached XML)
GI_LOWVAR = {"white_bread", "white_rice"}
# Single tests from the online Supplementary Tables (dc08-1239_1.pdf = A1, healthy subjects; dc08-1239_2.pdf = A2).
# Each row re-read on 2026-10-17 in the PDF from Europe PMC (PMC2584181/supplementaryFiles, pdftotext -raw).
# Moved here from the app (parse.ts GI_ADD) so the database is the one source.
A1 = "Atkinson 2008 (PMC2584181) Suppl. Table A1 (healthy subjects)"
GI_SUPP = {
 "a1_grapes": (59, A1 + " row 984: Grapes, black, Waltham Cross (Australia), 59, 11 subjects, bread reference, single test"),
 "a1_cherries": (63, A1 + " row 970: Cherries, dark, raw, pitted (Australia), 63 ± 6, 10 subjects, single test"),
 "a1_kiwi": (58, A1 + " row 987: Kiwi fruit (Australia), 58 ± 7, 7 subjects, single test"),
 "a1_strawberries": (40, A1 + " row 1023: Strawberries, fresh, raw (Australia), 40 ± 7, 10 subjects, single test"),
 "a1_melon": (65, A1 + " row 1021: Rockmelon/Cantaloupe, raw (Australia), 65 ± 9, 8 subjects, bread reference; a second test, row 1022, gave 70 (10 subjects, glucose reference)"),
 "a1_peas": (51, A1 + " row 1611: Pea, frozen, boiled (Canada), 51 ± 6, 6 subjects, single test"),
 "a1_white_beans": (31, A1 + " row 1099: Haricot/Navy beans, boiled (Canada), 31 ± 6, 6 subjects; nearest tested white bean"),
 "a1_hummus": (6, A1 + " row 1730: Hummus (chickpea salad dip), 6 ± 4, 12 subjects; a commercial dip, row 1097, tested 22 ± 5"),
 "a1_hamburger": (66, A1 + " row 1176: Hamburger (beef patty, ketchup, pickle, onion, mustard on a bun), McDonald's Australia, 66 ± 8, 10 subjects, 95 g serve"),
 "a1_doughnut": (75, A1 + " row 13: Doughnut, wheat dough, deep-fried (China), 75 ± 7, 8 subjects; nearest tested food, not a jam-filled doughnut"),
 "a2_sponge": (46, "Atkinson 2008 (PMC2584181) Suppl. Table A2 row 1883: Sponge cake, plain (Canada), 46 ± 6, 5 healthy subjects (listed in A2 because of the small number)"),
 "a1_carrot_raw": (35, A1 + " row 1621: Carrots, raw, diced (Australia), 35 ± 5, 7 subjects, single test; raw ground carrots 39 ± 1 (row 1622)"),
 "a1_dried_apricots": (31, A1 + " rows 950-952: Apricots, dried (Australia; UK ×2), 30 ± 7, 31 ± 6, 32 ± 7, printed mean of three studies 31"),
 "a1_tomato_soup": (52, A1 + " row 1555: Tomato soup, condensed, prepared with water (Campbell's), 52 ± 4, 10 subjects, single test"),
 "a1_dried_figs": (61, A1 + " row 979: Figs, dried, tenderised (Dessert Maid), 61 ± 6, 10 subjects, single test"),
 "a1_raisins": (64, A1 + " row 1018: Raisins (Canada), 64 ± 11, 6 subjects, single test; sultanas: printed mean of three studies 57 (rows 1029-1031)"),
}

def fold(s):
    """The app's fold() (parse.ts): lower case, strip diacritics, đ → d, single spaces."""
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if not ("̀" <= c <= "ͯ")).replace("đ", "d")
    return re.sub(r"\s+", " ", s).strip()

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

def density(fdc, rx):
    """g/ml from the first USDA fluid portion (fl oz or cup) of record fdc whose modifier matches rx."""
    for amt, unit, mod, g in U.portions(fdc):
        if rx.search(mod) and g:
            ml = {"fl oz": 29.5735, "cup": 236.588}
            key = "fl oz" if "fl oz" in mod else ("cup" if mod.strip().startswith("cup") else None)
            if key:
                a = float(amt) if amt else 1.0
                inner = re.search(r"([\d.]+)\s*fl oz", mod)  # "can 8.4 fl oz": the volume is inside the modifier
                if inner: a *= float(inner.group(1))
                return float(g) / (a * ml[key]), mod, g
    return None

def serving(sp, fdc):
    kind = sp[0]
    ports = U.portions(fdc) if fdc else []
    if kind == 'g':
        if sp[1] is None: return None
        assumed = not re.match(r"(USDA|label|producer)", sp[3], re.I)
        return {"label": sp[2], "grams": sp[1], "source": sp[3], "assumed": assumed}
    if kind == 'p':
        alts = [re.compile(a, re.I) for a in sp[1].split("|")]
        for amt, unit, mod, g in [pp for rx in alts for pp in ports if rx.search(pp[2])][:1]:
            if g:
                label = ("%s %s" % (amt, mod)).strip() if amt not in ("1", "1.0") else ("1 " + mod).strip()
                grams = round(float(g), 1)
                if len(sp) > 2: label = sp[2]
                elif re.match(r"1 cup\b", label): label = "1 portion, %g g" % grams  # US cup measure → metric wording
                return {"label": label, "grams": grams, "source": "USDA SR Legacy food_portion (%s %s = %s g)" % (amt, mod, g), "assumed": False}
        return "FAIL"
    if kind in ('ml', 'mlx'):
        n = sp[1]
        src_fdc, rx, label = (fdc, sp[2], sp[3] if len(sp) > 3 else None) if kind == 'ml' else (str(sp[2]), sp[3], sp[4] if len(sp) > 4 else None)
        d = density(src_fdc, re.compile(rx, re.I))
        if not d: return "FAIL"
        gpml, mod, g = d
        other = "" if kind == 'ml' else " of USDA %s %s" % (src_fdc, U.foods()[src_fdc])
        return {"label": label or "%d ml" % n, "grams": round(n * gpml, 1), "assumed": False,
                "source": "volume %d ml x USDA density %.3f g/ml (from portion '%s' = %s g%s)" % (n, gpml, mod, g, other)}

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
        # ---- overrides (spec OVR): replace named per-100 g values, keep the USDA values they replace ----
        ovr_out = []
        for o in [o for o in S.OVR if o["id"] == e["id"]]:
            if o["basis"] == "per100g": f = 1.0
            elif o["basis"] == "perServing": f = 100.0 / sv["grams"]
            elif o["basis"] == "per100ml":
                m = re.search(r"([\d.]+)\s*ml", sv["label"]); f = (float(m.group(1)) / sv["grams"]) if m else None
                if f is None: raise SystemExit("override per100ml needs an ml serving: " + e["id"])
            before = {}
            for k, v in o["values"].items():
                if k not in p100: raise SystemExit("override %s: unknown field %s" % (e["id"], k))
                before[k] = p100[k]
                p100[k] = None if v is None else v * f
            ovr_out.append({"fields": sorted(o["values"]), "basis": o["basis"], "label": o["values"], "usdaBefore": before,
                            "level": o["level"], "text": o["text"], "source": o["source"], "url": o["url"], "note": o["note"],
                            "rangesPer100g": {k: list(v) for k, v in o["ranges"].items()}})
        ovr_keys = {k for o in ovr_out for k in o["fields"]}
        if "sugars" in ovr_keys: ovr_keys.add("freeSugars")
        sug = p100["sugars"]
        rule = e["free"]; basis = ""
        if e["mix"]:
            if rule == "none": free, basis = 0.0, "computed mix: its sugars are milk lactose only (the other ingredients have 0 g sugar in USDA), so no free sugars (WHO definition)"
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
        if sug is None and rule in ("all", "upper"): free = None
        if rule == "upper" and ovr_out and "sugars" in ovr_out[0]["fields"]: basis = "UPPER BOUND: all label sugars assumed added"
        if e["gi"] in GI_SUPP:
            gi, gis = GI_SUPP[e["gi"]]
        elif e["gi"]:
            gv, gl = GI[e["gi"]]
            gi, gis = gv, "Atkinson 2008 (PMC2584181) Table 1: %s, mean of multiple studies" % gl
            if e["gi"] in ("softdrink","rice_crackers","chocolate","veg_soup") or e["id"] == "milk-semi-skimmed":
                gis += "; nearest tested class, not tested on this exact product"
            if e["gi"] in GI_LOWVAR: gis += "; Table 1 notes that low-GI varieties were also identified, so the type matters"
        else: gi, gis = None, None
        ds = "SR Legacy" + (" (computed mix)" if e["mix"] else "") + (" + label override" if ovr_out else "")
        piece = None
        if e.get("piece"):
            pl, pg, pw = e["piece"]; piece = {"label": pl, "grams": pg, "source": pw}
        alias_sv = None
        if e.get("alias_serving"):
            alias_sv = {}
            mlm = re.search(r"([\d.]+)\s*ml", sv["label"])
            for a, (k, nml, lab, why) in e["alias_serving"].items():
                if k != 'ml' or not mlm: raise SystemExit("alias_serving needs ml on an ml serving: " + e["id"])
                alias_sv[fold(a)] = {"label": lab, "grams": round(nml * sv["grams"] / float(mlm.group(1)), 1), "source": why}
        ent = {
          "id": e["id"], "name": e["name"],
          "aliases": sorted({v for a in e["aliases"] + [e["name"].lower()] for v in norm_variants(a.lower())}),
          "kind": e["kind"],
          "serving": sv,
          "piece": piece,
          "aliasServing": alias_sv,
          "overrides": ovr_out or None,
          # overridden fields keep 3 decimals, so a label value per serving comes back exactly (139 kcal per can)
          "per100g": {k: r(v, 3 if k in ovr_keys else d) for k, v, d in [
                      ("kcal", p100["kcal"], 0), ("carbs", p100["carbs"], 2), ("sugars", p100["sugars"], 2), ("freeSugars", free, 2),
                      ("fiber", p100["fiber"], 2), ("fat", p100["fat"], 2), ("satFat", p100["satFat"], 2), ("protein", p100["protein"], 2),
                      ("sodiumMg", p100["sodiumMg"], 1), ("caffeineMg", p100["caffeineMg"], 1), ("alcoholG", p100["alcoholG"], 2), ("waterG", p100["waterG"], 1)]},
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
    for o in S.OVR:
        if o["id"] not in {e["id"] for e in S.E}: fails += 1; print("OVERRIDE FOR UNKNOWN FOOD", o["id"])
    if mode == "build": fails += dedupe_aliases(out)
    print("fails", fails, "entries", len(S.E), "built", len(out))
    if mode == "build" and not fails:
        with open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fooddb.json"), "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
        print("written", len(out))
        import sync_app_fooddb
        sync_app_fooddb.main()

def dedupe_aliases(out):
    """Every folded alias (and the folded name / id) must belong to ONE food. Shared words go to S.ALIAS_OWNER[word];
    an unlisted shared word is a build failure, so each tie is decided in the spec, not by database order."""
    owners = {}
    for ent in out:
        keys = {fold(a) for a in ent["aliases"]} | {fold(ent["name"]), fold(ent["id"].replace("-", " "))}
        for k in keys: owners.setdefault(k, []).append(ent["id"])
    fails = 0
    for k, ids in sorted(owners.items()):
        if len(ids) < 2: continue
        own = S.ALIAS_OWNER.get(k)
        if own not in ids:
            print("SHARED ALIAS WITHOUT OWNER", repr(k), ids); fails += 1; continue
        for ent in out:
            if ent["id"] in ids and ent["id"] != own:
                if k in (fold(ent["name"]), fold(ent["id"].replace("-", " "))):
                    print("SHARED ALIAS IS THE NAME/ID OF", ent["id"], repr(k)); fails += 1
                ent["aliases"] = [a for a in ent["aliases"] if fold(a) != k]
    for k, own in S.ALIAS_OWNER.items():
        if k not in owners: print("ALIAS_OWNER entry unused:", repr(k))
    return fails

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "check")


