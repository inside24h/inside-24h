# -*- coding: utf-8 -*-
"""Variants, sizes, add-ins, builders and "Which …?" choosers for fooddb.json (2026-10-18).
Plan: research/audit/VARIANTS-PLAN.md (the OWNER OVERRIDES at its top win). Called at the end of
`python -I build_fooddb.py build` (attach). Everything here is a NEW key on a base entry (ask, chip, variants, sizes,
addins, builder, choose), so a food without any of them is written exactly as before; gate() proves that against the
frozen pre-variants baseline (research/audit/baseline-20261018/fooddb.json), allowing only CHANGED_ON_PURPOSE.

Spec (fooddb_spec.py, section "VARIANTS, SIZES, ADD-INS, BUILDERS, CHOOSERS"):
  ask(base, question, chip)      "Which beer?" + the chip of the default (the base food itself)
  var(base, v, chip, name, ...)  a variant: its own USDA record (usda=) or OUR recipe (recipe=[(ref, amount), ...])
  size(base, opts, src)          named amounts for "How much?" (slice/half/whole, 0.3/0.33/0.5 l)
  addin(...) / addins(base, ks)  sugar, honey, milk, extra shot: folded INTO the drink, never a separate solid
  builder(base, ...)             a base plus toggleable parts with grams per serving ("What's on it?")
  chooser(k, ask, opts, words)   one word that names several foods ("čaj" → black, green, herbal, iced)
A ref is a database food id ("ham": its final values, label overrides included), a USDA FDC id (int), or
(fdc, free-sugar rule[, GI key]). An amount is grams, or ("ml", n) converted with that food's own serving density.

Mixing rule (the app does exactly the same in parse.ts mixFood, a test compares them):
  per 100 g = gram-weighted sum; a nutrient is null if ANY part has it null (never a silent 0)
  free sugars = sum of each part's own free sugars (each part keeps its own WHO rule), null if any part is null
  GI = carbohydrate-weighted over the parts with >= 3 g available carbohydrate in the amount used, null unless every
       such part has a measured GI (evidence level C: a mixed-meal GI is a calculation, not a test)
"""
import re, json, os, itertools
import usda_sr as U
import fooddb_spec as S

NUM = ["kcal", "carbs", "sugars", "freeSugars", "fiber", "fat", "satFat", "protein", "sodiumMg", "caffeineMg", "alcoholG", "waterG"]
CARB_MIN = 3.0      # g available carbohydrate: below this a part does not count for the mix GI (a cheese slice, coffee,
                    # a kebab's tomato). 1 g until 2026-10-20; 3 g = parse.ts macros() for a meal (no meaningful sugar response)
HR = re.compile(r"[čćšžđČĆŠŽĐ]")  # chips are American English: Croatian letters only in search words
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
BASELINE = os.path.join(ROOT, "research", "audit", "baseline-20261018", "fooddb.json")
FAILS = []


def fail(msg):
    FAILS.append(msg); print("VARIANT FAIL", msg)


def warn(msg):
    print("VARIANT WARN", msg)


def rp(p):
    """per-100 g values as written for variants and parts: kcal 1 decimal, the rest 3 (the app mixes them again)."""
    return {k: (None if p.get(k) is None else round(p[k], 1 if k == "kcal" else 3)) for k in NUM}


def usda_url(fdc):
    return "https://fdc.nal.usda.gov/food-details/%s/nutrients" % fdc


