# -*- coding: utf-8 -*-
"""Writes the app copy app/src/v4/food/fooddb.json from research/fooddb.json (the single source).
Run:  python -I sync_app_fooddb.py        (build_fooddb.py build runs it automatically after writing fooddb.json)

The app copy is a slimmer schema (what parse.ts reads). Nothing is edited by hand in the app copy any more: change
fooddb_spec.py, run `python -I build_fooddb.py build`, and both files follow.

Left out of the app on purpose (EXCLUDE): foods with no usable numbers. They stay in research/fooddb.json.
"""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SRC = os.path.join(ROOT, "research", "fooddb.json")
DST = os.path.join(ROOT, "app", "src", "v4", "food", "fooddb.json")

# kebab was excluded (no SR Legacy record, every value null) until 2026-10-18; it is now a builder of USDA parts.
EXCLUDE = {}


def slim(e):
    out = {
        "id": e["id"], "name": e["name"], "aliases": e["aliases"], "kind": e["kind"],
        "serving": {"label": e["serving"]["label"], "grams": e["serving"]["grams"]},
        "p": e["per100g"], "gi": e["gi"], "color": e["color"], "proxy": e["usdaProxy"],
        "recipe": bool(e["recipe"]), "fdc": e["usdaFdcId"],
    }
    if e["serving"].get("assumed"): out["assumedServing"] = True
    if e.get("piece"): out["piece"] = {"label": e["piece"]["label"], "grams": e["piece"]["grams"]}
    if e.get("aliasServing"): out["aliasServing"] = {k: {"label": v["label"], "grams": v["grams"]} for k, v in e["aliasServing"].items()}
    if e.get("overrides"):
        out["src"] = [{"fields": o["fields"], "level": o["level"], "text": o["text"], "cite": o["source"], "url": o["url"]} for o in e["overrides"]]
    # 2026-10-18 (build_variants.py): new keys only, so a food without them is written exactly as before
    for k in ("ask", "chip", "sizes", "addins", "choose"):
        if e.get(k) is not None: out[k] = e[k]
    if e.get("variants"):
        out["variants"] = [slim_variant(v) for v in e["variants"]]
    if e.get("builder"):
        b = e["builder"]
        out["builder"] = {"title": b["title"], "ask": b["ask"], "unit": b["unit"], "src": b["src"], "presets": b["presets"],
                          "groups": [{"k": g["k"], "label": g["label"], "one": g["one"], "opts": [
                              {k: o[k] for k in ("k", "chip", "name", "grams", "rng", "on", "p", "gi", "fdc", "food", "words", "aliases", "src")} for o in g["opts"]]}
                              for g in b["groups"]]}
    return out


def slim_variant(v):
    o = {"v": v["v"], "chip": v["chip"], "name": v["name"], "words": v["words"], "aliases": v["aliases"], "kind": v["kind"],
         "serving": {"label": v["serving"]["label"], "grams": v["serving"]["grams"]}, "p": v["per100g"], "gi": v["gi"],
         "color": v["color"], "proxy": v["usdaProxy"], "recipe": bool(v["recipe"]), "fdc": v["usdaFdcId"], "src": v["src"]}
    if v["serving"].get("assumed"): o["assumedServing"] = True
    if v.get("range"): o["range"] = v["range"]
    if v.get("choose"): o["choose"] = v["choose"]  # 2026-10-29: a variant's own "Which ...?" row (the roll)
    return o


def main():
    with open(SRC, encoding="utf-8") as f:
        src = json.load(f)
    app = []
    for e in src:
        if e["id"] in EXCLUDE: continue
        if not e.get("serving"): raise SystemExit("no serving and not in EXCLUDE: " + e["id"])
        app.append(slim(e))
    with open(DST, "w", encoding="utf-8") as f:
        json.dump(app, f, ensure_ascii=False)
    print("app copy written:", len(app), "foods ->", os.path.relpath(DST, ROOT), "| excluded:", ", ".join(EXCLUDE))


if __name__ == "__main__":
    main()