class Ctx:
    def __init__(self, out, B):
        self.out, self.B = out, B
        self.by = {e["id"]: e for e in out}
        self.usda = {}

    def comp(self, ref, where):
        """A part: its per-100 g values, GI, record and the claim ids of its label overrides."""
        if isinstance(ref, str):
            e = self.by.get(ref)
            if e is None:
                fail("%s: unknown food %r" % (where, ref)); return None
            return dict(ref=ref, p=dict(e["per100g"]), gi=e["gi"], giSource=e["giSource"], fdc=e["usdaFdcId"],
                        desc=e["usdaDescription"] or ("our recipe (%s)" % e["name"]), name=e["name"], food=ref,
                        claims=["DBO-%s-%d" % (ref, i) for i in range(len(e.get("overrides") or []))],
                        overrides=e.get("overrides") or [], serving=e["serving"], proxy=e["usdaProxy"])
        if isinstance(ref, int): ref = (ref, "null")
        fdc, rule = ref[0], ref[1]
        gik = ref[2] if len(ref) > 2 else None
        k = (fdc, rule, gik)
        if k not in self.usda:
            if str(fdc) not in U.foods():
                fail("%s: USDA %s not in SR Legacy" % (where, fdc)); return None
            e = dict(id="usda-%d" % fdc, name=U.foods()[str(fdc)], aliases=[], kind="solid", usda=fdc, color="#888888",
                     free=rule, serving=('g', 100, '100 g', 'USDA per 100 g'), gi=gik, note="", mix=None, proxy=False,
                     piece=None, alias_serving=None)
            ent, f = self.B.build_entry(e)
            if ent is None:
                fail("%s: USDA %s did not build" % (where, fdc)); return None
            self.usda[k] = dict(ref=fdc, p=dict(ent["per100g"]), gi=ent["gi"], giSource=ent["giSource"], fdc=fdc,
                                desc=U.foods()[str(fdc)], name=U.foods()[str(fdc)], food=None, claims=[], overrides=[],
                                serving=None, proxy=False)
        return self.usda[k]

    def grams(self, c, amt, where):
        if isinstance(amt, (int, float)): return float(amt)
        if isinstance(amt, tuple) and amt[0] == "ml":
            sv = c.get("serving")
            m = sv and re.search(r"([\d.]+)\s*ml", sv["label"])
            if not m:
                fail("%s: %s has no ml serving to convert %r" % (where, c["ref"], amt)); return 0.0
            return amt[1] * sv["grams"] / float(m.group(1))
        fail("%s: bad amount %r" % (where, amt)); return 0.0


def mix(parts):
    """parts: [(component, grams)] → (per100, total grams, GI, carb parts, null fields). See the module docstring."""
    parts = [(c, g) for c, g in parts if g > 0]
    tot = sum(g for _, g in parts)
    p = {}
    for k in NUM:
        vals = [(c["p"].get(k), g) for c, g in parts]
        p[k] = None if any(v is None for v, _ in vals) else sum(v * g for v, g in vals) / tot
    carb = [(c, max(0.0, (c["p"]["carbs"] or 0) - (c["p"]["fiber"] or 0)) * g / 100) for c, g in parts]
    carb = [(c, a) for c, a in carb if a >= CARB_MIN]
    gi = round(sum(c["gi"] * a for c, a in carb) / sum(a for _, a in carb)) if carb and all(c["gi"] is not None for c, _ in carb) else None
    nulls = sorted({k for k in NUM for c, _ in parts if c["p"].get(k) is None})
    return p, tot, gi, carb, nulls


def gi_text(gi, carb):
    if not carb: return None
    if gi is None:
        miss = [c["name"] for c, _ in carb if c["gi"] is None]
        return None if not miss else None
    return "COMPUTED (level C): carbohydrate-weighted GI of the parts: " + "; ".join(
        "%s GI %s on %.1f g carbs (%s)" % (c["name"], c["gi"], a, c["giSource"]) for c, a in carb)


def atwater(p):
    g = lambda v: v or 0
    fib = g(p["fiber"])
    s = 4 * max(0, g(p["carbs"]) - fib) + 2 * fib + 4 * g(p["protein"]) + 9 * g(p["fat"]) + 7 * g(p["alcoholG"])
    if p["kcal"] < 5 and s < 5: return 0.0
    return (p["kcal"] - s) / s if s else 1.0


def short(c):
    return re.sub(r"\s*\(.*\)$", "", c["name"]).lower() if c["food"] else c["desc"]


def recipe_rows(parts):
    return [{"ref": c["ref"], "usdaFdcId": c["fdc"], "usdaDescription": c["desc"], "grams": round(g, 1)} for c, g in parts]


def part_claim_rows(parts):
    """Label-override rows of the parts (olives sodium, cola label …), so "How do we know?" names them too."""
    rows, seen = [], set()
    for c, _ in parts:
        for i, o in enumerate(c["overrides"]):
            cid = "DBO-%s-%d" % (c["food"], i)
            if cid in seen: continue
            seen.add(cid)
            rows.append({"fields": o["fields"], "level": o["level"], "text": o["text"], "cite": o["source"], "url": o["url"], "claim": cid})
    return rows


def alias_keys(B, words):
    return sorted({v for a in words for v in B.norm_variants(a.lower())})


def fold_words(B, words):
    return sorted({B.fold(v) for a in words for v in B.norm_variants(a.lower())})


# ---------------------------------------------------------------- variants
def base_spec(bid):
    return next(e for e in S.E if e["id"] == bid)


def build_var(ctx, bid, vs):
    B = ctx.B
    key = "%s.%s" % (bid, vs["v"])
    bs = base_spec(bid)
    note = vs.get("note", "")
    if vs.get("usda") is not None:
        e = dict(bs)
        e.update(id=bid, key=key, name=vs["name"], aliases=[], usda=vs["usda"], mix=None, piece=None, alias_serving=None,
                 serving=vs.get("serving") or bs["serving"], gi=(bs["gi"] if vs.get("gi") == "inherit" else vs.get("gi")),
                 free=vs.get("free") or bs["free"], proxy=vs.get("proxy", False), note=note,
                 kind=vs.get("kind") or bs["kind"], color=vs.get("color") or bs["color"])
        ent, f = B.build_entry(e)
        if ent is None:
            fail("%s did not build" % key); return None
        p, gi, gis = ent["per100g"], ent["gi"], ent["giSource"]
        if vs.get("gi") == "inherit" and gis: gis += "; the base food's GI, used for this variant too"
        serving, basis, fdc, desc = ent["serving"], ent["freeSugarsBasis"], ent["usdaFdcId"], ent["usdaDescription"]
        ovr, parts = ent["overrides"], []
        level = "B" if vs.get("proxy") else "A"
        text = vs.get("text") or "%s: values from the USDA record “%s”." % (vs["name"], desc)
        src = [{"fields": ["all"], "level": level, "text": (text + (" " + note if note and not vs.get("text") else "")).strip(),
                "cite": "USDA FoodData Central, SR Legacy %s: %s" % (fdc, desc), "url": usda_url(fdc), "claim": "DBV-" + key}]
        for i, o in enumerate(ovr or []):
            src.append({"fields": o["fields"], "level": o["level"], "text": o["text"], "cite": o["source"], "url": o["url"], "claim": "DBO-%s-%d" % (key, i)})
        recipe = None
    else:
        parts = []
        for item in vs["recipe"]:
            c = ctx.comp(item[0], key)
            if c is None: return None
            parts.append((c, ctx.grams(c, item[1], key)))
        p, tot, gi, carb, nulls = mix(parts)
        if nulls: warn("%s: %s null because a part has no value" % (key, nulls))
        gis = gi_text(gi, carb)
        if not note.startswith("COMPUTED"): note = "COMPUTED recipe (our assumption for the amounts, USDA for the parts). " + note
        sv = vs.get("serving")
        label = sv[2] if sv else "1 serving, %d g" % round(tot)
        serving = {"label": label, "grams": round(tot, 1), "source": "our recipe: " + " + ".join("%g g %s" % (round(g, 1), short(c)) for c, g in parts), "assumed": True}
        basis = ("our recipe: the free sugars of each part by its own rule (" + ", ".join(short(c) for c, _ in parts) + ")") if p["freeSugars"] is not None else "not determined: a part has no free-sugar value"
        fdc, desc, ovr, recipe = None, None, None, recipe_rows(parts)
        text = vs.get("text") or "%s is our recipe: %s." % (vs["name"], ", ".join("%g g %s" % (round(g), short(c)) for c, g in parts))
        src = [{"fields": ["all"], "level": "C", "text": text, "cite": "Our recipe from USDA SR Legacy parts: " + "; ".join(
            "%g g %s (%s)" % (round(g, 1), c["desc"], c["fdc"] if c["fdc"] else c["ref"]) for c, g in parts), "url": "https://fdc.nal.usda.gov/", "claim": "DBV-" + key}]
        src += part_claim_rows(parts)
    rng = vs.get("rng")
    if rng:
        src[0]["text"] += " Range: " + "; ".join("%s %g–%g per serving" % (k, lo, hi) for k, (lo, hi) in rng.items()) + "."
    off = atwater(p)
    if abs(off) > 0.15 and not vs.get("atwater_ok"): fail("%s: Atwater %+.0f%%" % (key, 100 * off))
    chip = vs["chip"]
    if len(chip) > 16 or HR.search(chip): fail("%s: chip %r (max 16 characters, no Croatian letters)" % (key, chip))
    if "(" in vs["name"]: fail("%s: variant names must have no parentheses (shortName strips them): %r" % (key, vs["name"]))
    return {
        "v": vs["v"], "chip": chip, "name": vs["name"], "words": fold_words(B, vs.get("words", [])),
        "aliases": alias_keys(B, list(vs.get("aliases", [])) + [vs["name"]]), "kind": vs.get("kind") or bs["kind"],
        "serving": serving, "per100g": rp(p), "freeSugarsBasis": basis, "gi": gi, "giSource": gis,
        "color": vs.get("color") or bs["color"], "usdaFdcId": fdc, "usdaDescription": desc, "recipe": recipe,
        "usdaProxy": bool(vs.get("proxy")), "notes": note, "src": src,
        "range": {k: list(v) for k, v in rng.items()} if rng else None, "overrides": ovr,
    }


# ---------------------------------------------------------------- add-ins
def build_addin(ctx, k):
    a = S.ADDIN[k]
    c = ctx.comp(a["ref"], "addin " + k)
    g = ctx.grams(c, a["grams"], "addin " + k)
    return {"k": k, "label": a["label"], "unit": a["unit"], "grams": round(g, 1), "max": a["max"], "excl": a.get("excl"),
            "p": rp(c["p"]), "gi": c["gi"], "words": fold_words(ctx.B, a["words"]), "food": a["ref"] if isinstance(a["ref"], str) else None,
            "fdc": c["fdc"], "src": [{"fields": ["all"], "level": a["level"], "text": a["text"], "cite": a["cite"], "url": a["url"], "claim": "DBA-" + k}]}


# ---------------------------------------------------------------- builders
def build_option(ctx, bid, o):
    where = "%s:%s" % (bid, o["k"])
    if isinstance(o["ref"], list):  # a part that is itself our recipe (pljeskavica, a burek filling)
        parts = []
        for item in o["ref"]:
            c = ctx.comp(item[0], where)
            if c is None: return None
            parts.append((c, ctx.grams(c, item[1], where)))
        p, tot, gi, carb, nulls = mix(parts)
        if nulls: warn("%s: %s null because a part has no value" % (where, nulls))
        comp = dict(p=p, gi=gi, giSource=gi_text(gi, carb), fdc=None, desc="our recipe", food=None)
        grams, rows, recipe = tot, part_claim_rows(parts), recipe_rows(parts)
    else:
        comp = ctx.comp(o["ref"], where)
        if comp is None: return None
        grams = comp["serving"]["grams"] if o.get("grams") is None else ctx.grams(comp, o["grams"], where)
        rows, recipe = part_claim_rows([(comp, grams)]), None
    gi_text_extra = ""
    if o.get("gi"):  # data round 3: the GI this part counts at inside this builder (see fooddb_spec.opt)
        if not o.get("gi_why"): fail("%s: a GI override needs gi_why" % where)
        gv, gs = ctx.B.gi_lookup(o["gi"])
        comp = dict(comp, gi=gv, giSource=gs)
        gi_text_extra = " Blood sugar: %s, GI %d." % (o["gi_why"], gv)
    rng = o.get("rng")
    if rng and not (rng[0] <= grams + 1e-6 and grams - 1e-6 <= rng[1]): fail("%s: %g g outside its range %r" % (where, grams, rng))
    if len(o["chip"]) > 16 or HR.search(o["chip"]): fail("%s: chip %r" % (where, o["chip"]))
    off = atwater(comp["p"])
    if abs(off) > 0.17 and comp["fdc"] not in ATWATER_EXEMPT: warn("%s: Atwater %+.0f%% (USDA food-specific factors)" % (where, 100 * off))
    src = [{"fields": ["all"], "level": o.get("level", "C"), "text": o["src"] + gi_text_extra, "cite": o.get("cite") or (
        "USDA FoodData Central, SR Legacy %s: %s" % (comp["fdc"], comp["desc"]) if comp["fdc"] else "Our recipe from USDA SR Legacy parts"),
        "url": o.get("url") or (usda_url(comp["fdc"]) if comp["fdc"] else "https://fdc.nal.usda.gov/"), "claim": "DBB-%s-%s" % (bid, o["k"])}] + rows
    return {"k": o["k"], "chip": o["chip"], "name": o["name"], "grams": round(grams, 1), "rng": list(rng) if rng else None,
            "on": bool(o.get("on")), "p": rp(comp["p"]), "gi": comp["gi"], "fdc": comp["fdc"], "food": comp.get("food"),
            "words": fold_words(ctx.B, o.get("words", [])), "aliases": alias_keys(ctx.B, o.get("aliases", [])),
            "recipe": recipe, "src": src,
            # 2026-10-20: research JSON only (sync_app_fooddb.slim picks its own keys); gi_text() needs it now that a
            # builder default (the kebab) gets a computed GI with CARB_MIN = 3 g
            "giSource": comp.get("giSource")}


def selection_parts(bld, sel, skip=()):
    return [(dict(p=o["p"], gi=o["gi"], giSource=o.get("giSource"), name=o["name"]), o["grams"]) for g in bld["groups"] for o in g["opts"] if o["k"] in sel and o["fdc"] not in skip]


# Parts whose energy is not 4/4/9/7 by design: vinegar (acetic acid, about 3.6 kcal/g, USDA 18 kcal with no macros),
# salt (0). The per-combination energy check leaves them out; each one is a single USDA record.
ATWATER_EXEMPT = {172237: "vinegar: acetic acid energy", 173468: "salt: no energy"}


def full_selection(bld, on):
    """A preset's list → the full selection: each one-of group keeps its default unless the list names another."""
    sel = set(on)
    for g in bld["groups"]:
        if g["one"] and not any(o["k"] in sel for o in g["opts"]):
            sel |= {o["k"] for o in g["opts"] if o["on"]}
    return sel


def build_builder(ctx, bid, bs):
    gs = []
    for g in bs["groups"]:
        opts = [build_option(ctx, bid, o) for o in g["opts"]]
        if any(o is None for o in opts): return None
        if g["one"] and sum(o["on"] for o in opts) != 1: fail("%s group %s: a one-of group needs exactly one default" % (bid, g["k"]))
        gs.append({"k": g["k"], "label": g["label"], "one": g["one"], "opts": opts})
    keys = [o["k"] for g in gs for o in g["opts"]]
    if len(keys) != len(set(keys)): fail("%s: option keys repeat" % bid)
    for k in keys:
        if not re.match(r"^[a-z0-9-]+$", k): fail("%s: option key %r must be [a-z0-9-]" % (bid, k))
    bld = {"title": bs["title"], "ask": bs.get("ask"), "unit": bs.get("unit", ""), "groups": gs, "presets": [],
           "src": [{"fields": ["all"], "level": "C", "text": bs["note"], "cite": bs.get("cite", "Our builder from USDA SR Legacy parts"),
                    "url": bs.get("url", "https://fdc.nal.usda.gov/"), "claim": "DBB-%s" % bid}]}
    for pr in bs.get("presets", []):
        for k in pr["on"]:
            if k not in keys: fail("%s preset %s: unknown option %s" % (bid, pr["k"], k))
        for g in gs:
            if g["one"] and sum(o["k"] in pr["on"] for o in g["opts"]) > 1: fail("%s preset %s: two options of one-of group %s" % (bid, pr["k"], g["k"]))
        sel = full_selection(bld, pr["on"])
        if len(pr["chip"]) > 16 or HR.search(pr["chip"]): fail("%s preset chip %r" % (bid, pr["chip"]))
        p, tot, gi, _, _ = mix(selection_parts(bld, sel))
        bld["presets"].append({"k": pr["k"], "chip": pr["chip"], "name": pr["name"], "on": sorted(sel),
                               "aliases": alias_keys(ctx.B, pr.get("aliases", [])), "words": fold_words(ctx.B, pr.get("words", [])),
                               "check": {"grams": round(tot, 1), "kcal": round(p["kcal"] * tot / 100, 1), "fat": round((p["fat"] or 0) * tot / 100, 2), "gi": gi}})
    # every combination: energy must still match the macros (each part is a USDA record, so the mix must be too)
    one = [g for g in gs if g["one"]]; anyg = [o for g in gs if not g["one"] for o in g["opts"]]
    n = 0
    for choice in itertools.product(*[g["opts"] for g in one]):
        for r in range(len(anyg) + 1):
            for extra in itertools.combinations(anyg, r):
                sel = {o["k"] for o in choice} | {o["k"] for o in extra}
                n += 1
                parts = selection_parts(bld, sel, ATWATER_EXEMPT)
                if not parts: continue
                p, tot, gi, _, _ = mix(parts)
                if abs(atwater(p)) > 0.15: fail("%s %s: Atwater %+.0f%%" % (bid, sorted(sel), 100 * atwater(p)))
    bld["combinations"] = n
    return bld


# ---------------------------------------------------------------- sizes
def build_sizes(ctx, bid, sz):
    e = ctx.by[bid]
    m = re.search(r"([\d.]+)\s*ml", e["serving"]["label"])
    opts = []
    for o in sz["opts"]:
        k, label = o[0], o[1]
        if len(label) > 8 or HR.search(label): fail("%s size label %r (max 8 characters)" % (bid, label))
        if o[2] == "ml":
            if not m: fail("%s size %s: ml size on a food without an ml serving" % (bid, k)); continue
            opts.append({"k": k, "label": label, "ml": o[3]})
        else:
            opts.append({"k": k, "label": label, "mult": o[2]})
    if not any((o.get("mult") == 1) or (m and o.get("ml") == float(m.group(1))) for o in opts):
        fail("%s sizes: none of them is the default serving (%s)" % (bid, e["serving"]["label"]))
    if len(opts) > 4: fail("%s: at most 4 sizes" % bid)
    return {"opts": opts, "src": [{"fields": ["serving"], "level": sz.get("level", "C"), "text": sz["text"], "cite": sz["cite"], "url": sz["url"], "claim": "DBS-" + bid}]}


# ---------------------------------------------------------------- choosers
def build_choosers(ctx):
    B = ctx.B
    shared = {}
    for e in S.E:
        for k in {B.fold(a) for a in e["aliases"]} | {B.fold(e["name"]), B.fold(e["id"].replace("-", " "))}:
            shared.setdefault(k, set()).add(e["id"])
    shared = {k: v for k, v in shared.items() if len(v) > 1}
    vkeys = {"%s.%s" % (b, v["v"]) for b, vs in S.VARS.items() for v in vs}
    member = {}
    for c in S.CHOOSE:
        ids = set()
        for k, chip in c["opts"]:
            if k not in ctx.by and k not in vkeys: fail("chooser %s: unknown option %s" % (c["k"], k))
            if len(chip) > 16 or HR.search(chip): fail("chooser %s: chip %r" % (c["k"], chip))
            ids.add(k.split(".")[0])
        for i in ids:
            if i in member: fail("%s is in two choosers (%s, %s)" % (i, member[i], c["k"]))
            member[i] = c["k"]
        c["_ids"] = ids
        c["_words"] = set(fold_words(B, c.get("words", [])))
    for w, ids in sorted(shared.items()):
        hit = [c for c in S.CHOOSE if ids <= c["_ids"]]
        if not hit:
            fail("ambiguous word %r names %s but no chooser offers all of them" % (w, sorted(ids))); continue
        hit[0]["_words"].add(w)
    out = {}
    for c in S.CHOOSE:
        if not c["_words"]: fail("chooser %s has no words" % c["k"])
        grp = {"k": c["k"], "ask": c["ask"], "words": sorted(c["_words"]), "opts": [{"k": k, "chip": chip} for k, chip in c["opts"]]}
        for i in c["_ids"]: out[i] = grp
    return out


# ---------------------------------------------------------------- uniqueness of every exact name
def check_aliases(ctx):
    B = ctx.B
    owner = {}
    def put(k, who):
        k = B.fold(k)
        if k in owner and owner[k] != who: fail("exact alias %r names %s and %s" % (k, owner[k], who))
        owner.setdefault(k, who)
    for e in ctx.out:
        for a in e["aliases"] + [e["name"], e["id"].replace("-", " ")]: put(a, e["id"])
    for e in ctx.out:
        for v in e.get("variants") or []:
            for a in v["aliases"]: put(a, "%s.%s" % (e["id"], v["v"]))
        b = e.get("builder")
        if b:
            for g in b["groups"]:
                for o in g["opts"]:
                    for a in o["aliases"]: put(a, "%s_%s" % (e["id"], o["k"]))
            for pr in b["presets"]:
                for a in pr["aliases"]: put(a, "%s preset %s" % (e["id"], pr["k"]))
    base_alias = {B.fold(a): e["id"] for e in ctx.out for a in e["aliases"] + [e["name"]]}
    for e in ctx.out:
        for v in e.get("variants") or []:
            for w in v["words"]:
                if w in base_alias and base_alias[w] != e["id"]:
                    fail("variant word %r of %s.%s is the name of %s (a variant word must not name another food)" % (w, e["id"], v["v"], base_alias[w]))


# ---------------------------------------------------------------- gate
def gate(out):
    """Foods without variants must be exactly as before (old keys, old values) unless listed in CHANGED_ON_PURPOSE."""
    if not os.path.exists(BASELINE):
        warn("no baseline at %s: gate skipped" % BASELINE); return 0
    with open(BASELINE, encoding="utf-8") as f:
        old = {e["id"]: e for e in json.load(f)}
    bad = 0
    allow = getattr(S, "CHANGED_ON_PURPOSE", {})
    for e in out:
        o = old.get(e["id"])
        if o is None:
            if e["id"] not in allow: print("GATE new food", e["id"]); bad += 1
            continue
        diff = sorted(k for k in o if json.dumps(o[k], sort_keys=True) != json.dumps(e.get(k), sort_keys=True))
        if diff and e["id"] not in allow: print("GATE changed", e["id"], diff); bad += 1
        elif diff: print("GATE changed on purpose", e["id"], diff, "|", allow[e["id"]])
    for i in old:
        if i not in {e["id"] for e in out}: print("GATE food removed", i); bad += 1
    return bad


# ---------------------------------------------------------------- attach
def attach(out, B):
    FAILS.clear()
    ctx = Ctx(out, B)
    for bid, (q, chip) in S.ASK.items():
        if bid not in ctx.by: fail("ask for unknown food " + bid); continue
        if len(chip) > 16 or HR.search(chip): fail("%s default chip %r" % (bid, chip))
        ctx.by[bid]["ask"], ctx.by[bid]["chip"] = q, chip
    for bid, vs in S.VARS.items():
        if bid not in ctx.by: fail("variants for unknown food " + bid); continue
        if bid not in S.ASK: fail("%s has variants but no ask()" % bid)
        if bid in S.BUILD: fail("%s: variants and a builder on one food" % bid)
        keys = [v["v"] for v in vs]
        if len(keys) != len(set(keys)): fail("%s: variant keys repeat" % bid)
        for v in keys:
            if not re.match(r"^[a-z0-9-]+$", v): fail("%s: variant key %r must be [a-z0-9-]" % (bid, v))
        built = [build_var(ctx, bid, v) for v in vs]
        ctx.by[bid]["variants"] = [b for b in built if b]
    for k in S.ADDIN:
        if not re.match(r"^[a-z]+$", k): fail("add-in key %r must be [a-z]" % k)
    for bid, ks in S.ADDINS_OF.items():
        for k in ks:
            if k not in S.ADDIN: fail("%s: unknown add-in %s" % (bid, k))
        ctx.by[bid]["addins"] = [build_addin(ctx, k) for k in ks if k in S.ADDIN]
    for bid, bs in S.BUILD.items():
        if bid not in ctx.by: fail("builder for unknown food " + bid); continue
        bld = build_builder(ctx, bid, bs)
        if not bld: continue
        ctx.by[bid]["builder"] = bld
        # the base food IS the default selection: identical when that is the database food itself (pizza, hamburger),
        # computed when the default is a recipe of several parts (kebab)
        sel = {o["k"] for g in bld["groups"] for o in g["opts"] if o["on"]}
        dflt = [o for g in bld["groups"] for o in g["opts"] if o["k"] in sel]
        if not (len(dflt) == 1 and dflt[0]["food"] == bid):
            if not bs.get("base_is_default"): fail("%s: the default selection is not the database food; set base_is_default" % bid); continue
            parts = selection_parts(bld, sel)
            p, tot, gi, carb, nulls = mix(parts)
            e = ctx.by[bid]
            e["per100g"] = {k: (None if p[k] is None else round(p[k], 0 if k == "kcal" else 1 if k in ("sodiumMg", "caffeineMg", "waterG") else 2)) for k in NUM}
            e["serving"] = {"label": bs["serving_label"], "grams": round(tot, 1), "source": "our builder default: " + " + ".join("%g g %s" % (o["grams"], o["name"]) for o in dflt), "assumed": True}
            e["freeSugarsBasis"] = "our recipe: the free sugars of each part by its own rule" if p["freeSugars"] is not None else "not determined: a part has no free-sugar value"
            e["gi"], e["giSource"] = gi, gi_text(gi, carb)
            e["usdaDataset"] = "SR Legacy (computed recipe)"
            e["recipe"] = [{"ref": o["k"], "usdaFdcId": o["fdc"], "usdaDescription": o["name"], "grams": o["grams"]} for o in dflt]
            e["usdaProxy"] = False
    for bid, sz in S.SIZES.items():
        if bid not in ctx.by: fail("sizes for unknown food " + bid); continue
        ctx.by[bid]["sizes"] = build_sizes(ctx, bid, sz)
    groups = build_choosers(ctx)
    for bid, grp in groups.items():
        ctx.by[bid]["choose"] = grp
    check_aliases(ctx)
    bad = gate(out)
    nv = sum(len(e.get("variants") or []) for e in out)
    nb = sum(1 for e in out if e.get("builder"))
    print("variants %d, builders %d (%s combinations checked), add-in foods %d, sized foods %d, choosers %d" % (
        nv, nb, sum(e["builder"]["combinations"] for e in out if e.get("builder")), sum(1 for e in out if e.get("addins")),
        sum(1 for e in out if e.get("sizes")), len(S.CHOOSE)))
    return len(FAILS) + bad
