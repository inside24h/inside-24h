# -*- coding: utf-8 -*-
"""Spec for fooddb.json. Each entry is a dict; build_fooddb.py resolves USDA records and writes the JSON.
usda: FDC id (int) | exact SR Legacy description (str)
mix:  optional [(usda, grams), ...] computed recipe (weights are OUR assumption, flagged in notes)
free: none | all | minusLactose | upper | null   (free-sugar rule, see fooddb-notes.md)
serving: ('p', regex_on_portion_modifier[, label])  -> USDA portion (grams from USDA; label from USDA unless given)
         ('ml', n, regex[, label])                  -> n ml, grams = n * (USDA grams / ml of the matched fluid portion)
         ('mlx', n, fdc, regex[, label])            -> as 'ml', but the density comes from ANOTHER USDA record (fdc),
                                                       used where this record's own portion gives an impossible density
         ('g', grams, label, why)                   -> explicit. Marked "assumed" (typical size, level C) unless `why`
                                                       starts with USDA / label / producer (a sourced weight)
piece:   optional (label, grams, why): weight of ONE countable piece ("5 ćevapi", "10 olives"); a typed whole number
         uses it, servings (meal chips, links) still use `serving`
alias_serving: optional {alias: ('ml', n, label, why)}: a brand alias with its own pack size (Monster 500 ml can)
gi: key into the GI table in build_fooddb.py (each key carries its own source text)

ALIAS_OWNER (bottom): a word that names several foods ("kava", "sir", "juice") must belong to exactly ONE food, the
everyday default. The build drops it from the others and FAILS if a shared alias has no owner here, so every tie is
an explicit decision (the app's matcher gives an exact alias 10 points; ties used to fall to database order).

OVERRIDES (bottom): where USDA is wrong for our market or contradicts the manufacturer, `override()` replaces named
per-100 g values. Each one carries its own source string and URL; the app shows it under "How do we know?" for that
food (level and text below). Prefer a USDA record that really matches over an override.
"""
E = []
def add(id, name, aliases, kind, usda, color, free, serving, gi=None, note="", mix=None, proxy=False,
        piece=None, alias_serving=None):
    E.append(dict(id=id, name=name, aliases=aliases, kind=kind, usda=usda, color=color, free=free,
                  serving=serving, gi=gi, note=note, mix=mix, proxy=proxy, piece=piece, alias_serving=alias_serving))

# ---------------- DRINKS ----------------
add("water", "Water (tap)", ["voda", "water", "tap water", "pitka voda", "vodovodna voda"], "liquid",
    173647, "#cfe8ff", "none", ('ml', 250, r'fl oz'))
add("sparkling-water", "Sparkling mineral water", ["gazirana voda", "mineralna voda", "mineral water", "sparkling water", "perrier", "soda voda", "gazirana"], "liquid",
    173233, "#d6ecff", "none", ('ml', 250, r'fl oz'), note="USDA record is bottled Perrier.")
# Audit 2026-10-17: "sok" (= juice in Croatian) and "soda" (= soda water in Croatian) removed from cola.
add("cola", "Cola (regular)", ["cola", "kola", "coca cola", "coca-cola", "pepsi", "gazirani sok", "soft drink"], "liquid",
    174852, "#2a120a", "all", ('ml', 330, r'fl oz'), gi="softdrink", note="Free sugars rule: all sugars in a soft drink are added sugars. Energy, sugar, fat and caffeine: EU can label (override below).")
add("diet-cola", "Diet cola", ["diet cola", "cola zero", "coca cola zero", "light cola", "dijetalna cola", "cola light", "pepsi max", "zero cola"], "liquid",
    175099, "#2a120a", "none", ('ml', 330, r'fl oz'), note="Sweetened with aspartame (USDA record: low calorie, with aspartame, contains caffeine).")
add("orange-juice", "Orange juice", ["sok od naranče", "sok od narance", "narančin sok", "narancin sok", "orange juice", "juice", "sok", "voćni sok", "vocni sok"], "liquid",
    169100, "#f5a21b", "all", ('ml', 250, r'fl oz'), gi="orange_juice", note="Chilled, includes from concentrate.")
add("apple-juice", "Apple juice", ["sok od jabuke", "jabučni sok", "jabucni sok", "apple juice", "juice", "sok", "voćni sok", "vocni sok"], "liquid",
    173933, "#d9a93a", "all", ('ml', 250, r'fl oz'), gi="apple_juice", note="Canned or bottled, unsweetened, without added ascorbic acid.")
add("tomato-juice", "Tomato juice", ["sok od rajčice", "sok od rajcice", "tomato juice", "paradajz sok"], "liquid",
    "Tomato juice, canned, with salt added", "#b8321f", "none", ('ml', 250, r'fl oz'),  # audit 2026-10-17: was 'without salt added' (Na 10 mg); shop tomato juice is salted (Na 253), all other nutrients identical
    note="WHO free-sugar definition (as quoted in foods.md G1) names fruit juices and juice concentrates, not vegetable juice.")
add("coconut-water", "Coconut water", ["kokosova voda", "coconut water"], "liquid",
    "Nuts, coconut water (liquid from coconuts)", "#eef0e4", "null", ('ml', 250, r'cup'),
    note="Free-sugar status of coconut water is not defined in the WHO text we read, so freeSugars is null.")
add("energy-drink", "Energy drink", ["energetsko piće", "energetsko pice", "energy drink", "red bull", "monster", "energetik", "energetski napitak"], "liquid",
    173210, "#e8e34a", "all", ('ml', 250, r'can', "1 can (250 ml)"), gi="softdrink",
    alias_serving={"monster": ('ml', 500, "1 can (500 ml)", "label: Monster Energy EU/UK can is 500 ml")},
    note="USDA record is Red Bull; energy, sugar and caffeine from the Red Bull EU label (override below). GI value is the Table 1 'soft drink/soda' average, not tested on energy drinks. 'monster' uses a 500 ml can: the Monster EU label gives 47 kcal, 11 g sugar and 32 mg caffeine per 100 ml, the same as Red Bull within 1 kcal.")
add("espresso", "Espresso", ["espresso", "kava", "espreso", "crna kava", "kafa", "mala kava"], "liquid",
    171891, "#2b1608", "none", ('ml', 30, r'fl oz'), note="Restaurant-prepared espresso, serving 30 ml is a single shot by volume only.")
# audit 2026-10-17: "turska kava" removed (Turkish coffee is a 60-90 ml unfiltered cup, not 250 ml filter coffee; no food for it yet)
add("filter-coffee", "Coffee (filter / brewed)", ["filter kava", "kava", "coffee", "brewed coffee", "filter coffee", "crna kava", "kafa"], "liquid",
    171890, "#3a1d0c", "none", ('ml', 250, r'fl oz'), note="Brewed with tap water.")
# audit 2026-10-17: "macchiato"/"makijato" removed (an espresso with a little foam, ~60-100 ml, not a 200 g cup of coffee with milk)
add("coffee-with-milk", "Coffee with milk", ["kava s mlijekom", "bijela kava", "kava sa mlijekom", "coffee with milk", "kava s mlekom"], "liquid",
    None, "#9a6b44", "none", ('g', 200, "1 cup, 200 g", "our assumption"),
    mix=[(171890, 150), (171265, 50)], note="COMPUTED mix (our assumption: 150 g brewed coffee + 50 g whole milk). Not a USDA record.")
add("cappuccino", "Cappuccino", ["cappuccino", "kapučino", "kapucino", "cappucino"], "semi",
    None, "#b88a5e", "none", ('g', 150, "1 cup, 150 g", "our assumption"),
    mix=[(171891, 30), (171265, 120)], gi="milk_in_coffee", note="COMPUTED mix (our assumption: 30 g espresso + 120 g whole milk, foam not modelled). Not a USDA record.")
add("latte", "Latte", ["latte", "caffe latte", "kava latte", "late", "late macchiato", "café latte"], "liquid",
    None, "#c9a47c", "none", ('g', 250, "1 glass, 250 g", "our assumption"),
    mix=[(171891, 30), (171265, 220)], gi="milk_in_coffee", note="COMPUTED mix (our assumption: 30 g espresso + 220 g whole milk). Not a USDA record.")
add("black-tea", "Black tea", ["crni čaj", "crni caj", "black tea", "čaj", "caj", "tea", "english tea"], "liquid",
    173227, "#8a4a14", "none", ('ml', 250, r'fl oz'), note="Brewed, tap water, no sugar or milk.")
add("green-tea", "Green tea", ["zeleni čaj", "zeleni caj", "green tea", "čaj", "caj", "tea"], "liquid",
    171917, "#c6c04a", "none", ('ml', 250, r'fl oz'), note="Brewed, regular.")
add("herbal-tea", "Herbal tea", ["biljni čaj", "biljni caj", "herbal tea", "čaj", "caj", "tea", "kamilica", "menta", "voćni čaj"], "liquid",
    173232, "#d9b25a", "none", ('ml', 250, r'fl oz'), note="USDA record: herb tea other than chamomile, brewed.")
add("iced-tea", "Iced tea (sweetened)", ["ledeni čaj", "ledeni caj", "iced tea", "ice tea", "ledeni čaj limun"], "liquid",
    171888, "#c98a2b", "all", ('mlx', 250, 175111, r'fl oz'), gi="t21_iced_tea",
    note="Black tea ready-to-drink, lemon, sweetened. Density from USDA 175111 (Lipton Brisk lemon tea, 1 fl oz = 30.6 g, 1.035 g/ml): this record's only portion, 1 cup = 271 g (1.145 g/ml), is impossible for a ~10% sugar drink.")
add("milk-whole", "Milk (whole)", ["mlijeko", "punomasno mlijeko", "mlijeko 3.2", "whole milk", "milk", "mleko", "mlijeko punomasno"], "liquid",
    171265, "#f4f1ea", "none", ('ml', 250, r'cup'), gi="milk_full", note="3.25% fat, with added vitamin D.")
add("milk-semi-skimmed", "Milk (2%, reduced-fat)", ["milk (semi-skimmed, 2%)", "polumasno mlijeko", "mlijeko 1.5", "mlijeko 2", "semi-skimmed milk", "reduced fat milk", "2% milk", "milk", "mlijeko"], "liquid",
    171267, "#f4f1ea", "none", ('ml', 250, r'cup'), gi="milk_full", note="2% fat. GI: Table 1 gives full-fat 39 and skim 37; the full-fat value is shown here as nearest tested class.")
add("milk-skimmed", "Milk (skim)", ["milk (skimmed)", "obrano mlijeko", "mlijeko 0.5", "skim milk", "skimmed milk", "nonfat milk", "milk", "mlijeko"], "liquid",
    171269, "#f0f0ea", "none", ('ml', 250, r'cup'), gi="milk_skim")
add("chocolate-milk", "Chocolate milk", ["čokoladno mlijeko", "cokoladno mlijeko", "chocolate milk", "kakao"], "liquid",
    170880, "#8a5a3c", "minusLactose", ('ml', 250, r'cup'), gi="t21_flav_milk")
add("hot-chocolate", "Hot chocolate (homemade, with milk)", ["topla čokolada", "topla cokolada", "hot chocolate", "hot cocoa", "kakao", "vruća čokolada"], "liquid",
    171277, "#6b4028", "minusLactose", ('ml', 250, r'cup'))
add("soy-milk", "Soy milk", ["sojino mlijeko", "soy milk", "soja", "plant milk", "biljno mlijeko"], "liquid",
    "Soymilk, original and vanilla, unfortified", "#efe6c6", "upper", ('ml', 250, r'cup'), gi="soy_milk",
    note="Original and vanilla soymilk usually contains added sugar; upper-bound rule used.")
add("almond-milk", "Almond milk (unsweetened)", ["bademovo mlijeko", "almond milk", "plant milk", "biljno mlijeko"], "liquid",
    174832, "#f1ead9", "none", ('mlx', 250, 168751, r'cup'),
    note="Unsweetened, shelf-stable. Density from USDA 168751 (almond milk ready-to-drink, 1 cup = 240 g, 1.014 g/ml): this record's 1 cup = 262 g (1.107 g/ml) is out of line with every other USDA almond milk.")
add("rice-milk", "Rice milk (unsweetened)", ["rižino mlijeko", "rizino mlijeko", "rice milk", "plant milk", "biljno mlijeko"], "liquid",
    171942, "#f2efe6", "null", ('ml', 250, r'fl oz'), gi="rice_milk",
    note="Sugars in unsweetened rice drink arise from enzymatic starch hydrolysis; WHO text read does not classify this, freeSugars null.")
add("buttermilk", "Buttermilk / ayran", ["mlaćenica", "mlacenica", "ajran", "ayran", "buttermilk", "acidofil"], "liquid",
    170874, "#f3efe3", "none", ('ml', 250, r'cup'), note="Cultured lowfat buttermilk; used as proxy for ayran/mlaćenica.")
add("kefir", "Kefir", ["kefir", "kefir lowfat", "jogurt piće"], "semi",
    170904, "#f5f1e6", "none", ('ml', 250, r'cup'), gi="t21_kefir", note="Lifeway low-fat plain kefir (branded record inside SR Legacy).")
add("beer", "Beer (regular)", ["pivo", "beer", "lager", "svijetlo pivo"], "liquid",
    168746, "#e5a823", "none", ('ml', 500, r'fl oz'), note="Regular beer, all. Sugars in beer are residual from brewing, not added; WHO definition covers added sugars, honey, syrups and juices.")
add("red-wine", "Red wine", ["crno vino", "red wine", "vino", "wine", "crno"], "liquid",
    173190, "#6b0f1f", "none", ('ml', 150, r'fl oz'), note="Table wine, red.")
add("white-wine", "White wine", ["bijelo vino", "white wine", "vino", "wine", "bijelo"], "liquid",
    "Alcoholic beverage, wine, table, white", "#e6d98a", "none", ('ml', 150, r'fl oz'), note="Table wine, white.")
add("rakija", "Rakija / brandy (40%)", ["rakija", "šljivovica", "sljivovica", "loza", "travarica", "brandy", "spirits", "žestica", "zestica", "vodka", "whiskey"], "liquid",
    "Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 80 proof", "#e8dcc0", "none", ('ml', 40, r'fl oz'),
    note="Proxy: USDA distilled spirits 80 proof (40% ABV, same as typical rakija). Not a brandy-specific record.")
add("smoothie", "Fruit smoothie (juice-based)", ["smoothie", "smuti", "voćni smoothie", "vocni smoothie"], "semi",
    168214, "#e8708a", "all", ('mlx', 250, 173933, r'fl oz'), gi="t21_smoothie",
    note="Branded Naked Juice strawberry-banana, a juice-based smoothie. WHO counts sugars in fruit juices as free sugars. Density from USDA 173933 (apple juice, 1 fl oz = 31 g, 1.048 g/ml): every USDA smoothie 'cup' weight is below 1 g/ml (a fill weight, not a density).")
add("protein-shake", "Protein shake (whey + milk)", ["proteinski shake", "protein shake", "shake", "proteinski napitak", "whey"], "liquid",
    None, "#e9dfc9", "none", ('g', 280, "1 shaker, 280 g", "our assumption"),
    mix=[(173180, 30), (171267, 250)], note="COMPUTED mix (our assumption: 30 g whey-based protein powder USDA 173180 + 250 g 2% milk). Not a USDA record; powders vary strongly by brand.")
add("lemonade", "Lemonade (ready to drink)", ["limunada", "lemonade"], "liquid",
    173217, "#f3ec9a", "all", ('ml', 250, r'cup|fl oz'), gi="softdrink", note="Prepared from concentrate.")

# ---------------- DAIRY / EGGS ----------------
# audit 2026-10-17: "navlaka" removed (the cream skin on milk, not yogurt)
add("yogurt-plain", "Yogurt (plain, whole milk)", ["jogurt", "plain yogurt", "yoghurt", "yogurt", "bijeli jogurt", "kiselo mlijeko"], "semi",
    171284, "#f7f3ea", "none", ('p', r'8 fl oz|cup', "1 bowl, 245 g"), gi="t21_yog_natural")
add("yogurt-lowfat", "Yogurt (plain, low fat)", ["nemasni jogurt", "jogurt 1.5", "lowfat yogurt", "low fat yogurt", "jogurt", "yogurt", "yoghurt"], "semi",
    170886, "#f7f3ea", "none", ('p', r'8 fl oz|cup', "1 bowl, 245 g"), gi="t21_yog_lowfat")
add("yogurt-greek", "Greek yogurt (plain, low fat)", ["grčki jogurt", "grcki jogurt", "greek yogurt", "grcki", "jogurt"], "semi",
    170903, "#f8f4ea", "none", ('p', r'container'))
add("yogurt-fruit", "Yogurt (fruit, low fat)", ["voćni jogurt", "vocni jogurt", "fruit yogurt", "jogurt s voćem", "jogurt", "yogurt"], "semi",
    170889, "#f2c3c9", "minusLactose", ('p', r'container|cup|8 oz'), gi="yogurt_fruit")
# audit 2026-10-17: "gouda" was on cheddar too and cheddar won the tie; "žuti sir"/"trapist" (Croatian semi-hard
# yellow cheese) moved to gouda; "ementaler" removed (Swiss cheese, no entry for it). "sir" → gouda, "cheese" → cheddar.
add("cheese-cheddar", "Cheese (cheddar)", ["sir", "cheddar", "cheese"], "solid",
    170899, "#f0b83a", "none", ('p', r'slice \(1 oz'))
add("cheese-gouda", "Cheese (gouda)", ["gouda", "gauda", "sir", "cheese", "edamer", "žuti sir", "zuti sir"], "solid",
    171241, "#f2c84f", "none", ('p', r'slice|oz'))
add("cheese-mozzarella", "Cheese (mozzarella)", ["mozzarella", "mocarela", "mozzarela", "sir", "cheese"], "solid",
    170845, "#f6f1e0", "none", ('p', r'oz|slice'))
# audit 2026-10-17: "ovčji sir" (usually hard sheep cheese, e.g. Paški sir), "bijeli sir" (fresh cow cheese) and the
# non-word "vrhnje sir" removed; "pohano jaje" (breaded egg) removed.
add("cheese-feta", "Cheese (feta)", ["feta", "sir", "cheese"], "solid",
    "Cheese, feta", "#f4f0e2", "none", ('p', r'oz'))
add("cheese-cottage", "Cottage cheese (creamed)", ["svježi sir", "svjezi sir", "cottage cheese", "skuta", "sir", "cheese"], "semi",
    "Cheese, cottage, creamed, large or small curd", "#f7f4ea", "none",
    ('g', 105, "1 portion, 105 g", "our assumption: half of the USDA 'cup, large curd' (210 g)"))
add("cheese-parmesan", "Cheese (parmesan)", ["parmezan", "parmesan", "sir", "cheese", "tvrdi sir"], "solid",
    170848, "#f0dd9a", "none", ('p', r'oz|tbsp|cup'), note="Sodium: Parmigiano Reggiano Consortium value (override below); USDA US parmesan has nearly twice the sodium.")
add("egg-boiled", "Egg (hard-boiled)", ["jaje", "jaja", "kuhano jaje", "kuhana jaja", "boiled egg", "egg", "eggs"], "solid",
    "Egg, whole, cooked, hard-boiled", "#f6df8a", "none", ('p', r'large'))
add("egg-fried", "Egg (fried)", ["pečeno jaje", "jaje na oko", "fried egg", "egg", "eggs", "jaja"], "solid",
    "Egg, whole, cooked, fried", "#f0d060", "none", ('p', r'large'))
# audit 2026-10-17: was "Butter, salted" (Na 643 mg); Croatian maslac is normally unsalted. Same energy and fat.
add("butter", "Butter (unsalted)", ["maslac", "butter", "puter"], "solid",
    "Butter, without salt", "#f2dc7a", "none", ('p', r'tbsp'))

# ---------------- BREAD / CEREALS / STARCH ----------------
# audit 2026-10-17: "polubijeli kruh" (semi-white, T-850) moved from wholemeal to white, the closer of the two.
add("bread-white", "White bread", ["bijeli kruh", "kruh", "bread", "white bread", "kruh bijeli", "štruca", "struca", "polubijeli kruh"], "solid",
    174924, "#efe0b8", "null", ('p', r'slice'), gi="white_bread", note="Free sugars null: white bread contains sugars but USDA gives no added-sugar split.")
add("bread-wholemeal", "Wholemeal bread", ["integralni kruh", "crni kruh", "kruh", "whole wheat bread", "wholemeal bread", "bread"], "solid",
    172688, "#b88a52", "null", ('p', r'slice'), gi="wholemeal_bread")
add("bread-rye", "Rye bread", ["raženi kruh", "razeni kruh", "kruh", "rye bread", "bread"], "solid",
    172684, "#8c6a3f", "null", ('p', r'slice'), gi="t21_rye")
# audit 2026-10-17: "pecivo" removed here and from croissant (a Croatian roll of ~60-80 g is neither a 30 g baguette slice nor a croissant)
add("bread-french", "Baguette / French bread", ["baget", "baguette", "french bread", "kruh", "štangica", "bread"], "solid",
    172675, "#e6c88a", "null", ('g', 30, "1 slice", "our assumption: the USDA 'slice' of this record is 139 g"))
# audit 2026-10-17: USDA turnover proxy replaced by a Croatian producer label (override below): the turnover had
# 228 kcal and 7.87 g sugar per 100 g; burek labels give 247-316 kcal and 2-3.4 g sugar. Serving: the producer's
# net weight of one piece. "pastry" (usually sweet) and bare "pita" (any pie, e.g. pita od jabuka) removed.
add("burek", "Burek (meat/cheese pastry)", ["burek"], "solid",
    168963, "#d9a860", "null", ('g', 150, "1 piece", "producer: Čakovečki mlinovi burek, net weight 150 g"), proxy=True,
    note="PROXY: USDA has no burek record in SR Legacy. Energy and nutrients come from one Croatian producer label (Čakovečki mlinovi, a cheese burek); water from the USDA turnover 'Turnover, filled with egg, meat and cheese, frozen'. Burek labels range 247-316 kcal per 100 g (Sofka beef 247, Čakovečki mlinovi 297, Lidl meat 316).")
# audit 2026-10-17: was frozen pizza 170317 + an app-side 107 g slice taken from THIS record; now the record itself.
add("pizza", "Pizza (cheese)", ["pizza", "pica", "margherita", "pizza margherita", "sirna pizza"], "solid",
    173292, "#e8b04a", "null", ('p', r'^slice$'), gi="pizza_healthy", note="Fast-food chain 14-inch cheese pizza, regular crust; 1 slice = 107 g (USDA portion).")
# audit 2026-10-17: "njoki" removed (gnocchi are potato dumplings)
add("pasta", "Pasta (cooked)", ["tjestenina", "špageti", "spageti", "pasta", "makaroni", "spaghetti", "tjestenine"], "solid",
    "Pasta, cooked, enriched, without added salt", "#f1dd9a", "none", ('p', r'cup', "1 portion, 124 g cooked"), gi="spaghetti_white", note="GI is Table 1 'spaghetti, white'.")
add("pasta-wholewheat", "Pasta (whole-wheat, cooked)", ["integralna tjestenina", "whole wheat pasta", "tjestenina", "pasta"], "solid",
    168910, "#c9a46a", "none", ('p', r'cup', "1 portion, 117 g cooked"), gi="spaghetti_whole")
add("rice-white", "White rice (cooked)", ["riža", "riza", "bijela riža", "bijela riza", "rice", "white rice", "kuhana riža"], "solid",
    168878, "#f6f2e6", "none", ('p', r'cup'), gi="white_rice", note="Long-grain, regular, enriched, cooked.")
add("rice-brown", "Brown rice (cooked)", ["smeđa riža", "smeda riza", "integralna riža", "brown rice", "rice", "riza"], "solid",
    169704, "#c9a97a", "none", ('p', r'cup'), gi="brown_rice")
add("potato-boiled", "Potato (boiled)", ["krumpir", "kuhani krumpir", "boiled potato", "potato", "potatoes", "krompir"], "solid",
    "Potatoes, boiled, cooked in skin, flesh, without salt", "#ecd9a0", "none", ('p', r'^potato'), gi="potato_boiled")
add("potato-mashed", "Mashed potato (milk and butter)", ["pire", "pire krumpir", "mashed potato", "potato", "krumpir"], "semi",
    "Potatoes, mashed, home-prepared, whole milk and butter added", "#f3e5ad", "none", ('p', r'cup'), gi="t21_mashed")
# Audit 2026-10-16: was the oven-heated frozen record (169264, 158 kcal/100 g, 5.5 g fat). "Fries" as people mean it
# (and in the burger + fries preset) are deep-fried: USDA fast-food record 170698, 312 kcal/100 g, 14.7 g fat; serving
# "small" 71 g. "chips" stays with potato crisps only (it was on both; British chips = fries is the rarer reading here).
add("fries", "French fries", ["pomfrit", "pommes frites", "french fries", "fries", "pržen krumpir", "prženi krumpir"], "solid",
    170698, "#e9b844", "none", ('g', 71.0, "1 small portion", "USDA SR Legacy food_portion (serving small) = 71 g"), gi="fries", note="USDA fast-food record (fried in vegetable oil). Oven-baked frozen fries have about half the fat and calories.")
# audit 2026-10-17: "zobene pahuljice" and "oats" removed. They mean DRY rolled oats (379 kcal/100 g); this is
# cooked porridge (71 kcal/100 g), so "50 g zobenih pahuljica" showed a fifth of the energy. Not found is better.
add("oatmeal", "Oatmeal (cooked)", ["oatmeal / porridge (cooked)", "oatmeal / porridge", "zobena kaša", "zobena kasa", "kaša", "kasa", "porridge", "oatmeal", "owsianka"], "semi",
    173905, "#d9c7a3", "none", ('p', r'cup', "1 bowl, 234 g"), gi="porridge", note="Cooked with water, no sugar or milk.")
add("cornflakes", "Cornflakes", ["kukuruzne pahuljice", "corn flakes", "cornflakes", "pahuljice", "žitarice", "zitarice", "cereal"], "solid",
    174648, "#e8b94a", "upper", ('p', r'cup|NLEA'), gi="cornflakes",
    note="Upper-bound free sugars rule (all listed sugars assumed added).")
add("muesli", "Muesli", ["müsli", "musli", "muesli", "žitarice", "zitarice", "cereal"], "solid",
    169076, "#c9a56c", "null", ('g', 60, "1 bowl", "our assumption: the USDA 'cup' is 122 g; EU packs give 40-50 g"), gi="muesli",
    note="Contains dried fruit (not free sugars) plus possibly added sugar; no split available, null.")
add("crackers", "Crackers (saltines)", ["krekeri", "slani keksi", "cracker", "crackers", "grisini"], "solid",
    "Crackers, saltines (includes oyster, soda, soup)", "#e4cf9a", "null", ('p', r'.'))
add("pancake", "Pancakes (US-style)", ["pancakes", "pancake", "american pancakes", "američke palačinke", "americke palacinke"], "solid",
    "Pancakes, plain, prepared from recipe", "#e9c98a", "upper", ('p', r'4" dia|medium|\d'), proxy=True, gi="a1_pancakes",
    note="PROXY for palačinke: a US fluffy pancake from recipe (baking powder, 4-inch); crêpes are thinner. Upper-bound rule (sugar in recipe).")

# ---------------- MEAT / FISH ----------------
add("chicken-breast", "Chicken breast (roasted)", ["piletina", "pileća prsa", "pilece prsa", "chicken breast", "chicken", "piletina prsa", "pile", "meat"], "solid",
    "Chicken, broilers or fryers, breast, meat only, cooked, roasted", "#f0dcc0", "none", ('p', r'breast|half', "½ breast"))
# audit 2026-10-17: serving was the USDA reference "3 oz" (85 g), not a steak. 200 g raw is our assumed restaurant
# size; cooked weight from THIS record's USDA yield (1 lb raw with refuse → 306 g cooked, factor 0.675).
add("beef-steak", "Beef steak (grilled)", ["biftek", "goveđi odrezak", "govedi odrezak", "steak", "govedina", "beef", "odrezak", "beef steak"], "solid",
    168727, "#8a4a2a", "none", ('g', 135, "1 steak (200 g raw)", "our assumption: 200 g raw × USDA cooking yield 306/453.6"))
# audit 2026-10-17: sodium from EU product labels (override below; the proxy patty is unsalted, Na 83 mg). Raw cooking
# words "ground meat", "minced meat", "mljeveno meso" removed (raw mince is not a salted cooked dish). Serving in
# pieces: the Sarajevo ćevapi specification gives 10 pieces = 200-250 g (Wikipedia, ref. 38), i.e. 22.5 g raw per
# piece; × the USDA raw→cooked mass factor of this beef (protein 17.17 → 24.04 g/100 g, 0.714) = 16 g cooked.
add("cevapi", "Ćevapi (grilled ground meat)", ["ćevapi (grilled minced meat)", "ćevapi", "cevapi", "ćevapčići", "cevapcici", "ćevap", "cevap", "ćevapa", "cevapa"], "solid",
    "Beef, ground, 80% lean meat / 20% fat, patty, cooked, pan-broiled", "#a35a35", "none",
    ('g', 80, "5 pieces", "our assumption: 5 × 16 g cooked (see piece)"), proxy=True,
    piece=("piece", 16, "Sarajevo specification 10 pieces = 200-250 g raw (Wikipedia 'Ćevapi', ref. 38); × USDA raw→cooked factor 0.714"),
    note="PROXY: USDA has no ćevapi record. Ground beef 80/20 pan-broiled patty is the closest class (Sarajevo ćevapi are beef; Croatian ones often beef + pork or lamb). Sodium from EU ćevapčići labels (override).")
add("pork-chop", "Pork chop / loin (roasted)", ["svinjetina", "svinjski kotlet", "kotlet", "pork", "svinjsko meso", "pork chop", "svinjski", "meso", "mesa"], "solid",
    "Pork, fresh, loin, whole, separable lean and fat, cooked, roasted", "#d6a888", "none", ('p', r'chop|oz|slice', "1 chop"))
add("lamb-roast", "Lamb (roasted)", ["janjetina", "janjeće", "janjece", "lamb", "janje"], "solid",
    174312, "#9a5a3a", "none", ('p', r'oz|cup|slice'))
# audit 2026-10-17: was 171986 "canned in water, WITHOUT SALT" (Na 50 mg); EU canned tuna is salted.
# Data round 2 (2026-10-19): the USDA "1 can" (165 g drained) is a US 5-oz can. Croatian/EU cans are mostly 80 g
# (Eva "2 x 80 g", Rio Mare "80g" on Open Food Facts 3850104301353, 8004030348738). Irish Food Portion Sizes Database
# (Lyons & Giltinan 2013, IUNA; NANS 2008-2010, adults 18-64, Table 4): "Canned salmon/tuna 210 80 50-105" = median
# 80 g, IQR 50-105 g per eating occasion. Serving → 80 g. Default stays canned in WATER: we read no Croatian sales split
# of water vs oil, and the water record is drained fish; oil is one tap away (owner may decide otherwise).
add("tuna-canned", "Tuna (canned in water)", ["tuna", "tuna iz konzerve", "tunjevina", "tuna konzerva", "riba"], "solid",
    173709, "#d9b8a0", "none", ('g', 80, "1 portion, 80 g", "survey: Irish Food Portion Sizes Database 2013 (IUNA, adults 18-64), canned tuna median 80 g, IQR 50-105 g; EU cans are mostly 80 g"))
add("salmon", "Salmon (cooked)", ["losos", "salmon", "riba", "pečeni losos"], "solid",
    "Fish, salmon, Atlantic, farmed, cooked, dry heat", "#f08a5a", "none", ('p', r'fillet|oz', "½ fillet"))
add("cod", "Cod / white fish (cooked)", ["bakalar", "oslić", "oslic", "bijela riba", "cod", "riba", "white fish", "fish"], "solid",
    "Fish, cod, Atlantic, cooked, dry heat", "#efe8da", "none", ('p', r'fillet|oz'))
add("sardines", "Sardines (canned in oil)", ["sardine", "srdele", "sardines", "riba", "plava riba"], "solid",
    "Fish, sardine, Atlantic, canned in oil, drained solids with bone", "#b8a89a", "none", ('p', r'can|sardine|oz'))
# audit 2026-10-17: "pureća šunka" (turkey ham) removed; "hrenovka" removed from sausage (it won the tie over frankfurter)
add("ham", "Ham (sliced)", ["šunka", "sunka", "ham", "narezak"], "solid",
    "Ham, sliced, regular (approximately 11% fat)", "#e8a7a0", "null", ('p', r'slice|oz'))
add("sausage", "Sausage (pork, cooked)", ["kobasica", "kobasice", "sausage", "kranjska"], "solid",
    174577, "#b86a4a", "null", ('p', r'link|oz|sausage'), note="USDA record: Polish sausage, pork (smoked); proxy for kranjska-type sausage.")
# audit 2026-10-17: was 174614 "Frankfurter, beef"; Croatian hrenovke are pork/poultry.
add("frankfurter", "Frankfurter / hot-dog sausage", ["hrenovke", "hrenovka", "hot dog kobasica", "frankfurter", "hot dog", "virsla"], "solid",
    171633, "#d98a70", "null", ('p', r'frankfurter|oz'))
add("salami", "Salami (dry, pork)", ["salama", "salami", "kulen", "narezak"], "solid",
    "Salami, dry or hard, pork", "#a8403a", "null", ('p', r'slice'))
add("bacon", "Bacon (cooked)", ["slanina", "bacon", "pancetta", "panceta"], "solid",
    "Pork, cured, bacon, cooked, baked", "#c0603c", "null", ('p', r'slice'))
add("tofu", "Tofu (firm)", ["tofu", "sojin sir"], "solid",
    "Tofu, raw, firm, prepared with calcium sulfate", "#f3ecd5", "none", ('p', r'cup|oz|slice', "1 portion, 126 g"))

# ---------------- LEGUMES / VEG ----------------
add("beans-kidney", "Kidney beans (boiled)", ["grah", "crveni grah", "kidney beans", "beans", "grah kuhani", "fižol"], "solid",
    "Beans, kidney, red, mature seeds, cooked, boiled, without salt", "#7a2f2a", "none", ('p', r'cup'), gi="kidney_beans")
add("beans-white", "White beans (boiled)", ["bijeli grah", "bijeli grah kuhani", "white beans", "beans", "grah", "tavče gravče"], "solid",
    "Beans, white, mature seeds, cooked, boiled, without salt", "#ece4cc", "none", ('p', r'cup'), gi="a1_white_beans")
# audit 2026-10-17: removed "lećа" (Cyrillic а, U+0430) and "grah" (beans); "leblebije" (roasted dry chickpea snack, ~360 kcal) removed from boiled chickpeas
add("lentils", "Lentils (boiled)", ["leća", "leca", "lentils"], "solid",
    "Lentils, mature seeds, cooked, boiled, without salt", "#a8794a", "none", ('p', r'cup'), gi="lentils")
add("chickpeas", "Chickpeas (boiled)", ["slanutak", "slanutak kuhani", "chickpeas", "garbanzo"], "solid",
    "Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt", "#d9bf84", "none", ('p', r'cup'), gi="chickpeas")
add("peas", "Green peas (boiled)", ["grašak", "grasak", "peas", "green peas", "zeleni grašak"], "solid",
    "Peas, green, cooked, boiled, drained, without salt", "#7aa83a", "none", ('p', r'cup'), gi="a1_peas")
add("hummus", "Hummus", ["humus", "hummus"], "semi",
    "Hummus, commercial", "#dcc088", "null", ('p', r'tbsp|cup'), gi="a1_hummus")
add("salad-lettuce", "Green salad (lettuce)", ["zelena salata", "salata", "lettuce", "salad", "zelena", "salata zelena"], "solid",
    "Lettuce, cos or romaine, raw", "#7fb04a", "none", ('p', r'cup|leaf|head'), note="Raw lettuce only; dressings not included.")
add("cabbage", "Cabbage (raw)", ["kupus", "svježi kupus", "svjezi kupus", "cabbage", "salata od kupusa", "kupus salata"], "solid",
    "Cabbage, raw", "#cfe0a8", "none", ('p', r'cup'))
add("sauerkraut", "Sauerkraut", ["kiseli kupus", "kiseli kupus salata", "sauerkraut", "kiseli"], "solid",
    "Sauerkraut, canned, solids and liquids", "#e6e3b8", "none", ('p', r'cup'))
add("tomato", "Tomato", ["rajčica", "rajcica", "tomato", "paradajz", "pomidor", "tomatoes", "rajčice"], "solid",
    "Tomatoes, red, ripe, raw, year round average", "#d8321f", "none", ('p', r'medium whole'))
add("cucumber", "Cucumber", ["krastavac", "krastavci", "cucumber", "krastavac svježi"], "solid",
    "Cucumber, with peel, raw", "#9cc47a", "none", ('p', r'cucumber|medium|large|cup'))
add("carrot", "Carrot (raw)", ["mrkva", "mrkva sirova", "carrot", "carrots"], "solid",
    "Carrots, raw", "#ee8a1f", "none", ('p', r'medium|large'), gi="a1_carrot_raw",
    note="GI: Atkinson 2008 Suppl. Table A1 row 1621 'Carrots, raw, diced' 35 ± 5 (7 healthy subjects, single test); raw ground carrots tested 39 ± 1 (row 1622). Table 1's 39 for 'carrots, boiled' is a mean of raw and boiled tests.")
add("broccoli", "Broccoli (raw)", ["brokula", "brokoli", "broccoli"], "solid",
    "Broccoli, raw", "#4f8a3a", "none", ('p', r'cup|stalk|spear'))
# audit 2026-10-17: "bijeli luk" (= garlic) removed
add("onion", "Onion", ["luk", "crveni luk", "onion", "onions"], "solid",
    "Onions, raw", "#e9dcc0", "none", ('p', r'medium|cup'))
add("pepper-red", "Red bell pepper", ["paprika", "crvena paprika", "bell pepper", "pepper", "paprike", "babura"], "solid",
    "Peppers, sweet, red, raw", "#cf2a1f", "none", ('p', r'medium|large|cup'))
# audit 2026-10-17: was raw spinach, 1 cup = 30 g; in Croatia špinat is eaten cooked (per 100 g almost identical:
# 23 kcal both). "blitva" (Swiss chard: Na 213 vs 70 mg) removed.
add("spinach", "Spinach (cooked)", ["špinat", "spinat", "spinach", "kuhani špinat", "kuhani spinat", "cooked spinach"], "solid",
    "Spinach, cooked, boiled, drained, without salt", "#3f7a2a", "none", ('p', r'cup', "1 side portion, 180 g"))
add("zucchini", "Zucchini", ["tikvice", "tikvica", "zucchini", "courgette"], "solid",
    "Squash, summer, zucchini, includes skin, raw", "#9bbf5a", "none", ('p', r'medium|cup'))
add("mushrooms", "Mushrooms (white, raw)", ["gljive", "šampinjoni", "sampinjoni", "mushrooms", "pečurke", "pecurke"], "solid",
    "Mushrooms, white, raw", "#e4d9c8", "none", ('p', r'cup|medium|large'))
add("sweet-corn", "Sweet corn (boiled)", ["kukuruz šećerac", "kukuruz secerac", "kukuruz", "sweet corn", "corn", "kukuruz kuhani"], "solid",
    "Corn, sweet, yellow, cooked, boiled, drained, without salt", "#f0cf3a", "none", ('p', r'cup|ear'), gi="sweet_corn")
add("sweet-potato", "Sweet potato (boiled)", ["batat", "slatki krumpir", "sweet potato", "slatki krompir"], "solid",
    "Sweet potato, cooked, boiled, without skin", "#e8883a", "none", ('p', r'^medium'), gi="sweet_potato")
# audit 2026-10-17: serving was ONE olive (4.4 g); now 5 large olives, and a typed number counts olives.
# Sodium from EU black-olive labels (override below); USDA US lye-cured ripe olives have 735 mg.
add("olives", "Black olives", ["masline", "olive", "olives", "crne masline", "black olives"], "solid",
    "Olives, ripe, canned (small-extra large)", "#3a3a2a", "none",
    ('g', 22, "5 olives", "our assumption: 5 × USDA 'large' olive (4.4 g)"),
    piece=("olive", 4.4, "USDA SR Legacy food_portion 'large' = 4.4 g"),
    note="USDA ripe (black) olives, canned. Sodium from EU labels; energy and fat are the USDA values (EU black olives in brine are labelled 125-169 kcal, 13-18 g fat per 100 g).")
add("olive-oil", "Olive oil", ["maslinovo ulje", "ulje", "olive oil", "maslinovo", "oil"], "liquid",
    "Oil, olive, salad or cooking", "#c8b43a", "none", ('p', r'tablespoon'))
add("vegetable-soup", "Vegetable soup", ["juha od povrća", "juha od povrca", "povrtna juha", "vegetable soup", "soup", "juha"], "semi",
    174564, "#d98a3a", "null", ('p', r'cup', "1 bowl, 241 g"), gi="veg_soup", proxy=True,
    note="Canned vegetable soup prepared with water; proxy for home-made soup.")
# audit 2026-10-17: "goveđa juha" (beef soup) removed from chicken noodle soup
add("chicken-soup", "Chicken noodle soup", ["pileća juha", "pilece juha", "juha", "chicken soup", "soup", "juha s rezancima"], "semi",
    "Soup, chicken noodle, canned, prepared with equal volume water", "#e8c870", "null", ('p', r'cup', "1 bowl, 248 g"), proxy=True,
    note="Canned, prepared with water; proxy for home-made broth soup.")
# audit 2026-10-17: free sugars "upper" (Campbell's-type condensed tomato soup contains added sugar/HFCS; was null = counted as 0)
add("tomato-soup", "Tomato soup", ["juha od rajčice", "juha od rajcice", "tomato soup", "soup", "juha"], "semi",
    171176, "#d8532a", "upper", ('p', r'cup', "1 bowl, 248 g"), gi="a1_tomato_soup",
    note="Upper-bound free sugars: all sugars counted as added (part of it is natural tomato sugar).")
add("bean-soup", "Bean soup (with ham)", ["grah juha", "pasulj", "jota", "bean soup", "soup", "juha", "grah varivo"], "semi",
    "Soup, bean with ham, canned, chunky, ready-to-serve", "#9a6a3c", "null", ('p', r'cup'), proxy=True, note="PROXY: canned bean-with-ham soup for Croatian 'grah varivo'.")

# ---------------- FRUIT ----------------
add("apple", "Apple", ["jabuka", "jabuke", "apple", "apples"], "solid", 171688, "#c8e06a", "none", ('p', r'medium'), gi="apple")
add("banana", "Banana", ["banana", "banane", "bananas"], "solid", "Bananas, raw", "#f1de8c", "none", ('p', r'medium'), gi="banana")
add("orange", "Orange", ["naranča", "naranca", "narance", "orange", "oranges", "naranče"], "solid",
    "Oranges, raw, all commercial varieties", "#f59a1c", "none", ('p', r'fruit|medium'), gi="orange")
add("mandarin", "Mandarin", ["mandarina", "mandarine", "mandarin", "tangerine", "clementine"], "solid",
    "Tangerines, (mandarin oranges), raw", "#f6891c", "none", ('p', r'medium'), gi="t21_mandarin")
add("grapes", "Grapes", ["grožđe", "grozde", "grapes", "groždje", "grozdje"], "solid",
    "Grapes, red or green (European type, such as Thompson seedless), raw", "#8fb04a", "none", ('p', r'cup'), gi="a1_grapes")
add("strawberries", "Strawberries", ["jagode", "jagoda", "strawberries", "strawberry"], "solid",
    "Strawberries, raw", "#d6283a", "none", ('p', r'cup|medium'), gi="a1_strawberries")
# audit 2026-10-17: serving was "1 cup, balls" (154 g) because 'cup' matched first; a slice is the USDA wedge.
add("watermelon", "Watermelon", ["lubenica", "lubenice", "watermelon", "dinja lubenica"], "solid",
    "Watermelon, raw", "#e84a5a", "none", ('p', r'wedge', "1 slice (1/16 of a melon)"), gi="watermelon")
add("melon", "Melon (cantaloupe)", ["dinja", "dinje", "melon", "cantaloupe"], "solid",
    "Melons, cantaloupe, raw", "#f4b872", "none", ('p', r'cup|wedge'), gi="a1_melon")
add("pear", "Pear", ["kruška", "kruska", "kruške", "pear", "pears"], "solid",
    "Pears, raw", "#c9d46a", "none", ('p', r'medium'), gi="t21_pear")
# audit 2026-10-17: "nektarina" (own USDA record, 44 vs 39 kcal) removed; "višnje" (sour cherries) removed from sweet cherries
add("peach", "Peach", ["breskva", "breskve", "peach", "peaches"], "solid",
    "Peaches, yellow, raw", "#f4b05a", "none", ('p', r'medium'), gi="t21_peach")
add("cherries", "Cherries (sweet)", ["trešnje", "tresnje", "cherries", "cherry"], "solid",
    "Cherries, sweet, raw", "#9a1a2e", "none", ('p', r'NLEA', "1 bowl, 140 g"), gi="a1_cherries")
add("plum", "Plum", ["šljiva", "sljiva", "šljive", "sljive", "plum", "plums"], "solid",
    "Plums, raw", "#6a2a5a", "none", ('p', r'fruit|medium'))
add("kiwi", "Kiwi", ["kivi", "kiwi", "kiwifruit"], "solid",
    "Kiwifruit, green, raw", "#8aa83a", "none", ('p', r'medium|fruit'), gi="a1_kiwi")
add("pineapple", "Pineapple", ["ananas", "pineapple"], "solid",
    "Pineapple, raw, all varieties", "#f2d44a", "none", ('p', r'cup|slice'), gi="pineapple")
add("blueberries", "Blueberries", ["borovnice", "borovnica", "blueberries", "blueberry"], "solid",
    "Blueberries, raw", "#4a4a8a", "none", ('p', r'cup'), gi="t21_blueberries")
# audit 2026-10-17: was 'all commercial varieties' with "1 avocado, NS as to Florida or California" = 201 g; the EU
# market is mostly Hass (California): 1 fruit without skin and seed = 136 g. One whole avocado per serving, so
# "1 avokado" means one; "pola avokada" gives half.
add("avocado", "Avocado", ["avokado", "avocado"], "solid",
    "Avocados, raw, California", "#a8b84a", "none", ('p', r'fruit', "1 avocado (without skin and seed)"), note="USDA California (Hass) avocado.")
add("raisins", "Raisins", ["grožđice", "grozdice", "suho grožđe", "suho grozde", "raisins", "dried fruit", "sušeno voće", "suseno voce"], "solid",
    168165, "#4a2a1a", "none", ('p', r'small box'), gi="a1_raisins",
    note="Dried whole fruit: not free sugars under the WHO definition as quoted in foods.md G1 (juices, honey, syrups, added sugars).")
# audit 2026-10-17: bare "marelice" (fresh apricots, ~48 kcal) and "smokve"/"smokva" (fresh figs, ~74 kcal) removed from the dried fruit
add("dried-apricots", "Dried apricots", ["suhe marelice", "sušene marelice", "dried apricots", "dried fruit", "sušeno voće", "suseno voce"], "solid",
    "Apricots, dried, sulfured, uncooked", "#d9822a", "none", ('g', 40, "1 handful", "our assumption (the USDA 'cup, halves' is 130 g)"), gi="a1_dried_apricots")
add("dried-figs", "Dried figs", ["suhe smokve", "dried figs", "dried fruit", "sušeno voće", "suseno voce"], "solid",
    "Figs, dried, uncooked", "#6a4a3a", "none", ('g', 40, "1 handful", "our assumption (the USDA 'cup' is 149 g)"), gi="a1_dried_figs")
add("dates", "Dates", ["datulje", "dates", "datulja", "dried fruit"], "solid",
    "Dates, deglet noor", "#5a3418", "none", ('p', r'date|cup'), gi="dates")

# ---------------- NUTS / SPREADS ----------------
add("almonds", "Almonds", ["bademi", "badem", "almonds", "nuts", "orašasti plodovi"], "solid",
    "Nuts, almonds", "#c9a070", "none", ('p', r'oz|cup'))
add("walnuts", "Walnuts", ["orasi", "orah", "walnuts", "nuts", "orašasti plodovi"], "solid",
    "Nuts, walnuts, english", "#b08a5a", "none", ('p', r'oz|cup'))
add("hazelnuts", "Hazelnuts", ["lješnjaci", "ljesnjaci", "lješnjak", "hazelnuts", "nuts", "orašasti plodovi"], "solid",
    "Nuts, hazelnuts or filberts", "#b88a4a", "none", ('p', r'oz|cup'))
add("peanuts", "Peanuts (roasted)", ["kikiriki", "peanuts", "nuts", "kikiriki pečeni"], "solid",
    "Peanuts, all types, dry-roasted, with salt", "#c9a05a", "none", ('p', r'oz|cup'))
# audit 2026-10-17: "bundeva sjemenke" (pumpkin seeds; bare "bundeva" matched it by prefix) removed
add("sunflower-seeds", "Sunflower seeds", ["sjemenke suncokreta", "sjemenke", "suncokret", "sunflower seeds"], "solid",
    "Seeds, sunflower seed kernels, dried", "#d8c48a", "none", ('g', 30, "1 handful", "our assumption (the USDA 'cup' is 140 g)"))
# audit 2026-10-17: free sugars "upper" (US smooth peanut butter has 10.5 g sugar vs 4.9 g in the peanuts; was null = 0)
add("peanut-butter", "Peanut butter", ["maslac od kikirikija", "peanut butter", "kikiriki maslac", "putar od kikirikija"], "semi",
    174266, "#b88a4a", "upper", ('p', r'tbsp'), note="Upper-bound free sugars: all sugars counted as added (dry-roasted peanuts alone have 4.9 g/100 g).")
# audit 2026-10-17: USDA 168000 gives 28.4 g saturated fat (96% of the fat), which contradicts the Ferrero label
# (10.6 g); the whole row now comes from the Ferrero label (override below). Serving: the label portion, 15 g.
add("nutella", "Hazelnut chocolate spread", ["nutella", "krem namaz", "čokoladni namaz", "cokoladni namaz", "plazma namaz", "chocolate spread"], "semi",
    168000, "#5a3220", "upper", ('g', 15, "1 portion (1 tbsp)", "label: Ferrero Nutella portion 15 g"), gi="a1_nutella",
    note="Upper-bound rule: sugar is the main ingredient, milk lactose is small.")

# ---------------- SWEETS / SNACKS ----------------
# audit 2026-10-17: free-sugar rule minusLactose → upper. USDA gives no lactose for this record, so the rule fell to
# null, while the health bars counted all sugars; both now use the same upper bound.
add("chocolate-milk-bar", "Milk chocolate", ["mliječna čokolada", "mlijecna cokolada", "čokolada", "cokolada", "milk chocolate", "chocolate"], "solid",
    "Candies, milk chocolate", "#6a3a22", "upper", ('p', r'1\.55'), gi="chocolate", note="GI is the generic Table 1 'chocolate' value (40), not milk-chocolate specific. Upper-bound free sugars (milk lactose, maybe 8-10 g/100 g, is included).")
add("chocolate-dark", "Dark chocolate (70-85% cacao)", ["tamna čokolada", "tamna cokolada", "gorka čokolada", "dark chocolate", "čokolada", "cokolada", "chocolate"], "solid",
    "Chocolate, dark, 70-85% cacao solids", "#3a1c10", "minusLactose", ('g', 40, "4 squares", "our assumption: 4 squares of a 100 g bar of 10 g squares"), gi="chocolate", note="GI is the generic Table 1 'chocolate' value (40).")
add("ice-cream", "Ice cream (vanilla)", ["sladoled", "ice cream", "vanilla ice cream", "sladoled vanilija"], "semi",
    167575, "#f6ecc8", "minusLactose", ('p', r'cup|scoop|bar', "1 portion, 66 g"), gi="ice_cream")
# audit 2026-10-17: "biskvit" (= sponge cake in Croatian) removed from cookies
add("biscuits", "Butter cookies", ["butter biscuits / cookies", "keksi", "cookies", "biscuits", "keks", "kolačići", "kolacici", "petit beurre"], "solid",
    "Cookies, butter, commercially prepared, enriched", "#e0b878", "upper", ('p', r'cookie|oz'))
add("croissant", "Croissant", ["kroasan", "croissant", "kroasani", "pastry", "pastries"], "solid",
    "Croissants, butter", "#e2b25e", "null", ('p', r'medium'), gi="t21_croissant", note="Contains added sugar in dough but USDA gives no split; null.")
add("cake-sponge", "Sponge cake", ["torta", "kolač", "kolac", "biskvit torta", "cake", "sponge cake", "kolači"], "solid",
    "Cake, sponge, commercially prepared", "#f0d890", "upper", ('p', r'piece'), gi="a2_sponge")
# audit 2026-10-17: a Croatian krafna is jam-filled; was the US glazed doughnut 172758 (421 kcal, 60 g).
add("doughnut", "Doughnut (jam-filled)", ["krafna", "krafne", "doughnut", "donut", "krafna s marmeladom", "jelly doughnut"], "solid",
    172759, "#d9a85a", "upper", ('p', r'oval', "1 doughnut"), gi="a1_doughnut")
add("honey", "Honey", ["med", "honey"], "semi", "Honey", "#e8a31a", "all", ('p', r'tbsp'), gi="honey",
    note="WHO names sugars naturally present in honey as free sugars.")
add("sugar", "Sugar (white)", ["šećer", "secer", "sugar", "bijeli šećer", "kristal šećer", "white sugar", "saharoza"], "solid",
    "Sugars, granulated", "#f8f8f4", "all", ('p', r'^tsp'), gi="sucrose")
add("jam", "Jam / preserves", ["džem", "dzem", "marmelada", "jam", "preserves", "pekmez"], "semi",
    "Jams and preserves", "#a8283a", "all", ('p', r'tbsp'), gi="jam", note="GI is Table 1 'strawberry jam/jelly'.")
add("potato-chips", "Potato chips", ["potato chips (crisps)", "čips", "cips", "chips", "crisps", "potato chips", "grickalice", "snack", "snacks"], "solid",
    169677, "#e8c060", "none", ('p', r'oz|cup|10 chips'), gi="crisps",
    note="Free sugars none: plain salted crisps are potato, oil and salt (no added sugars), the same rule as fries.")
add("popcorn", "Popcorn (air-popped)", ["kokice", "kokice zrnje", "popcorn"], "solid",
    167959, "#f5ecc8", "none", ('p', r'cup', "1 cup, 8 g"), gi="popcorn")
add("rice-cakes", "Rice cakes", ["rižine galete", "rizine galete", "puffed rice", "rice cakes", "galete"], "solid",
    170250, "#e4d3a8", "none", ('p', r'cake|\d'), gi="rice_crackers",
    note="GI is Table 1 'rice crackers/crisps' (87), a different product; shown as nearest class.")

# ---------------- MEALS / FAST FOOD ----------------
# audit 2026-10-17: "pljeskavica" (a 150-250 g grilled patty, often in lepinja) removed
add("hamburger", "Hamburger (fast food)", ["hamburger", "burger", "hamburger fast food"], "solid",
    "McDONALD'S, Hamburger", "#b8803a", "null", ('p', r'sandwich|item|hamburger|\d'), gi="a1_hamburger", note="USDA record is McDonald's hamburger.")
add("kebab", "Kebab / doner", ["kebab", "döner", "doner", "gyros", "dener"], "solid",
    None, "#c9854a", "null", ('g', None, None, "no source"), proxy=True,
    note="COMPUTED: SR Legacy has no doner/gyros/kebab record. Since 2026-10-18 kebab is our builder (BUILD below): the values are its default (chicken in pita with tomato, onion and yogurt sauce), computed from USDA parts.")
# audit 2026-10-17: was 170308 (turkey + roast beef + ham sub); 170707 is the ham sub, matching "sa šunkom".
add("sandwich-ham", "Ham sandwich (sub)", ["sendvič", "sendvic", "sandwich", "sub", "sendvic sa sunkom", "sendvič sa šunkom", "ham sandwich"], "solid",
    170707, "#e8c888", "null", ('p', r'inch sub', "1 sub (15 cm)"), gi="white_bread_sub", note="US fast-food submarine sandwich, ham on white bread with lettuce and tomato.")


# ---------------- ALIAS OWNERS ----------------
# Folded spelling (lower case, no diacritics, đ → d) → the ONE food that owns it. The other foods keep their more
# specific names ("filter kava", "zeleni čaj"), so they still show up in suggestions, just not as an exact hit.
ALIAS_OWNER = {
    # drinks: Croatian "kava" is an espresso-based coffee; "sok" = juice, orange is Europe's most consumed juice
    # (AIJN 2012: "close to 40% of total consumption"); "čaj"/"tea" stays black tea (open question: herbal in HR?)
    "kava": "espresso", "kafa": "espresso", "crna kava": "espresso",
    "sok": "orange-juice", "juice": "orange-juice", "vocni sok": "orange-juice",
    "caj": "black-tea", "tea": "black-tea",
    "mlijeko": "milk-whole", "milk": "milk-whole",
    "biljno mlijeko": "soy-milk", "plant milk": "soy-milk",
    "kakao": "chocolate-milk",
    "vino": "red-wine", "wine": "red-wine",
    # dairy, eggs
    "jogurt": "yogurt-plain", "yogurt": "yogurt-plain", "yoghurt": "yogurt-plain",
    "sir": "cheese-gouda", "cheese": "cheese-cheddar", "gouda": "cheese-gouda",
    "egg": "egg-boiled", "eggs": "egg-boiled", "jaja": "egg-boiled",
    # starch
    "kruh": "bread-white", "bread": "bread-white",
    "pasta": "pasta", "tjestenina": "pasta",
    "riza": "rice-white", "rice": "rice-white",
    "krumpir": "potato-boiled", "potato": "potato-boiled",
    "zitarice": "cornflakes", "cereal": "cornflakes",
    # meat, fish ("riba" = a fish meal: cooked white fish, not a can of tuna)
    "riba": "cod", "narezak": "ham", "hrenovka": "frankfurter",
    # legumes, soups ("pasulj" is the bean stew)
    "grah": "beans-kidney", "beans": "beans-kidney", "pasulj": "bean-soup",
    "juha": "vegetable-soup", "soup": "vegetable-soup",
    # fruit, nuts, sweets
    "dried fruit": "raisins", "suseno voce": "raisins",
    "nuts": "almonds", "orasasti plodovi": "almonds",
    "cokolada": "chocolate-milk-bar", "chocolate": "chocolate-milk-bar",
}


# ---------------- OVERRIDES ----------------
# override(id, basis, values, level, text, source, url, note="", ranges=None)
#   basis: "per100g" | "per100ml" (converted with the serving density) | "perServing" (divided by serving grams)
#   values: field → number (or None = not declared on the label, shown as unknown)
#   level: evidence level for the app ("A" official/manufacturer label; "C" our calculation from labels)
#   text: the plain-English sentence the app shows under "How do we know?" (American English)
#   ranges: field → (low, high) per 100 g where products differ; the app shows the single value, the note the range
#   NOTE EU labels give carbohydrate WITHOUT fiber (USDA includes it), so a label row sets fiber to the label value
#   or None, never the USDA fiber on top of a label carbohydrate.
OVR = []
def override(id, basis, values, level, text, source, url, note="", ranges=None):
    OVR.append(dict(id=id, basis=basis, values=values, level=level, text=text, source=source, url=url, note=note, ranges=ranges or {}))

override("cola", "perServing", {"kcal": 139, "carbs": 35, "sugars": 35, "fat": 0, "satFat": 0, "caffeineMg": 32}, "A",
    "Cola: calories, sugar and caffeine are from the EU can label (139 kcal, 35 g sugar, 32 mg caffeine per 330 ml), not from USDA’s US cola.",
    "Coca-Cola Original Taste product sheet (CCEP GB); caffeine research/cola.md P5",
    "https://a.storyblok.com/f/43212/x/4a44e4815b/coca-cola-original-taste-8x330ml-product-information.pdf",
    note="Moved from the app (parse.ts labelFix, science/colaSim.ts COLA.eu) on 2026-10-17; a test keeps both equal.")
override("energy-drink", "per100ml", {"kcal": 46, "carbs": 11, "sugars": 11, "caffeineMg": 32}, "A",
    "Energy drink: calories, sugar and caffeine are from the Red Bull EU label (46 kcal, 11 g sugar per 100 ml; 80 mg caffeine per 250 ml can). USDA lists 75 mg per can.",
    "Red Bull Energy Drink 250 ml label (A.F. Blakemore foodservice sheet): 46.6 kcal, 11 g carbohydrate, 11 g sugars per 100 ml; 80 mg caffeine per 250 ml",
    "https://foodservice.afblakemore.net/energy-drinks/592279/red-bull-energy-drink-250ml/",
    note="Monster (500 ml can, alias_serving): Monster Energy UK/EU label 47 kcal, 12 g carbohydrate, 11 g sugars per 100 ml (onestop.co.uk sheet, EAN 5060166690007) and 32 mg/100 ml caffeine (kifli.hu listing), i.e. the same per 100 ml within 1 kcal / 1 g.")
override("nutella", "per100g", {"kcal": 539, "fat": 30.9, "satFat": 10.6, "carbs": 57.5, "sugars": 56.3, "protein": 6.3, "sodiumMg": 43, "fiber": None}, "A",
    "Hazelnut spread: values are from the Ferrero Nutella label (per 100 g: 539 kcal, 30.9 g fat of which 10.6 g saturated, 56.3 g sugar). USDA’s generic record lists 28 g saturated fat, which the label contradicts.",
    "Ferrero Foodservice UK, Nutella 3 kg: per 100 g 539 kcal, fat 30.9 g, saturates 10.6 g, carbohydrate 57.5 g, sugars 56.3 g, protein 6.3 g, salt 0.107 g; portion 15 g",
    "https://www.ferrerofoodservice.com/uk/en/products/nutella/nutella-3kg",
    note="Sodium = salt 0.107 g / 2.5 = 43 mg. Fiber is not declared on the label (None); EU carbohydrate excludes fiber.")
override("cheese-parmesan", "per100g", {"sodiumMg": 650}, "A",
    "Parmesan: sodium is the Parmigiano Reggiano Consortium value (650 mg per 100 g). USDA’s US parmesan has 1,175 mg.",
    "Parmigiano Reggiano Consortium, Nutritional features: per 100 g salt 1.6 g, sodium 650 mg",
    "https://www.parmigianoreggiano.com/made/nutritional_features/default.aspx",
    note="Only sodium is replaced. The Consortium also gives 402 kcal, 32.4 g protein, 29.7 g fat (19.6 g saturated) vs USDA 392 / 35.8 / 25.0 (14.8).")
override("olives", "per100g", {"sodiumMg": 1000}, "C",
    "Olives: sodium is the middle of three EU black-olive labels (800–1,200 mg per 100 g). USDA’s US olives have 735 mg.",
    "Open Food Facts label data: Tesco Pitted Black Olives (EAN 5050179405767) salt 2.015 g; Fragata pitted olives with sea salt (8410134020317) salt 2 g; Serpis Aceitunas negras cacereñas (8410344320016) salt 3 g per 100 g",
    "https://world.openfoodfacts.org/product/8410344320016",
    note="Na = salt / 2.5: 806, 800, 1200 mg; midpoint of the range 800-1200 = 1000.", ranges={"sodiumMg": (800, 1200)})
override("cevapi", "per100g", {"sodiumMg": 742}, "C",
    "Ćevapi: the USDA stand-in (unsalted ground beef) has almost no salt. Sodium is from EU ćevapčići labels (1.25–1.70 g salt per 100 g raw), scaled to grilled weight with USDA’s raw-to-cooked ratio for this beef: about 740 mg per 100 g (range 630–860).",
    "Labels per 100 g raw: Culinea/Lidl beef ćevapčići 1.25 g salt (Open Food Facts 4056489117063); ja! Rewe ćevapčići 1.27 g (4388860565164); Culinea 1.5 g (20001759); Rewe ćevapčići gewürzt 1.70 g (wikifit.de). USDA 174036 raw vs 171798 cooked: Na 66 → 83 mg",
    "https://world.openfoodfacts.org/product/4388860565164/cevapcici-ja",
    note="Raw Na 500-680 mg (salt × 400), midpoint 590 × 83/66 = 742 mg cooked; range 629-855.", ranges={"sodiumMg": (629, 855)})
override("burek", "per100g", {"kcal": 297, "fat": 16, "satFat": 7.5, "carbs": 29, "sugars": 3.3, "protein": 9.7, "sodiumMg": 560, "fiber": None}, "B",
    "Burek: there is no USDA burek, so the values are from a Croatian producer’s cheese burek (Čakovečki mlinovi: 297 kcal, 16 g fat, 3.3 g sugar per 100 g). The web table does not print “per 100 g”, but EU law requires nutrition per 100 g, and the same table format gives a 400 g loaf 222 kcal, which can only be per 100 g. Burek varies: labels range from about 250 to 320 kcal per 100 g.",
    "Čakovečki mlinovi, Burek (net weight 150 g; “slojevi tijesta i sirnog nadjeva”, layers of dough and cheese filling): energy 1241 kJ / 297 kcal, fat 16 g, saturates 7.5 g, carbohydrate 29 g, sugars 3.3 g, protein 9.7 g, salt 1.4 g. Basis: Regulation (EU) 1169/2011 Art. 32(2) “shall be expressed per 100 g or per 100 ml”. Range: Sofka beef burek 247 kcal, Lidl meat burek 316 kcal (Open Food Facts 9120018535583, 4056489610953)",
    "https://cak-mlinovi.hr/en/kategorija_proizvoda/baked-goods/",
    note="Sodium = 1.4 / 2.5 = 560 mg. Fiber not declared (None). Water stays from the USDA turnover proxy. Basis checked 2026-10-19 on the producer's web page (EN and HR), not on the pack: the table has no column header; per 100 g follows from EU 1169/2011 Art. 32(2), from Atwater (16×9 + 29×4 + 9.7×4 = 299 kcal ≈ 297, i.e. 54.7 g of macros per 100 g, plausible for burek), from the same page's 400 g breads at 222 and 260 kcal (per 100 g), and from other burek labels (247-316 kcal/100 g); per piece it would be 198 kcal/100 g, below every label. Level B until read on the pack.",
    ranges={"kcal": (247, 316), "sugars": (2.2, 3.4)})


# ======================= VARIANTS, SIZES, ADD-INS, BUILDERS, CHOOSERS (2026-10-18) =======================
# Built by build_variants.py (called from build_fooddb.py build). Plan: research/audit/VARIANTS-PLAN.md; what was
# built and why: research/audit/VARIANTS-DONE.md. A variant keeps the base id and adds a key v ("beer.radler").
# Every variant has a USDA SR Legacy record (checked with usda_sr.py) or is OUR recipe with stated grams (level C).
# Amounts of toppings/add-ins are "our estimate" with a range; the reason is in the src text shown under
# "How do we know?". Variant names have no parentheses (the app's shortName strips them).
VARS, ASK, SIZES, ADDIN, ADDINS_OF, BUILD, CHOOSE = {}, {}, {}, {}, {}, {}, []
# foods whose old values change on purpose (the build's gate fails on any other change)
CHANGED_ON_PURPOSE = {}

def ask(base, question, chip):
    ASK[base] = (question, chip)

def var(base, v, chip, name, usda=None, recipe=None, serving=None, words=(), aliases=(), gi=None, free=None, proxy=False,
        kind=None, color=None, text="", note="", rng=None, atwater_ok=False):
    """usda: own record (serving defaults to the base serving spec, resolved on THIS record). recipe: [(ref, amount)]
    with serving=('g', None, label, why) for the label. gi: a GI key, "inherit" (the base GI), or None (not inherited)."""
    VARS.setdefault(base, []).append(dict(v=v, chip=chip, name=name, usda=usda, recipe=recipe, serving=serving, words=list(words),
        aliases=list(aliases), gi=gi, free=free, proxy=proxy, kind=kind, color=color, text=text, note=note, rng=rng, atwater_ok=atwater_ok))

def size(base, opts, text, cite, url="https://fdc.nal.usda.gov/", level="C"):
    """opts: (key, label, mult) or (key, label, "ml", ml). The default serving must be one of them."""
    SIZES[base] = dict(opts=opts, text=text, cite=cite, url=url, level=level)

def addin(k, label, ref, grams, unit, words, text, cite, url, level="C", max=2, excl=None):
    ADDIN[k] = dict(label=label, ref=ref, grams=grams, unit=unit, words=words, text=text, cite=cite, url=url, level=level, max=max, excl=excl)

def addins(base, keys):
    ADDINS_OF[base] = list(keys)

def chooser(k, question, opts, words=()):
    """opts: [(food id or "id.v", chip)]; the first option of the word's ALIAS_OWNER is what the app starts on."""
    CHOOSE.append(dict(k=k, ask=question, opts=opts, words=list(words)))

def opt(k, chip, name, ref, grams=None, src="", rng=None, on=False, words=(), aliases=(), level="C", cite=None, url=None, gi=None, gi_why=None):
    """gi (data round 3): a GI key (build_fooddb GI / GI_SUPP) that REPLACES the part's own GI inside this builder, with
    gi_why (plain English, shown in the option's source text). Used where a whole food was measured (pizza, burger:
    every carb-bearing part counts at the measured whole-food GI) or where a part's own record has no GI key."""
    return dict(k=k, chip=chip, name=name, ref=ref, grams=grams, src=src, rng=rng, on=on, words=list(words), aliases=list(aliases), level=level, cite=cite, url=url,
                gi=gi, gi_why=gi_why)

def grp(k, label, opts, one=False):
    return dict(k=k, label=label, opts=opts, one=one)

def preset(k, chip, name, on, aliases=(), words=()):
    return dict(k=k, chip=chip, name=name, on=list(on), aliases=list(aliases), words=list(words))

def builder(base, title, groups, note, presets=(), unit="", ask=None, base_is_default=False, serving_label=None, cite=None, url=None):
    BUILD[base] = dict(title=title, groups=groups, note=note, presets=list(presets), unit=unit, ask=ask,
                       base_is_default=base_is_default, serving_label=serving_label, **({"cite": cite} if cite else {}), **({"url": url} if url else {}))

USDA_FDC = "https://fdc.nal.usda.gov/"

# ---------------- ALCOHOL ----------------
ask("beer", "Which beer?", "Lager")
var("beer", "light", "Light", "Light beer", usda=168749, words=["light", "lagano", "lagani"],
    aliases=["light beer", "lagano pivo", "light pivo"], note="US light beer, about 4% alcohol.")
var("beer", "strong", "Strong", "Strong beer", usda=171906, words=["jako", "jako pivo", "strong"],
    aliases=["strong beer", "jako pivo", "jaka piva"],
    text="Strong beer: values from the USDA record “Alcoholic beverages, beer, higher alcohol”: 7.7 g alcohol per 100 g, about 9–10% by volume. Many strong beers are 6–8%, so this is the upper end.")
var("beer", "alcohol-free", "Alcohol-free", "Alcohol-free beer", usda=174863,
    words=["bezalkoholno", "bezalkoholni", "alcohol-free", "non-alcoholic", "0.0", "nula"],
    aliases=["bezalkoholno pivo", "bezalkoholno", "alcohol-free beer", "non-alcoholic beer", "alcohol free beer", "pivo bez alkohola"],
    rng={"kcal": (105, 186)},
    text="Alcohol-free beer: values from the USDA record “Malt beverage, includes non-alcoholic beer” (37 kcal and 8 g sugar per 100 g, 0.3 g alcohol). European alcohol-free lagers are often lighter: Heineken 0.0 lists 21 kcal and 4.8 g carbohydrate per 100 ml (FatSecret NZ entry), so a 0.5 l glass is about 105–186 kcal.")
var("beer", "radler", "Radler", "Radler", recipe=[("beer", ("ml", 250)), ("lemonade", ("ml", 250))],
    serving=('g', None, "500 ml", "our recipe"), words=["radler"], aliases=["radler", "radler limun", "pivo s limunadom", "shandy"],
    text="Radler is our recipe: half beer, half lemonade (250 ml USDA regular beer + 250 ml USDA lemonade), about 2.5% alcohol. Bottled radlers are usually about 2–2.5% and differ in sugar.")
size("beer", [("0.3l", "0.3 l", "ml", 300), ("0.33l", "0.33 l", "ml", 330), ("0.5l", "0.5 l", "ml", 500)],
     "Sizes are the usual glasses and bottles: a small glass 0.3 l, a bottle 0.33 l, a large glass or can 0.5 l. You pick the one you had.", "Common serving sizes")

ask("red-wine", "Which red wine?", "Table wine")
var("red-wine", "bevanda", "With water", "Red wine with water", recipe=[("red-wine", ("ml", 100)), ("water", ("ml", 100))],
    serving=('g', None, "200 ml", "our recipe"), words=["bevanda"], aliases=["bevanda", "vino s vodom", "crno vino s vodom", "red wine with water"],
    text="Red wine with water (bevanda) is our recipe: half red table wine (USDA), half water, about 6.5% alcohol. People mix it 1:1 or stronger.")
var("red-wine", "dessert", "Dessert", "Dessert wine", usda=173176, serving=('ml', 100, r'fl oz'),
    words=["prosek", "desertno", "slatko"], aliases=["prošek", "desertno vino", "dessert wine", "slatko vino", "sweet wine"],
    text="Dessert wine (like prošek): values from the USDA record “Alcoholic beverage, wine, dessert, sweet”: 7.8 g sugar and 15.3 g alcohol per 100 g. A glass is smaller, 100 ml.")
ask("white-wine", "Which white wine?", "Table wine")
var("white-wine", "spritzer", "Spritzer", "Wine spritzer", recipe=[("white-wine", ("ml", 100)), ("water", ("ml", 100))],
    serving=('g', None, "200 ml", "our recipe"), words=["gemist"], aliases=["gemišt", "gemist", "spritzer", "wine spritzer", "bijeli gemišt", "špricer", "spricer"],
    text="Wine spritzer (gemišt) is our recipe: half white table wine (USDA), half sparkling water, about 6.5% alcohol. We use the USDA tap-water record for the water part: bubbles add no calories.")
var("white-wine", "rose", "Rosé", "Rosé wine", usda=171908, words=["rose", "roze", "ruzica"],
    aliases=["rosé", "rose wine", "roze vino", "rosé vino", "ružica"], text="Rosé: values from the USDA record “Alcoholic beverages, wine, rose”.")
for w in ("red-wine", "white-wine"):
    size(w, [("1dl", "1 dl", "ml", 100), ("1.5dl", "1.5 dl", "ml", 150), ("2dl", "2 dl", "ml", 200), ("3dl", "3 dl", "ml", 300)],
         "Sizes are the amount of drink in your glass: 1, 1.5, 2 or 3 dl. A typical glass of wine is 1.5 dl.", "Common serving sizes")

ask("rakija", "How strong?", "40%")
var("rakija", "43", "43%", "Rakija 43%", usda=171919, text="Rakija 43%: values from the USDA record for 86-proof distilled spirits (43% alcohol).")
var("rakija", "45", "45%", "Rakija 45%", usda=171920, text="Rakija 45%: values from the USDA record for 90-proof distilled spirits (45% alcohol).")
var("rakija", "50", "50%", "Rakija 50%", usda=173664, words=["domaca"], aliases=["domaća rakija", "homemade rakija"],
    text="Rakija 50%: values from the USDA record for 100-proof distilled spirits (50% alcohol). Homemade rakija is often 45–50%; it is rarely measured.")
# Data round 2 (2026-10-19): medica = honey liqueur. Badel Medica: 24% vol, "produced by blending the base spirit,
# Benkovac Komovica, with natural honey" (LCBO product page 33641; badel1862.hr lists 24%). Its sugar is not published,
# so we use the EU legal minimum for a liqueur: Regulation (EU) 2019/787 Annex I cat. 33 "minimum content of sweetening
# products, expressed as invert sugar, of ... 100 grams per litre in all other cases"; minimum 15% vol.
# Per 40 ml: 24 ml 40% spirit (9.6 ml ethanol = 24% vol) + 4.9 g honey (USDA 82.1 g sugars/100 g → 4.0 g sugar =
# 100 g/l) + 12.6 ml water (40 − 24 − 4.9 g / 1.42 g/ml honey). Volumes are taken as additive (about 1% off).
var("rakija", "medica", "Medica", "Medica honey liqueur", recipe=[("rakija", ("ml", 24)), ("honey", 4.9), ("water", ("ml", 12.6))],
    serving=('g', None, "40 ml", "our recipe"), words=["medica", "medenica", "medovaca"],
    aliases=["medica", "medenica", "medovača", "medovaca", "rakija od meda", "medena rakija", "honey rakija", "honey liqueur", "badel medica"],
    text="Medica (honey liqueur) is our recipe: 24 ml of 40% spirit, 4.9 g honey and 12.6 ml water per 40 ml (USDA parts), about 24% alcohol like Badel Medica (24% vol, komovica spirit with honey). Producers do not publish the sugar, so we use the EU minimum for a liqueur, 100 g sugar per litre: real medica can be sweeter. Homemade medica varies more.")
size("rakija", [("3cl", "3 cl", "ml", 30), ("4cl", "4 cl", "ml", 40), ("5cl", "5 cl", "ml", 50)],
     "Sizes are the usual small glasses for spirits: 3, 4 or 5 cl.", "Common serving sizes")

# ---------------- SOFT DRINKS ----------------
ask("energy-drink", "Which energy drink?", "Regular")
var("energy-drink", "sugarfree", "Sugar-free", "Sugar-free energy drink", usda=171870, serving=('ml', 250, r'can', "1 can (250 ml)"),
    words=["sugarfree", "sugar-free", "zero", "bez secera"], aliases=["sugar free red bull", "red bull sugarfree", "red bull zero", "energy drink zero", "sugar-free energy drink", "energetsko pice bez secera"],
    text="Sugar-free energy drink: values from the USDA record for sugar-free Red Bull (30 mg caffeine per 100 g, about 75 mg per can).")
size("energy-drink", [("250ml", "250 ml", "ml", 250), ("355ml", "355 ml", "ml", 355), ("500ml", "500 ml", "ml", 500)],
     "Sizes are the usual cans: 250 ml (Red Bull), 355 ml (12 fl oz) and 500 ml (Monster).", "Common can sizes")
size("cola", [("250ml", "250 ml", "ml", 250), ("330ml", "330 ml", "ml", 330), ("500ml", "500 ml", "ml", 500)],
     "Sizes are a glass (250 ml), a can (330 ml) and a bottle (500 ml).", "Common serving sizes")

# ---------------- COFFEE, TEA (sugar and honey are folded into the drink: add-ins) ----------------
addin("sugar", "Sugar", "sugar", 4.2, "1 tsp, 4.2 g", ["šećer", "šećerom", "šećera", "sugar", "sa šećerom"],
      "Sugar: one teaspoon is 4.2 g (USDA portion for granulated sugar). Café sachets hold about 4–5 g. It all counts as free sugar.",
      "USDA FoodData Central, SR Legacy 169655: Sugars, granulated (portion 1 tsp = 4.2 g)", "https://fdc.nal.usda.gov/food-details/169655/nutrients", level="B", excl="sweet")
addin("honey", "Honey", "honey", 7.0, "1 tsp, 7 g", ["med", "medom", "meda", "honey"],
      "Honey: one teaspoon is about 7 g (a third of the USDA tablespoon, 21 g). Its sugars count as free sugars (WHO).",
      "USDA FoodData Central, SR Legacy 169640: Honey (portion 1 tbsp = 21 g)", "https://fdc.nal.usda.gov/food-details/169640/nutrients", level="B", excl="sweet")
addin("milk", "Milk", "milk-whole", ("ml", 30), "a splash, 30 ml", ["mlijeko", "mlijekom", "mlijeka", "milk", "mlekom", "mleko"],
      "Milk: a splash is our estimate, 30 ml of whole milk (people pour about 15–50 ml). Milk sugar (lactose) is not a free sugar.",
      "USDA FoodData Central, SR Legacy 171265: Milk, whole, 3.25% milkfat", "https://fdc.nal.usda.gov/food-details/171265/nutrients", max=1)
addin("shot", "Extra shot", "espresso", ("ml", 30), "1 shot, 30 ml", ["extra shot", "dupli", "double shot"],
      "Extra shot: one more espresso, 30 ml (USDA restaurant espresso, about 64 mg caffeine).",
      "USDA FoodData Central, SR Legacy 171891: Beverages, coffee, brewed, espresso, restaurant-prepared", "https://fdc.nal.usda.gov/food-details/171891/nutrients", level="B", max=1)

ask("espresso", "Which espresso?", "Regular")
var("espresso", "decaf", "Decaf", "Decaf espresso", usda=174125, words=["decaf", "bez kofeina", "dekofeinizirana"],
    aliases=["decaf espresso", "kava bez kofeina", "decaf", "dekofeinizirana kava", "espresso bez kofeina"],
    text="Decaf espresso: values from the USDA record for decaffeinated restaurant espresso (about 0.3 mg caffeine per shot).")
addins("espresso", ["sugar"])
size("espresso", [("single", "Single", 1), ("double", "Double", 2)], "A double espresso is two shots (2 × 30 ml).", "Common serving sizes")
ask("filter-coffee", "Which filter coffee?", "Brewed")
var("filter-coffee", "instant", "Instant", "Instant coffee", usda=174130, words=["instant", "nescafe", "nes"],
    aliases=["instant coffee", "instant kava", "nescafe", "nes kava", "topljiva kava"],
    text="Instant coffee: values from the USDA record for instant coffee prepared with water (26 mg caffeine per 100 g, about 65 mg per 250 ml).")
var("filter-coffee", "decaf", "Decaf", "Decaf filter coffee", usda=171889, words=["decaf", "bez kofeina"],
    aliases=["decaf coffee", "decaf filter coffee"], text="Decaf filter coffee: values from the USDA record for decaffeinated brewed coffee.")
# Data round 2 (2026-10-19): Turkish (Bosnian, "domaća") coffee, boiled unfiltered in a džezva/cezve. No SR Legacy
# record (FNDDS 2710377 "Coffee, Turkish" is only brewed filter coffee + sugar, so it is not used). Measured:
#  Derossi A et al. 2018, J Sci Food Agric, PMID 29230816, DOI 10.1002/jsfa.8826 (abstract): "Caffeine content was 316, 112 and 64 mg
#   for the American, Turkish and espresso coffee cup"; per ml 2.01-2.21 mg/mL Turkish (as quoted in the review
#   Olechno E et al. 2021, PMC8228209);
#  Elsahoryi NA et al. 2025, PMC11901579: "the caffeine content to be 2.8 ± 0.3 mg/mL" (Arabica, standardized dose).
# Cup: 7 g coffee + "1 cup (75 mL) of cold water" (Turkish Coffee Culture and Research Association, quoted in Dilek NM
#  et al. 2025, PMC12581726); "1 cup (70 mL) of Turkish coffee" (Kayikci EE et al. 2023, PMC10440973).
# Values: the USDA espresso record is the nearest concentration (212 mg caffeine per 100 g = 2.1 mg/g, the middle of
# Derossi's 2.0-2.2 mg/mL), so 70 ml ≈ 148 mg; range 112 (Derossi's measured cup) to 196 mg (2.8 mg/mL × 70 ml).
# Mass check: 7 g coffee × 0.9-2.4% caffeine (Arabica-Robusta green beans, PMC8228209) = 63-168 mg at most.
var("filter-coffee", "turkish", "Turkish", "Turkish coffee", usda=171891, serving=('ml', 70, r'fl oz', "1 cup, 70 ml"), proxy=True,
    words=["turska", "bosanska", "dzezva", "turkish", "domaca kava"],
    aliases=["turska kava", "turkish coffee", "bosanska kava", "kava iz džezve", "kava iz dzezve", "domaća kava", "domaca kava", "greek coffee", "grčka kava"],
    rng={"caffeineMg": (112, 196)},
    text="Turkish coffee (boiled, unfiltered, about 7 g coffee per 70 ml cup) has no USDA record. Its caffeine was measured at 2.0–2.2 mg per ml (Derossi et al. 2018, J Sci Food Agric; one cup 112 mg) and 2.8 mg per ml (Elsahoryi et al. 2025). The USDA espresso record has the same strength (2.1 mg per g), so we use it for a 70 ml cup: about 148 mg caffeine. Your cup depends on how much coffee goes in and whether you drink the grounds.")
addins("filter-coffee", ["sugar", "milk"])
ask("coffee-with-milk", "Which coffee with milk?", "Classic")
var("coffee-with-milk", "macchiato", "Macchiato", "Macchiato", recipe=[("espresso", ("ml", 30)), ("milk-whole", ("ml", 30))],
    serving=('g', None, "1 cup, 60 ml", "our recipe"), words=["macchiato", "makijato"],
    aliases=["macchiato", "makijato", "machiato", "espresso macchiato", "espresso s mlijekom", "mala bijela"],
    text="Macchiato is our recipe: one espresso (30 ml, USDA) with 30 ml of whole milk. Cafés add about 15–60 ml of milk and foam.")
var("coffee-with-milk", "instant", "Instant", "Instant coffee with milk", recipe=[((174130, "none"), 149.0), ("milk-whole", ("ml", 50))],
    serving=('g', None, "1 cup, 200 ml", "our recipe"), words=["instant", "nescafe"], aliases=["instant kava s mlijekom", "nescafe s mlijekom", "instant coffee with milk"],
    text="Instant coffee with milk is our recipe: 150 ml instant coffee (USDA) + 50 ml whole milk (USDA).")
addins("coffee-with-milk", ["sugar"])
for cid, ml in (("cappuccino", 120), ("latte", 220)):
    ask(cid, "Which milk?", "Whole")
    for v, chip, mid, nm in (("2", "2%", "milk-semi-skimmed", "2% milk"), ("skim", "Skim", "milk-skimmed", "skim milk"),
                             ("soy", "Soy", "soy-milk", "soy milk"), ("almond", "Almond", "almond-milk", "almond milk")):
        var(cid, v, chip, "%s with %s" % (cid.capitalize(), nm), recipe=[("espresso", ("ml", 30)), (mid, ("ml", ml))],
            serving=('g', None, "1 cup, %d ml" % (30 + ml), "our recipe"), words=[nm.split()[0]] if v in ("soy", "almond") else [],
            aliases=["%s with %s" % (cid, nm)] + (["%s sa sojinim mlijekom" % cid] if v == "soy" else ["%s s bademovim mlijekom" % cid] if v == "almond" else []),
            text="%s with %s is our recipe: one espresso (30 ml, USDA) + %d ml %s (USDA). There is no USDA SR Legacy record for oat milk, so oat is not offered." % (cid.capitalize(), nm, ml, nm))
    addins(cid, ["sugar", "shot"])

for t in ("black-tea", "green-tea", "herbal-tea"):
    addins(t, ["sugar", "honey", "milk"] if t == "black-tea" else ["sugar", "honey"])
ask("iced-tea", "Which iced tea?", "Sweetened")
var("iced-tea", "diet", "Diet", "Diet iced tea", usda=171892, serving=('mlx', 250, 175111, r'fl oz'), words=["diet", "zero", "bez secera"],
    aliases=["diet iced tea", "ledeni čaj bez šećera", "iced tea zero"], text="Diet iced tea: values from the USDA record for diet lemon black tea, ready to drink.")
ask("hot-chocolate", "Made with?", "Milk")
var("hot-chocolate", "water", "Water", "Hot chocolate made with water", usda=174123, serving=('mlx', 250, 171277, r'cup'), gi="a1_hot_choc_water",
    words=["s vodom", "with water", "instant"], aliases=["hot chocolate with water", "kakao s vodom", "instant hot chocolate"],
    text="Hot chocolate from a mix with water: values from the USDA record “Beverages, Cocoa mix, powder, prepared with water”.")
ask("protein-shake", "Made with?", "Milk")
var("protein-shake", "water", "Water", "Protein shake with water", recipe=[((173180, "none"), 30), ("water", ("ml", 250))],
    serving=('g', None, "1 shaker, 280 ml", "our recipe"), words=["s vodom", "with water"], aliases=["protein shake with water", "proteinski shake s vodom"],
    text="Protein shake with water is our recipe: 30 g whey protein powder (USDA) in 250 ml water. Powders differ a lot by brand.")
ask("oatmeal", "Made with?", "Water")
var("oatmeal", "milk", "Milk", "Oatmeal made with milk", recipe=[((173904, "none", "porridge"), 40), ("milk-semi-skimmed", ("ml", 200))],
    serving=('g', None, "1 bowl, 246 g", "our recipe"), words=["s mlijekom", "with milk", "na mlijeku"], aliases=["oatmeal with milk", "zobena kaša s mlijekom", "porridge with milk"],
    text="Oatmeal with milk is our recipe: 40 g rolled oats (USDA, dry) cooked in 200 ml 2% milk (USDA). Its GI is the oats’ porridge value and milk’s value, weighted by their carbohydrate.")

# ---------------- SWEETS ----------------
ask("cake-sponge", "Which cake?", "Sponge")
var("cake-sponge", "chocolate", "Chocolate", "Chocolate cake", usda=174934, serving=('p', r'1/12 of a cake'), gi="a1_choc_cake", words=["cokoladna"],
    aliases=["chocolate cake", "čokoladna torta", "cokoladna torta"], text="Chocolate cake: values from the USDA record for chocolate cake with chocolate frosting (in-store bakery); 1 piece = 1/12 of a cake, 138 g.")
var("cake-sponge", "cheesecake", "Cheesecake", "Cheesecake", usda=172711, serving=('p', r'1/6 of 17 oz'), words=["cheesecake"],
    aliases=["cheesecake", "torta od sira", "sirnica torta"], text="Cheesecake: values from the USDA record for commercial cheesecake; 1 piece = 1/6 of a cake, 80 g.")
var("cake-sponge", "strudel", "Strudel", "Apple strudel", usda=175032, serving=('p', r'^piece'), words=["strudel", "strudla", "savijaca"],
    aliases=["strudel", "štrudla", "strudla", "apple strudel", "savijača", "savijaca"], text="Apple strudel: values from the USDA record “Strudel, apple”; 1 piece = 71 g.")
var("cake-sponge", "cream", "Cream cake", "Cream cake", usda=172696, serving=('p', r'piece'), proxy=True, words=["krem", "kremna"],
    aliases=["cream cake", "kremna torta", "krempita"], text="Cream cake: the closest USDA record is a Boston cream pie (sponge with custard filling and chocolate glaze); 1 piece = 92 g. Croatian cream cakes differ.")
ask("ice-cream", "Which ice cream?", "Vanilla")
var("ice-cream", "chocolate", "Chocolate", "Chocolate ice cream", usda=168809, serving=('p', r'cup \(4'), words=["cokoladni"],
    aliases=["chocolate ice cream", "čokoladni sladoled", "cokoladni sladoled"], text="Chocolate ice cream: values from the USDA record “Ice creams, chocolate”; 1 portion = ½ cup, 66 g.")
size("ice-cream", [("1", "1 scoop", 1), ("2", "2 scoops", 2), ("3", "3 scoops", 3)],
     "One scoop is the USDA ½-cup portion, 66 g. Scoops in cafés vary, so this is our estimate of a scoop.", "USDA FoodData Central, SR Legacy 167575 (portion ½ cup = 66 g)", "https://fdc.nal.usda.gov/food-details/167575/nutrients")
ask("chocolate-milk-bar", "Which chocolate?", "Milk")
var("chocolate-milk-bar", "white", "White", "White chocolate", usda=167571, free="upper", gi="t21_white_choc", serving=('g', 44, "1 bar, 44 g", "our assumption: the same bar as the milk chocolate (USDA 1.55 oz)"),
    words=["bijela"], aliases=["white chocolate", "bijela čokolada", "bijela cokolada"], text="White chocolate: values from the USDA record “Candies, white chocolate”. All its sugar is counted as free sugar (upper bound).")

# ---------------- MEALS, SAVORY ----------------
ask("fries", "Which fries?", "Deep-fried")
var("fries", "oven", "Oven-baked", "Oven-baked fries", usda=169264, gi="inherit", serving=('g', 71.0, "1 small portion", "our assumption: the same portion as the fried fries (USDA fast-food serving small, 71 g)"),
    words=["iz pecnice", "pecene", "oven"], aliases=["oven fries", "pomfrit iz pećnice", "pomfrit iz pecnice", "oven-baked fries", "baked fries"],
    text="Oven-baked fries: values from the USDA record for frozen fries heated in the oven: about half the fat of deep-fried fries.")
size("fries", [("small", "Small", 1), ("medium", "Medium", 117 / 71.0), ("large", "Large", 154 / 71.0)],
     "Sizes are USDA’s fast-food fries portions: small 71 g, medium 117 g, large 154 g.", "USDA FoodData Central, SR Legacy 170698 portions", "https://fdc.nal.usda.gov/food-details/170698/nutrients", level="A")
# Data round 2 (2026-10-19): pasta and rice sizes from measured adult portions. Irish Food Portion Sizes Database
# (Lyons J, Giltinan M, IUNA/UCC 2013; National Adult Nutrition Survey 2008-2010, 4-day semi-weighed records, adults
# 18-64, n 1274), Table 4, cooked weight per eating occasion: "Pasta, boiled 396 199 113-250" (median 199 g, IQR
# 113-250; men 214, women 161); "Rice, boiled 498 173 120-224" (median 173 g, IQR 120-224; men 179, women 141).
# Cross-check: the Italian SINU/LARN standard portion of dry pasta or rice is 80 g (IEO SmartFood sheet: "Porzioni di
# riferimento SINU - Pasta e cereali in chicco: 80g"); with USDA energy (dry 371 → cooked 158 kcal per 100 g pasta;
# rice 365 → 130) 80 g dry = 188 g cooked pasta or 225 g cooked rice. The default serving stays the USDA cup.
PR = "Irish Food Portion Sizes Database (IUNA 2013), adults 18-64, Table 4: boiled pasta median 199 g (IQR 113-250 g), boiled rice median 173 g (IQR 120-224 g); USDA SR Legacy cup portions"
PRU = "https://irp-cdn.multiscreensite.com/46a7ad27/files/uploaded/Irish-Food-Portion-Sizes-Database.pdf"
size("pasta", [("side", "Side", 1), ("plate", "Plate", 199 / 124.0), ("large", "Large", 250 / 124.0)],
     "Sizes are cooked weight: Side is USDA’s cup, 124 g; Plate is the typical adult portion, 199 g; Large is a big portion, 250 g (the middle and the upper quarter of what Irish adults ate, weighed in a national survey). 80 g of dry pasta, the Italian standard portion, cooks to about 190 g.",
     PR, PRU, level="B")
size("pasta-wholewheat", [("side", "Side", 1), ("plate", "Plate", 199 / 117.0), ("large", "Large", 250 / 117.0)],
     "Sizes are cooked weight: Side is USDA’s cup, 117 g; Plate is the typical adult pasta portion, 199 g; Large is a big portion, 250 g (Irish national survey, all boiled pasta).",
     PR, PRU, level="B")
size("rice-white", [("side", "Side", 120 / 158.0), ("plate", "Plate", 1), ("large", "Large", 224 / 158.0)],
     "Sizes are cooked weight: Side 120 g, Plate is USDA’s cup, 158 g, Large 224 g. Irish adults ate 120–224 g of boiled rice at a meal (the middle half, median 173 g, weighed in a national survey). 80 g of dry rice, the Italian standard portion, cooks to about 225 g.",
     PR, PRU, level="B")
size("cevapi", [("5", "5 pcs", 1), ("10", "10 pcs", 2)],
     "5 or 10 pieces of about 16 g grilled (Sarajevo standard: 10 pieces = 200–250 g raw).", "Wikipedia ‘Ćevapi’, ref. 38; USDA raw-to-cooked factor", "https://en.wikipedia.org/wiki/%C4%86evapi")
ask("vegetable-soup", "Which vegetable soup?", "Vegetable")
var("vegetable-soup", "broth", "Clear broth", "Vegetable broth", usda=171583, serving=('p', r'^cup', "1 bowl, 221 g"), words=["bistra"],
    aliases=["vegetable broth", "povrtni temeljac", "bistra juha od povrća"], text="Vegetable broth: values from the USDA record “Soup, vegetable broth, ready to serve”.")
var("vegetable-soup", "cream", "Cream soup", "Cream of mushroom soup", usda=172915, serving=('p', r'serving 1 cup', "1 bowl, 248 g"), words=["krem", "kremasta"],
    aliases=["cream soup", "krem juha", "krem juha od gljiva", "cream of mushroom soup"], text="Cream soup: values from the USDA record for canned cream of mushroom soup made with water.")
ask("chicken-soup", "Which soup?", "Chicken noodle")
var("chicken-soup", "beef-noodle", "Beef noodle", "Beef noodle soup", usda=172906, serving=('p', r'cup', "1 bowl, 244 g"), words=["goveda"],
    aliases=["goveđa juha", "goveda juha", "beef soup", "beef noodle soup", "goveđa juha s rezancima"], proxy=True,
    text="Beef soup: the closest USDA record is canned beef noodle soup made with water; home-made goveđa juha is usually richer.")
ask("tomato-soup", "Made with?", "Water")
var("tomato-soup", "milk", "Milk", "Tomato soup made with milk", usda=174546, free="minusLactose", gi="inherit", serving=('p', r'serving', "1 bowl, 252 g"),
    words=["s mlijekom", "with milk"], aliases=["tomato soup with milk", "krem juha od rajčice"], text="Tomato soup with milk: values from the USDA record for canned tomato soup made with 2% milk. Milk sugar is not counted as free sugar.")
ask("bean-soup", "Which bean stew?", "With ham")
var("bean-soup", "sausage", "With sausage", "Bean soup with sausage", usda=172905, serving=('p', r'cup', "1 bowl, 250 g"), proxy=True,
    words=["kobasicom", "s kobasicom"], aliases=["grah s kobasicom", "grah sa kobasicom", "bean soup with sausage", "grah varivo s kobasicom"],
    text="Bean stew with sausage: the closest USDA record is canned bean soup with frankfurters (made with water). USDA lists no fiber or sugar for it.")
ask("sausage", "Which sausage?", "Pork")
var("sausage", "smoked", "Smoked", "Smoked sausage", usda=174584, serving=('p', r'link \(4'), words=["dimljena", "smoked"],
    aliases=["dimljena kobasica", "smoked sausage", "kranjska kobasica"], text="Smoked sausage: values from the USDA record “Sausage, smoked link sausage, pork”; 1 link = 68 g.")
var("sausage", "bratwurst", "Bratwurst", "Bratwurst", usda=171620, serving=('p', r'link cooked'), words=["bratwurst"],
    aliases=["bratwurst", "bratvurst", "pečenica"], text="Bratwurst: values from the USDA record “Bratwurst, pork, cooked”; 1 link = 85 g.")
var("sausage", "chicken", "Chicken", "Chicken or turkey sausage", usda=173871, serving=('p', r'serving'), words=["pileca", "pureca", "turkey"],
    aliases=["pileća kobasica", "pureća kobasica", "chicken sausage", "turkey sausage"], text="Chicken or turkey sausage: values from the USDA record “Sausage, turkey, fresh, cooked”; 1 serving = 57 g.")
ask("ham", "Which ham?", "Pork")
var("ham", "turkey", "Turkey", "Turkey ham", usda=168092, serving=('g', 28, "1 slice", "our assumption: the same slice as the pork ham (USDA 28 g)"),
    words=["pureca", "turkey"], aliases=["pureća šunka", "pureca sunka", "turkey ham", "pureća prsa narezak"], text="Turkey ham: values from the USDA record “Ham, turkey, sliced, extra lean, prepackaged or deli”.")
ask("tuna-canned", "Canned in?", "Water")
var("tuna-canned", "oil", "Oil", "Tuna canned in oil", usda=173708,
    serving=('g', 80, "1 portion, 80 g", "survey: Irish Food Portion Sizes Database 2013 (IUNA, adults 18-64), canned tuna median 80 g; the same portion as tuna in water"),
    words=["u ulju", "in oil"], aliases=["tuna u ulju", "tuna in oil", "tunjevina u ulju"],
    text="Tuna in oil: values from the USDA record for light tuna canned in oil, drained (198 kcal per 100 g); 1 portion is 80 g (the median canned-tuna portion of Irish adults). If you eat the oil too, it is about twice that: the Open Food Facts entry for a Croatian can of tuna in vegetable oil (Eva, 80 g) gives 391 kcal and 35 g fat per 100 g.")
CHANGED_ON_PURPOSE["tuna-canned"] = "data round 2: serving 165 g (US 5-oz can) to 80 g (Irish national portion median; EU 80 g cans)"
ask("cheese-cottage", "Which cottage cheese?", "Creamed")
var("cheese-cottage", "lowfat", "Low-fat", "Low-fat cottage cheese", usda=172182, serving=('g', 105, "1 portion, 105 g", "our assumption: the same portion as the creamed cottage cheese"),
    words=["nemasni", "posni", "lowfat"], aliases=["nemasni svježi sir", "posni sir", "low-fat cottage cheese"], text="Low-fat cottage cheese: values from the USDA record for 2% milkfat cottage cheese.")
ask("bread-white", "Which bread?", "Sliced")
var("bread-white", "roll", "Roll", "Bread roll", usda=172793, serving=('p', r'hamburger', "1 roll"), gi="inherit", words=["kifla", "zemicka", "pecivo", "peciva"],
    aliases=["kifla", "kifle", "zemička", "zemicka", "bread roll", "roll", "bun", "pecivo", "peciva"],
    text="Bread roll: values from the USDA record for plain dinner rolls; 1 roll = 43 g (USDA size for a hamburger bun or large roll). A Croatian kifla is often bigger.")

# ---------------- BUILDERS ("What's on it?") ----------------
# Portion sources (research/audit/builder-portions-research.md, read 2026-10-18):
#  PIZZA  Burke Corporation / PizzaMarketplace.com "Pizza Toppings Portion Guide" (v3.0), per WHOLE pie, 12" and 14";
#         a 14" pie is 8 slices (USDA 173292: slice 107 g, pie 853 g; Pizza Hut "1 slice = 1/8 pizza"). Our pizza is
#         USDA's 14" chain cheese pizza, so a topping per slice = the 14" amount / 8; the range runs to the 12" amount / 8.
#  BURGER, SANDWICH  USDA FNDDS 2021-2023 "guideline amount on regular sandwich" (lettuce 8, tomato 20, onion 15,
#         ketchup 17, mayonnaise 14, butter 14, bacon 16 g; large sandwich = the top of the range); cheese 21 g.
#  KEBAB  USDA FNDDS gyro sandwich 2706962 (200 g: pita 60, meat 60, tzatziki 30, tomato 30, onion 20 g); meat weighed
#         in German döner 80-173 g (RTL test via Mallorca Revue); flour wrap USDA 175037 (10" = 72 g).
#  BUREK  labels: Vindija Latica cheese burek "svježi polumasni sir 34%"; Krajina Klas meat burek "juneće meso 38,60%";
#         Croatian Pravilnik (NN 78/05) art. 46: at least 10% fat.
PZ = "Burke Corporation / PizzaMarketplace.com, Pizza Toppings Portion Guide (v3.0)"
PZU = "https://www.burkecorp.com/wp-content/uploads/2019/05/Portion-Guide.pdf"
def pz(k, chip, name, ref, g12, g14, words, extra="", level="C", gi=None, gi_why=None):
    """A topping from the Burke chart: grams per slice = the 14-inch pie amount / 8 (range from the 12-inch amount)."""
    return opt(k, chip, name, ref, round(g14 / 8.0, 1), rng=(round(g12 / 8.0, 1), round(g14 / 8.0, 1)), words=words, level=level, cite=PZ, url=PZU,
               src="%s on pizza: our estimate %.1f g per slice, from a pizza-industry portion chart (%d g on a 14-inch pie, %d g on a 12-inch pie, 8 slices).%s" % (
                   name.capitalize(), g14 / 8.0, g14, g12, extra), gi=gi, gi_why=gi_why)
# Data round 3 (2026-10-19), pizza GI: the measured WHOLE-food GI wins over a sum of parts. Whole topped pizzas were
# tested in healthy people (Atkinson 2008 A1 rows 1222-1224, Pizza Hut Super Supreme pan/thin and Vegetarian Supreme
# thin: 36, 30, 49; Atkinson 2021 Suppl. Table 2 row 3761, ham, mozzarella, onion and tomato pizza: 56). Mean 43
# (GI key "pizza_healthy", build_fooddb.GI_SUPP). The base food carries it, and every vegetable topping that adds
# carbohydrate counts at the same value, so every combination shows 43: we have no test that separates the toppings.
PZGI = dict(gi="pizza_healthy", gi_why="on a pizza this counts at the GI measured on whole topped pizzas (Atkinson 2008 and 2021 tables), not at a GI of its own")
builder("pizza", "What's on it?", [
    grp("base", "Base", [opt("base", "Cheese pizza", "cheese pizza", "pizza", on=True, level="A",
        src="The base is USDA’s 14-inch chain cheese pizza (dough, tomato sauce, mozzarella): 1 slice = 107 g, the whole pizza 853 g.",
        gi="pizza_healthy", gi_why="the mean of the whole pizzas tested in healthy people (30–56; no plain cheese pizza was tested), Atkinson 2008 and 2021 tables")], one=True),
    grp("top", "Toppings", [
        # Data round 2: USDA FNDDS 2021-2023 recipes (input_food.csv): "Pizza, extra cheese, thin crust" (2708622) = 691 g
        # 14-inch chain cheese pizza + 41 g part-skim mozzarella (5.9%); "…, thick crust" (2708623) = 1060 g + 52 g (4.9%).
        # Per our 107 g slice: 107 × 41/691 = 6.3 g; 107 × 52/1060 = 5.2 g. Pizza operators (PMQ Think Tank, search
        # excerpt only) put about 4 oz on a 14-inch pie = 14.2 g per slice: the top of the range.
        opt("cheese", "Extra cheese", "extra cheese", 170845, 6.3, rng=(5.2, 14.2), words=["sirom", "extra cheese", "dupli sir", "vise sira", "cheese"],
            src="Extra cheese on pizza: 6.3 g of mozzarella per slice, USDA’s own recipe for an extra-cheese pizza (41 g of cheese added to a 691 g pizza, 5.9%). A thick-crust recipe adds 4.9% (5.2 g per slice); pizzerias may add up to about 4 oz on a large pizza (14.2 g per slice, pizza operators’ forum).",
            cite="USDA FNDDS 2021-2023 recipes 2708622 and 2708623 (Pizza, extra cheese, thin / thick crust)", url="https://fdc.nal.usda.gov/food-details/2708622/nutrients"),
        pz("pepperoni", "Pepperoni", "pepperoni", 174575, 35, 50, ["pepperoni", "peperoni", "feferoni salama"]),
        pz("salami", "Salami", "salami", "salami", 35, 50, ["salamom", "salama", "kulenom", "salami"], " Salami is not in the chart: we use the pepperoni amount."),
        pz("ham", "Ham", "ham", "ham", 128, 170, ["sunkom", "sunka", "ham", "sunke"]),
        pz("sausage", "Sausage", "sausage", 174586, 128, 170, ["kobasicom", "kobasica", "sausage"]),
        pz("bacon", "Bacon", "bacon", "bacon", 71, 99, ["slaninom", "pancetom", "slanina", "bacon"]),
        pz("mushrooms", "Mushrooms", "mushrooms", "mushrooms", 50, 78, ["gljivama", "gljive", "sampinjonima", "sampinjoni", "mushrooms", "mushroom", "funghi"], **PZGI),
        pz("peppers", "Peppers", "peppers", 170427, 78, 113, ["paprikom", "paprika", "peppers", "pepper"], **PZGI),
        pz("onion", "Onion", "onion", "onion", 78, 113, ["lukom", "luk", "onion", "onions"], **PZGI),
        pz("olives", "Olives", "olives", "olives", 78, 113, ["maslinama", "masline", "olives"], **PZGI),
        pz("corn", "Corn", "sweet corn", 169214, 85, 99, ["kukuruzom", "kukuruz", "corn"], **PZGI),
        # Data round 2: tuna share on EU tuna-pizza labels (Open Food Facts, ingredient lists with QUID %): Dr. Oetker
        # Ristorante Pizza Tonno 4001724039891 "9,2% THUNFISCH"; Dr. Oetker Pizza Tonno 4001724015727 "10% THUNFISCH";
        # Casino Pizza thon 3222477010352 "thon 9,4%"; Auchan Pizza Thon 3596710428595 "thon … 10,7%". The share is of the
        # topped pizza, so per our 107 g cheese slice t = 107 × s / (1 − s): 9.2% → 10.8 g, 10% → 11.9 g, 10.7% → 12.8 g.
        opt("tuna", "Tuna", "tuna", "tuna-canned", 11.9, rng=(10.8, 12.8), words=["tunom", "tunjevinom", "tuna"],
            src="Tuna on pizza: 11.9 g per slice. European frozen tuna pizzas declare 9.2–10.7% tuna (Dr. Oetker 9.2% and 10%, Casino 9.4%, Auchan 10.7%); 10% of a topped slice is 11.9 g, the range 10.8–12.8 g. Canned tuna in water, USDA.",
            cite="Open Food Facts ingredient lists: Dr. Oetker Ristorante Pizza Tonno (4001724039891), Dr. Oetker Pizza Tonno (4001724015727), Casino Pizza thon (3222477010352), Auchan Pizza Thon (3596710428595)",
            url="https://world.openfoodfacts.org/product/4001724015727"),
        # Data round 2: one egg per pizza (Great British Chefs "Pizza Fiorentina": "1 pizza base", "1 egg"; BBC Good Food
        # ME "20-minute Fiorentina pizzas": an egg per flatbread, search excerpt). USDA egg 171287: large 50 g, medium 44 g,
        # extra large 56 g → per slice of 8: 6.2 g (5.5–7.0).
        opt("egg", "Egg", "egg", 171287, 6.2, rng=(5.5, 7.0), words=["jajem", "jaje", "egg", "jajetom"],
            src="Egg on pizza: one egg per pizza, as in pizza Fiorentina recipes; a large egg is 50 g (USDA), so 6.2 g per slice (5.5–7.0 g for a medium to an extra-large egg). The egg sits on one or two slices, so those slices carry more.",
            cite="Great British Chefs, Pizza Fiorentina recipe (1 pizza base, 1 egg); USDA SR Legacy 171287 portions", url="https://www.greatbritishchefs.com/recipes/pizza-fiorentina-recipe"),
    ]),
], "Pizza is our builder: USDA’s 14-inch chain cheese pizza plus the toppings you pick, each a USDA record in a pizza-industry chart amount. Water lost in the oven is not modeled. Check: our pepperoni slice (113 g, 316 kcal, 13.2 g fat) matches USDA’s own 14-inch pepperoni slice (111 g, 313 kcal, 13.2 g fat).",
    presets=[preset("margherita", "Margherita", "Pizza Margherita", []),
             preset("capricciosa", "Capricciosa", "Pizza Capricciosa", ["ham", "mushrooms"], aliases=["capricciosa", "kapričoza", "kapricoza", "pizza capricciosa", "pizza kapricoza", "capricciosa pizza"]),
             preset("pepperoni", "Pepperoni", "Pepperoni pizza", ["pepperoni"], aliases=["pepperoni pizza", "pizza pepperoni", "pizza s pepperonijem"]),
             preset("veggie", "Veggie", "Veggie pizza", ["mushrooms", "peppers", "onion", "olives", "corn"], aliases=["veggie pizza", "vegetarijanska pizza", "vege pizza", "pizza vegetariana"]),
             preset("loaded", "Loaded", "Loaded pizza", ["cheese", "pepperoni", "ham", "sausage", "bacon", "mushrooms", "peppers", "onion"], aliases=["loaded pizza", "supreme pizza", "pizza supreme"])],
    unit="slice", ask="Which pizza?", cite=PZ, url=PZU)
size("pizza", [("slice", "Slice", 1), ("half", "Half", 4), ("whole", "Whole", 8)],
     "Sizes: a slice is 1/8 of a 14-inch pizza (USDA: slice 107 g, whole pizza 853 g); half is 4 slices, whole is 8.",
     "USDA FoodData Central, SR Legacy 173292 portions", "https://fdc.nal.usda.gov/food-details/173292/nutrients", level="A")

FN = "USDA FNDDS 2021-2023, guideline amounts for sandwich ingredients"
FNU = "https://fdc.nal.usda.gov/download-datasets"
def fn(k, chip, name, ref, g, rng, words, what="", gi=None, gi_why=None):
    return opt(k, chip, name, ref, g, rng=rng, words=words, cite=FN, url=FNU, gi=gi, gi_why=gi_why,
               src="%s: our estimate %g g, USDA’s guideline amount on a regular sandwich (%g–%g g, regular to large)%s." % (name.capitalize(), g, rng[0], rng[1], what))
# Data round 3 (2026-10-19), burger GI: four whole burgers on a white bun were tested in healthy people and all gave 66
# (Atkinson 2008 A1 rows 1175-1178; GI key "a1_burgers"). The measured whole food wins: every burger type and every
# extra that adds carbohydrate (onion, ketchup: both were on the tested hamburger) counts at 66.
BGGI = dict(gi="a1_burgers", gi_why="counted at the GI measured on whole burgers (four burgers on a white bun all gave 66, Atkinson 2008 table A1)")
SUBGI = dict(gi="white_bread_sub", gi_why="no whole sub was tested; nearly all its carbohydrate is the white roll, so it counts at the white-bread GI (our calculation; tested sandwiches gave 35–78 depending on the filling)")
SANDWICH_EXTRAS = lambda: [
    fn("cheese", "Cheese", "cheese", "cheese-gouda", 21, (21, 28), ["sirom", "sir", "cheese", "gaudom", "goudom"], "; gouda, USDA"),
    fn("butter", "Butter", "butter", "butter", 14, (7, 28), ["maslacem", "puterom", "butter"]),
    fn("mayo", "Mayo", "mayonnaise", 171009, 14, (9, 28), ["majonezom", "majoneza", "mayo", "mayonnaise"]),
    fn("ketchup", "Ketchup", "ketchup", 168556, 17, (5, 34), ["kecapom", "kecap", "ketchup"]),
    fn("lettuce", "Lettuce", "lettuce", 169248, 8, (8, 16), ["salatom", "zelenom salatom", "lettuce"]),
    fn("tomato", "Tomato", "tomato", "tomato", 20, (20, 40), ["rajcicom", "paradajzom", "tomato"]),
]
builder("hamburger", "What's on it?", [
    grp("type", "Burger", [
        opt("hamburger", "Hamburger", "hamburger", "hamburger", on=True, level="A", words=["mesom", "meat"], src="Hamburger: USDA’s record for a McDonald’s hamburger, 95 g (with ketchup, pickle, onion and mustard)."),
        opt("cheeseburger", "Cheeseburger", "cheeseburger", (170320, "null"), 119, level="A", aliases=["cheeseburger", "čizburger", "cizburger"],
            src="Cheeseburger: USDA’s record for a McDonald’s cheeseburger, 119 g.", **BGGI),
        opt("double", "Double", "double burger", (170720, "null"), 219, level="A", aliases=["big mac", "double burger", "dupli burger"],
            src="Double burger: USDA’s record for a McDonald’s Big Mac (two patties), 219 g.", **BGGI),
        opt("large", "Large", "large cheeseburger", (170728, "null"), 316, level="A", aliases=["whopper", "large burger", "veliki burger"],
            src="Large cheeseburger: USDA’s record for a Burger King Whopper with cheese, 316 g.", **BGGI),
        opt("pljeskavica", "Pljeskavica", "pljeskavica", [(171798, 150), (174915, 150), ("onion", 15)], aliases=["pljeskavica", "pljeskavica u lepinji", "pljeskavicu", "balkan burger"],
            src="Pljeskavica is our recipe: a 150 g grilled beef patty (USDA ground beef 80/20; menus list 100–350 g, most often 150 or 200 g) in a 150 g lepinja (USDA pita bread stands in; a lepinja on a Serbian menu weighs 150 g) with 15 g onion. Real pljeskavica is often beef and pork with salt, so sodium is higher than shown.",
            cite="Glovo menus (Kod Čika Gurmana, Kragujevac; Sarajevo sub, Subotica); USDA SR Legacy 171798, 174915", url="https://glovoapp.com/sr/rs/kragujevac/stores/kod-cika-gurmana-krg", **BGGI),
    ], one=True),
    grp("extra", "Extras", [
        opt("cheese", "Cheese", "cheese slice", 171290, 21, rng=(10, 32), words=["sirom", "cheese"], cite="USDA SR Legacy 171290 portion; USDA FNDDS", url=FNU,
            src="Cheese: one slice of American cheese, 21 g (USDA portion; 10–32 g from a slider to a large burger)."),
        fn("bacon", "Bacon", "bacon", "bacon", 16, (16, 24), ["slaninom", "bacon"]),
        opt("patty", "Extra patty", "extra patty", 171798, 40, rng=(40, 115), words=["dupla pljeskavica", "extra patty"], cite="USDA FNDDS fast-food burger patties", url=FNU,
            src="Extra patty: a small fast-food beef patty, 40 g cooked (USDA: 40 g small, 85 g medium, 115 g large)."),
        fn("onion", "Onion", "onion", "onion", 15, (15, 30), ["lukom", "onion"], **BGGI),
        fn("lettuce", "Lettuce", "lettuce", 169248, 8, (8, 16), ["salatom", "lettuce"], **BGGI),
        fn("tomato", "Tomato", "tomato", "tomato", 20, (20, 40), ["rajcicom", "tomato"], **BGGI),
        opt("pickles", "Pickles", "pickles", 168558, 7, rng=(5, 7), words=["kiselim krastavcima", "pickles"], cite="USDA SR Legacy 168558; USDA FNDDS", url=FNU,
            src="Pickles: one slice, 7 g (USDA portion; fast-food burgers carry 5–7 g).", **BGGI),
        fn("ketchup", "Ketchup", "ketchup", 168556, 17, (5, 34), ["kecapom", "ketchup"], **BGGI),
        fn("mayo", "Mayo", "mayonnaise", 171009, 14, (9, 28), ["majonezom", "mayo"]),
    ]),
], "Burger is our builder: a USDA whole-burger record (or our pljeskavica recipe) plus the extras you pick, in USDA’s guideline amounts for sandwich ingredients. The fast-food records already contain their usual sauces and pickles.",
    ask="Which burger?", unit="burger", cite=FN, url=FNU)

builder("sandwich-ham", "What's on it?", [
    grp("type", "Sandwich", [
        # Data round 3: no whole sub was tested; the white roll carries nearly all the carbohydrate, so the subs count at
        # the white-bread GI (Table 1, 75). The base food "sandwich-ham" has the same key (the default needs no tap).
        opt("sub", "Ham sub", "ham sub", "sandwich-ham", on=True, level="A", words=["mesom", "meat"], src="Ham sub: USDA’s record for a 6-inch submarine sandwich with ham, lettuce and tomato on white bread, 184 g.", **SUBGI),
        opt("coldcut", "Cold-cut sub", "cold-cut sub", (170696, "null"), 196, level="A", aliases=["cold cut sandwich", "sendvič s narezom", "sendvic s narezom"],
            src="Cold-cut sub: USDA’s record for a 6-inch cold-cut submarine sandwich, 196 g.", **SUBGI),
        opt("tuna", "Tuna sub", "tuna sub", (170299, "null"), 237, level="A", aliases=["tuna sandwich", "sendvič s tunom", "sendvic s tunom", "sendvič sa tunjevinom"],
            src="Tuna sub: USDA’s record for a 6-inch tuna submarine sandwich, 237 g.", **SUBGI),
        opt("baguette", "Baguette", "baguette sandwich", [("bread-french", 110), ("ham", 56), ("cheese-gouda", 21), ("butter", 14)],
            aliases=["baguette sandwich", "baget sa šunkom i sirom", "baget sendvič", "sendvič od bageta", "baget sendvic"],
            src="Baguette sandwich is our recipe: 110 g baguette (a Czech shop ham-and-cheese sandwich label: bread 52% of 213 g), 56 g ham, 21 g gouda and 14 g butter (USDA guideline amounts for a home sandwich).",
            cite="Rohlik.cz Simply Fresh sendvič šunka a sýr (label); USDA FNDDS guideline amounts", url="https://www.rohlik.cz/1343399-simply-fresh-sendvic-sunka-a-syr"),
        opt("toast", "Toast", "ham and cheese toast", [("bread-white", 60), ("ham", 28), ("cheese-gouda", 21)],
            aliases=["tost", "toast", "tost sa šunkom i sirom", "tost šunka sir", "toast sandwich", "ham and cheese toast", "toastie"],
            src="Toast is our recipe: 2 slices of white bread (60 g, USDA FNDDS), 1 slice of ham (28 g, USDA) and 21 g gouda. A shop toastie of 110 g lists 17% cheese and 13% ham, a little less filling.",
            cite="USDA FNDDS 2706964; PS in foodservice, Tasty Tosti kaas ham (label)", url="https://psinfoodservice.com/en/product/18227-tosti-superieur-kaas-ham-30x1-stuk"),
    ], one=True),
    grp("extra", "Extras", SANDWICH_EXTRAS()),
], "Sandwich is our builder: a USDA sandwich record or our recipe from USDA parts, plus the extras you pick in USDA’s guideline amounts for a regular sandwich.",
    ask="Which sandwich?", unit="sandwich", cite=FN, url=FNU)

DK = "USDA FNDDS 2706962 gyro sandwich; weighed döner meat (RTL test, Mallorca Revue)"
DKU = "https://www.mallorca-revue.eu/doener-rtl-test-enthuellt-preis-leistungs-sieger"
# Data round 2 (2026-10-19), kebab meat: Panozzo M et al. 2015, "Nutritional quality of preparations based on Döner
# Kebab sold in two towns of Veneto Region, Italy", Ital J Food Saf 4:4535 (read, PDF): 20 kebabs bought in shops,
# each component weighed. Table 1 meat 34.8 ± 10.2% (Verona) and 39.5 ± 6.8% (Vicenza), median 36.7%; bread 26.9 /
# 22.5%; mean serving "402 g" (range "274 to 618 g"). CALC: 36.7% × 402 g = 148 g (town means 140–159 g), so 150 g;
# range from the USDA gyro (60 g) to 36.7% of the heaviest kebab (618 g → 227 g). Cross-checks: RTL weighing 80–173 g
# (Mallorca Revue), Verbraucherzentrale Hamburg "rund 100 bis 150 Gramm Fleisch" (secondary excerpt only).
DKM = "Panozzo et al. 2015, Ital J Food Saf 4:4535 (20 weighed döner kebabs); RTL test via Mallorca Revue; USDA FNDDS 2706962 gyro"
DKMU = "https://pagepressjournals.org/ijfs/article/download/ijfs.2015.4535/4726/19187"
builder("kebab", "What's on it?", [
    grp("bread", "Bread", [
        # QA 2026-10-19 (owner decision): bread from the same weighed study as the meat. Panozzo 2015 Table 1 (PDF
        # re-read 2026-10-19): "Bread 26.9±3.4 22.5±6.1" (% of the kebab, Verona / Vicenza); mean serving 402 g.
        # CALC: mean of the town means 24.7% × 402 g = 99 g → 100 g; range from USDA's gyro pita (60 g) to 24.7% of
        # the heaviest kebab (618 g → 153 g). Was USDA 60 g. USDA pita 174915 stays the record.
        opt("pita", "Pita", "pita", 174915, 100, rng=(60, 153), on=True, words=["u piti", "pita", "lepinji"], cite=DKM, url=DKMU,
            src="Pita: 100 g of bread (USDA white pita). Twenty döner kebabs bought and weighed in Italy (the same study as the meat) were 22–27% bread, about 100 g of a 402 g kebab; USDA’s gyro uses a 60 g pita.",
            gi="a1_pita", gi_why="white pita bread as tested in healthy people (Atkinson 2008 table A1, 68 ± 5)"),
        opt("wrap", "Wrap", "wrap", 175037, 72, rng=(49, 117), words=["wrap", "tortilji", "durum", "dürüm"], aliases=["kebab wrap", "durum", "dürüm", "kebab u tortilji", "wrap kebab"], cite=DK, url=DKU,
            src="Wrap: a 10-inch flour tortilla, 72 g (USDA; 49–117 g from 8 to 12 inches).",
            gi="a1_wheat_tortilla", gi_why="the only wheat-flour tortilla tested in healthy people (Mexico, 8 people, one test; Atkinson 2008 table A1), so it is uncertain"),
    ], one=True),
    # Data round 3 (2026-10-19), kebab recalibrated to the SAME weighed study (Panozzo 2015, PDF re-read; Table 1 read
    # with pdftotext -raw): "Meat 34.8±10.2 39.5±6.8", "Bread 26.9±3.4 22.5±6.1", "Vegetables 24.7±9.1 25.8±7.4",
    # "Sauces 13.6±2.7 12.2±4.5" (% of the kebab, Verona / Vicenza). Table 2 / Table 4: 226.1 ± 25.7 kcal/100 g, fat 8.6,
    # protein 12.95 ± 2.12, carbohydrate (starch, enzymatic AOAC 979.10) 11.3 ± 3.7, fibre 1.15 g/100 g; 402 g = 900.9
    # kcal, 34.7 g fat, 51.7 g protein, 43.8 g carbohydrate. The 226 kcal is GROSS energy: "Gross energy was measured by
    # combustion of 1 g of sample in an excess of oxygen in a bomb calorimeter". Food labels and USDA give metabolizable
    # (Atwater) energy, which is lower; the study's own macros give 12.95×4 + 8.6×9 + 11.3×4 + 1.15×2 = 177 kcal/100 g
    # (town and meat-group means 170–187; sugars were not measured, so a few kcal more). So 226 is NOT our target; the
    # measured composition is. Before round 3 our kebab (330 g) had fat 4.4 g/100 g (half the study's 8.6), 50 g of
    # vegetables (study ≈ 100 g) and 30 g of sauce (study ≈ 52 g).
    # CALC (402 g × mean of the town means): vegetables 25.25% → 101 g; sauces 12.9% → 52 g. Changes:
    #  - chicken: USDA thigh meat only (172388, 8.2% fat) → thigh meat AND skin (173625, 14.7% fat). The study says the
    #    meat's collagen "increases as a function of the amount of skin that is inserted in the Döner preparation", and
    #    the skinless record cannot reach the measured 8.6 g fat/100 g with the measured sauce share.
    #  - vegetables 50 → 95 g: tomato 40, onion 25, lettuce 30 (on; stands in for the salad and cabbage the study lists).
    #  - sauce 30 → 52 g: yogurt sauce 38 g + mayonnaise 14 g (on). The study: "the sauces used, like mayonnaise and
    #    ketchup, were bought at the supermarket" and the low sauce pH points to "frequent use of yoghurt".
    # Result (default, 397 g): 192 kcal/100 g (Atwater), fat 8.8, protein 11.7 g/100 g: fat and protein inside the
    # study's mean ± SD; energy between the study's Atwater value (177) and its gross energy (226).
    grp("meat", "Meat", [
        opt("chicken", "Chicken", "chicken", 173625, 150, rng=(60, 227), on=True, words=["piletinom", "pileci", "chicken", "mesom", "meat"], aliases=["pileći kebab", "pileci kebab", "chicken kebab", "chicken doner"], cite=DKM, url=DKMU,
            src="Chicken: 150 g of meat (roasted chicken thigh with skin, USDA). Twenty döner kebabs bought and weighed in Italy averaged 402 g with 35–40% meat, about 150 g; a German TV test weighed 80–173 g of meat; USDA’s gyro uses 60 g. The study found skin in the döner meat and 8.6 g of fat per 100 g of kebab, which skinless thigh meat cannot reach, so we use thigh with skin."),
        opt("beef", "Beef/veal", "beef", 171797, 150, rng=(60, 227), words=["teletinom", "junetinom", "govedinom", "telecim", "beef"], aliases=["teleći kebab", "teleci kebab", "juneći kebab", "beef kebab", "beef doner"], cite=DKM, url=DKMU,
            src="Beef/veal: 150 g of meat; the closest USDA record is grilled ground beef 80/20 (German rules allow up to 60% minced meat in a döner). Weighed döner kebabs in Italy carried about 150 g of meat (35–40% of a 402 g kebab); measured portions run from 60 g (USDA gyro) to about 230 g."),
    ], one=True),
    grp("extra", "Extras", [
        opt("tomato", "Tomato", "tomato", "tomato", 40, rng=(20, 60), on=True, words=["rajcicom", "tomato"], cite=DKM, url=DKMU,
            src="Tomato: 40 g. The weighed Italian kebabs carried about 100 g of vegetables in all (25% of 402 g); we split that into tomato 40 g, onion 25 g and lettuce 30 g (USDA’s gyro uses 30 g of tomato)."),
        opt("onion", "Onion", "onion", "onion", 25, rng=(15, 40), on=True, words=["lukom", "onion"], cite=DKM, url=DKMU,
            src="Onion: 25 g, part of the about 100 g of vegetables in the weighed Italian kebabs (USDA’s gyro uses 20 g)."),
        opt("lettuce", "Lettuce", "lettuce", 169248, 30, rng=(8, 40), on=True, words=["salatom", "lettuce"], cite=DKM, url=DKMU,
            src="Lettuce: 30 g, standing in for the salad and cabbage in the weighed Italian kebabs (about 100 g of vegetables in all)."),
        opt("yogurt", "Yogurt sauce", "yogurt sauce", "yogurt-plain", 38, rng=(15, 60), on=True, words=["jogurt", "tzatziki", "umakom", "yogurt"], cite=DKM, url=DKMU,
            src="Yogurt sauce: 38 g; plain whole-milk yogurt stands in. The weighed Italian kebabs carried about 52 g of sauce (13% of 402 g), often yogurt-based; with the 14 g of mayonnaise that makes 52 g (USDA’s gyro uses 30 g of tzatziki)."),
        opt("mayo", "Mayo sauce", "mayonnaise sauce", 171009, 14, rng=(9, 28), on=True, words=["majonezom", "mayo"], cite=DKM, url=DKMU,
            src="Mayonnaise sauce: 14 g (USDA guideline amount on a regular sandwich). The Italian study reports that kebab shops mostly used supermarket mayonnaise and ketchup; without it the kebab has about a third less fat than the study measured."),
    ]),
], "Kebab is our builder: pita or wrap, chicken or beef, vegetables and sauce, each a USDA record. The amounts follow twenty döner kebabs bought and weighed in Italian shops (402 g: 37% meat, 25% bread, 25% vegetables, 13% sauce). Our default has about the study’s measured fat and protein per 100 g. The study’s 226 kcal per 100 g is gross energy from burning the food in a calorimeter; the energy the body can use from its measured protein, fat and starch is about 177–187 kcal per 100 g, and ours is 192. Kebab shops differ a lot, mostly in the meat.",
    presets=[preset("chicken-pita", "Chicken pita", "Chicken kebab in pita", ["pita", "chicken", "tomato", "onion", "lettuce", "yogurt", "mayo"]),
             preset("beef-pita", "Beef pita", "Beef kebab in pita", ["pita", "beef", "tomato", "onion", "lettuce", "yogurt", "mayo"]),
             preset("chicken-wrap", "Chicken wrap", "Chicken kebab wrap", ["wrap", "chicken", "tomato", "onion", "lettuce", "yogurt", "mayo"])],
    ask="Which kebab?", unit="kebab", base_is_default=True, serving_label="1 kebab", cite=DKM, url=DKMU)
CHANGED_ON_PURPOSE["kebab"] = "owner 2026-10-18: kebab returns as a builder (was all null and left out of the app); QA 2026-10-19: pita 60 to 100 g (Panozzo 2015, same weighed study as the meat); data round 3: chicken thigh with skin, vegetables 95 g, sauce 52 g (yogurt 38 + mayo 14) to match the study's measured fat, protein and proportions"
# Data round 3 (2026-10-19): GI added where a sourced value exists (keys and rows in build_fooddb.GI_SUPP).
for _id in ("pizza", "kefir", "yogurt-plain", "yogurt-lowfat", "croissant", "potato-mashed", "chocolate-milk", "smoothie", "mandarin",
            "bread-rye", "iced-tea", "peach", "pear", "blueberries", "latte", "cappuccino", "sandwich-ham"):
    CHANGED_ON_PURPOSE[_id] = (CHANGED_ON_PURPOSE.get(_id, "") + "; " if _id in CHANGED_ON_PURPOSE else "") + \
        "data round 3: GI added from Atkinson 2008 Suppl. Tables / Atkinson 2021 Suppl. Tables (row in giSource)"

BU = "Labels: Vindija Latica cheese burek (34% cheese); Krajina Klas meat burek (38.6% beef); Pravilnik NN 78/05 art. 46 (≥10% fat)"
BUU = "https://www.konzum.hr/web/products/latica-burek-sa-svjezim-sirom-800-g"
# Data round 2 (2026-10-19): no spinach or potato burek label with ingredient shares was found (Open Food Facts,
# Konzum, web). Label energy per 100 g used as a CHECK of our recipes (Open Food Facts, nutrition tables):
#  spinach: "Burek filled with Spinach and Cheese" 3871832005535 230 kcal, 10 g fat; "Mini filo twist with cheese and
#  spinach (burek)" 3800047770372 281 kcal; "Burek spinach zeljanica posno" 3811832016414 282 kcal, 14.4 g fat;
#  potato: "Burek potato" 7350039279179 253 kcal, 9.5 g fat, 36 g carbohydrate, 5 g protein.
BUS = "Our recipe (no label gives the shares); check: Open Food Facts spinach burek labels 3871832005535 (230 kcal), 3800047770372 (281), 3811832016414 (282 per 100 g)"
BUSU = "https://world.openfoodfacts.org/product/3871832005535"
BUP = "Our recipe (no label gives the shares); check: Open Food Facts ‘Burek potato’ 7350039279179 (253 kcal per 100 g)"
BUPU = "https://world.openfoodfacts.org/product/7350039279179"
builder("burek", "What's in it?", [
    grp("filling", "Filling", [
        # QA 2026-10-19 (owner decision): plain "burek" and "burek sa sirom" are one thing, the producer's cheese burek
        # label (297 kcal per 100 g). The old "bakery" option (chip "Bakery") and our cheese recipe (289 kcal per 100 g)
        # are merged into this one option; key "cheese" keeps old on=cheese links, on=bakery falls back to it as default.
        opt("cheese", "Cheese", "cheese burek", "burek", on=True, level="B", words=["sirom", "sa sirom", "s sirom"],
            aliases=["burek sa sirom", "burek s sirom", "sirnica", "sirna pita", "burek od sira", "cheese burek"],
            src="Cheese burek: the nutrition label of a Croatian bakery producer’s cheese burek (Čakovečki mlinovi, 150 g piece: “layers of dough and cheese filling”), read per 100 g as EU law requires. We use the label, not our own recipe (phyllo, 34% fresh cheese as on the Vindija label, oil), which came to 289 kcal per 100 g against the label’s 297. Cheese burek labels give 247–316 kcal per 100 g."),
        # The retired recipe, kept for the record (not offered any more):
        # opt("cheese", "Cheese", "burek with cheese", [(172791, 84), ("cheese-cottage", 51), (171017, 15)], words=["sirom", "sa sirom", "s sirom"],
        #     aliases=["burek sa sirom", "burek s sirom", "sirnica", "sirna pita", "burek od sira", "cheese burek"], cite=BU, url=BUU,
        #     src="Burek with cheese is our recipe for a 150 g piece: 84 g phyllo (USDA), 51 g fresh cheese (34%, as on the Vindija label; USDA cottage cheese) and 15 g sunflower oil (Croatian rules ask for at least 10% fat). Labels give 247–316 kcal per 100 g; water lost in baking is not modeled."),
        opt("meat", "Meat", "burek with meat", [(172791, 77), (171798, 58), (171017, 15)], words=["mesom", "s mesom", "sa mesom"],
            aliases=["burek s mesom", "burek sa mesom", "mesni burek", "meat burek", "burek od mesa"], cite=BU, url=BUU,
            src="Burek with meat is our recipe for a 150 g piece: 77 g phyllo (USDA), 58 g ground beef (38.6%, as on a Krajina Klas label; USDA cooked ground beef 80/20) and 15 g sunflower oil (at least 10% fat by Croatian rules)."),
        opt("spinach", "Spinach", "spinach burek", [(172791, 75), ("spinach", 30), ("cheese-cottage", 30), (171017, 15)], words=["spinatom", "zeljem", "sa spinatom"],
            aliases=["zeljanica", "burek sa špinatom", "burek sa zeljem", "spinach burek", "pita sa zeljem"], cite=BUS, url=BUSU,
            src="Spinach burek (zeljanica) is our recipe for a 150 g piece: 75 g phyllo, 30 g cooked spinach, 30 g fresh cheese and 15 g sunflower oil (USDA parts), 262 kcal per 100 g. We found no label that gives the proportions, so they are our estimate; spinach burek labels give 230–282 kcal per 100 g, so the total fits."),
        opt("potato", "Potato", "potato burek", [(172791, 75), ("potato-boiled", 45), ("onion", 15), (171017, 15)], words=["krumpirom", "krompirom"],
            aliases=["krumpiruša", "krumpirusa", "krompiruša", "burek s krumpirom", "potato burek", "burek od krumpira"], cite=BUP, url=BUPU,
            src="Potato burek (krumpiruša) is our recipe for a 150 g piece: 75 g phyllo, 45 g boiled potato, 15 g onion and 15 g sunflower oil (USDA parts), 268 kcal per 100 g. We found no label that gives the proportions, so they are our estimate; the one potato burek label we found gives 253 kcal, 9.5 g fat and 36 g carbohydrate per 100 g (ours: 13 g fat, 33 g carbohydrate)."),
    ], one=True),
], "Burek: cheese is a Croatian producer’s label; meat, spinach and potato are our recipes from USDA phyllo, filling and oil in the shares shown on Croatian and Bosnian labels. Real burek varies a lot (labels 247–316 kcal per 100 g).",
    ask="Which burek?", unit="piece", cite=BU, url=BUU)
CHANGED_ON_PURPOSE["melon"] = "data round 2: giSource text says why row 1021 (65) wins over row 1022 (70); the GI value is unchanged"
CHANGED_ON_PURPOSE["chicken-breast"] = "2026-10-29: alias 'meat' (opens 'Which meat?', chicken first in the US)"
CHANGED_ON_PURPOSE["pork-chop"] = "2026-10-29: aliases 'meso', 'mesa' (open 'Which meat?', pork first in Croatia)"
CHANGED_ON_PURPOSE["croissant"] = "2026-10-29: aliases 'pastry', 'pastries' (open 'Which roll or pastry?')"
CHANGED_ON_PURPOSE["potato-chips"] = "2026-10-29: aliases 'snack', 'snacks' (open 'Which snack?')"
CHANGED_ON_PURPOSE["bread-white"] = "alias 'tost' moved to the sandwich builder (Croatian 'tost' is a toasted ham-and-cheese sandwich)"
CHANGED_ON_PURPOSE["burek"] = "aliases 'burek sa sirom', 'sirnica', 'sirna pita', 'mesni burek', 'burek s mesom' moved to the burek fillings (builder); data round 2: override text names the cheese filling and the per-100 g basis check"

DR = "USDA SR Legacy portions; 21 CFR 101.12 (dressing reference amount 30 g)"
DRU = "https://www.law.cornell.edu/cfr/text/21/101.12"
def dressing(base, label):
    return [grp("base", "Base", [opt("base", label, label.lower(), base, on=True, level="A", src=label + ": the USDA record of the database food, its usual serving.")], one=True), grp("dressing", "Dressing", [
        opt("olive-oil", "Olive oil", "olive oil", "olive-oil", 13.5, rng=(4.5, 27), words=["maslinovim uljem", "uljem", "olive oil", "oil"], cite=DR, url=DRU,
            src="Olive oil: 1 tablespoon, 13.5 g (USDA portion; people use about 1 teaspoon to 2 tablespoons)."),
        opt("sunflower-oil", "Sunflower oil", "sunflower oil", 171017, 13.6, rng=(4.5, 27), words=["suncokretovim uljem", "sunflower oil"], cite=DR, url=DRU,
            src="Sunflower oil: 1 tablespoon, 13.6 g (USDA portion)."),
        opt("vinegar", "Vinegar", "vinegar", 172237, 14.9, rng=(5, 30), words=["octom", "ocat", "vinegar"], cite=DR, url=DRU,
            src="Vinegar: 1 tablespoon, 14.9 g of distilled (spirit) vinegar (USDA portion), the kind most used in Croatia."),
        opt("salt", "Salt", "salt", 173468, 0.4, rng=(0.4, 1.5), words=["solju", "salt"], cite=DR, url=DRU,
            src="Salt: a dash, 0.4 g (USDA portion ‘dash’), about 155 mg sodium. People often use more."),
    ])]
builder("salad-lettuce", "Dressing?", dressing("salad-lettuce", "Lettuce"), "Green salad: USDA romaine lettuce plus the dressing you pick, in USDA spoon portions.", ask="Dressing?", cite=DR, url=DRU)
builder("cabbage", "Dressing?", dressing("cabbage", "Cabbage"), "Cabbage salad: USDA raw cabbage plus the dressing you pick, in USDA spoon portions.", ask="Dressing?", cite=DR, url=DRU)

# ---------------- "WHICH …?" CHOOSERS ----------------
# Owner 2026-10-18: a word that names several foods asks ("Which tea?"); the app starts on the ALIAS_OWNER food and
# keeps the chooser visible until a pick. Every shared word in the spec must be covered (the build fails otherwise).
chooser("tea", "Which tea?", [("black-tea", "Black"), ("green-tea", "Green"), ("herbal-tea", "Herbal"), ("iced-tea", "Iced")], words=["čaj", "tea", "čaja", "čajem"])
chooser("coffee", "Which coffee?", [("espresso", "Espresso"), ("filter-coffee", "Filter"), ("filter-coffee.turkish", "Turkish"), ("coffee-with-milk", "With milk"), ("cappuccino", "Cappuccino"), ("latte", "Latte")],
        words=["kava", "coffee", "kave", "kavu", "kafa", "crna kava"])
chooser("juice", "Which juice?", [("orange-juice", "Orange"), ("apple-juice", "Apple"), ("tomato-juice", "Tomato"), ("nectar", "Nectar"), ("cranberry-juice", "Cranberry"), ("carrot-juice", "Carrot")], words=["sok", "juice", "soka", "voćni sok"])
chooser("milk", "Which milk?", [("milk-whole", "Whole"), ("milk-semi-skimmed", "2%"), ("milk-skimmed", "Skim")], words=["mlijeko", "milk", "mlijeka", "mleko"])
chooser("plant-milk", "Which plant milk?", [("soy-milk", "Soy"), ("almond-milk", "Almond"), ("rice-milk", "Rice"), ("oat-milk", "Oat")], words=["biljno mlijeko", "plant milk"])
chooser("cheese", "Which cheese?", [("cheese-gouda", "Gouda"), ("cheese-cheddar", "Cheddar"), ("cheese-mozzarella", "Mozzarella"), ("cheese-feta", "Feta"),
        ("cheese-cottage", "Cottage"), ("cheese-parmesan", "Parmesan"), ("cheese-swiss", "Emmental"), ("cheese-trappist", "Trappist"), ("cheese-cream", "Cream cheese"), ("cheese-brie", "Brie")], words=["sir", "cheese", "sira"])
chooser("bread", "Which bread?", [("bread-white", "White"), ("bread-wholemeal", "Wholemeal"), ("bread-rye", "Rye"), ("bread-french", "Baguette"), ("pita-bread", "Pita"), ("tortilla", "Tortilla"), ("bread-white.roll", "Roll")],
        words=["kruh", "bread", "kruha"])
chooser("wine", "Which wine?", [("red-wine", "Red"), ("white-wine", "White"), ("white-wine.rose", "Rosé"), ("white-wine.spritzer", "Spritzer"),
        ("white-wine.sparkling", "Sparkling"), ("red-wine.bevanda", "With water"), ("red-wine.dessert", "Dessert")], words=["vino", "wine", "vina"])
chooser("sausage", "Which sausage?", [("sausage", "Pork"), ("sausage.smoked", "Smoked"), ("sausage.bratwurst", "Bratwurst"), ("sausage.chicken", "Chicken"),
        ("frankfurter", "Hot dog")], words=["kobasica", "kobasice", "sausage", "kobasicu"])
chooser("soup", "Which soup?", [("vegetable-soup", "Vegetable"), ("chicken-soup", "Chicken"), ("tomato-soup", "Tomato"), ("bean-soup", "Bean stew")], words=["juha", "soup", "juhu"])
chooser("beans", "Which beans?", [("beans-kidney", "Red"), ("beans-white", "White")], words=["grah", "beans"])
chooser("chocolate", "Which chocolate?", [("chocolate-milk-bar", "Milk"), ("chocolate-dark", "Dark"), ("chocolate-milk-bar.white", "White")], words=["čokolada", "chocolate", "čokoladu"])
chooser("cocoa", "Which cocoa?", [("chocolate-milk", "Cold"), ("hot-chocolate", "Hot")], words=["kakao"])
chooser("fish", "Which fish?", [("cod", "White fish"), ("salmon", "Salmon"), ("sardines", "Sardines"), ("tuna-canned", "Tuna"), ("mackerel", "Mackerel"), ("squid", "Calamari"), ("sea-bass", "Sea bass"), ("shrimp", "Shrimp"), ("fish-sticks", "Fish sticks")], words=["riba", "fish", "ribu"])
chooser("cereal", "Which cereal?", [("cornflakes", "Cornflakes"), ("muesli", "Muesli")], words=["žitarice", "cereal"])
chooser("dried-fruit", "Which dried fruit?", [("raisins", "Raisins"), ("dried-apricots", "Apricots"), ("dried-figs", "Figs"), ("dates", "Dates")], words=["dried fruit", "sušeno voće"])
chooser("eggs", "Which eggs?", [("egg-boiled", "Boiled"), ("egg-fried", "Fried")], words=["jaja", "egg", "eggs"])
chooser("cold-cuts", "Which cold cuts?", [("ham", "Ham"), ("ham.turkey", "Turkey ham"), ("salami", "Salami")], words=["narezak"])
chooser("pasta", "Which pasta?", [("pasta", "White"), ("pasta-wholewheat", "Whole-wheat")], words=["tjestenina", "pasta"])
chooser("potato", "Which potatoes?", [("potato-boiled", "Boiled"), ("potato-mashed", "Mashed"), ("fries", "Fries")], words=["krumpir", "potato", "potatoes", "krompir"])
chooser("rice", "Which rice?", [("rice-white", "White"), ("rice-brown", "Brown")], words=["riža", "rice"])
chooser("yogurt", "Which yogurt?", [("yogurt-plain", "Plain"), ("yogurt-lowfat", "Low-fat"), ("yogurt-greek", "Greek"), ("yogurt-fruit", "Fruit")], words=["jogurt", "yogurt", "yoghurt"])
# 2026-10-29 (owner: a generic word offers its specific foods; research/improvements/chooser-gaps-2026-10-29.md lists
# the common kinds the database does not have yet). "pecivo" is a roll first (audit 2026-10-17: a ~43-80 g roll,
# not a croissant), so the roll VARIANT owns this row (third element "own") while it stays in "Which bread?" too.
# Defaults: "meso" = pork (the meat Croatians eat most, FAO food balance sheets), "meat" = chicken (the US's most
# eaten meat, USDA ERS); "snack(s)" = potato chips (as "grickalice" already was); "pastry" = croissant. Burek keeps
# its own "Which burek?" (fillings) row. "s mesom" / "with meat" after a hamburger, kebab or sub is that food's own
# (default) meat, not a second, separate piece of meat (words on the default option below).
chooser("pastry", "Which roll or pastry?", [("bread-white.roll", "Roll", "own"), ("croissant", "Croissant"), ("doughnut", "Doughnut"), ("pretzel", "Pretzel"), ("muffin", "Muffin"), ("cinnamon-roll", "Cinnamon roll")],
        words=["pecivo", "peciva", "pecivom", "pastry", "pastries"])
chooser("meat", "Which meat?", [("chicken-breast", "Chicken"), ("beef-steak", "Beef"), ("pork-chop", "Pork"), ("lamb-roast", "Lamb"), ("turkey-breast", "Turkey"), ("schnitzel", "Schnitzel"), ("ground-meat", "Ground")], words=["meso", "mesa", "mesom", "meat"])
chooser("salad", "Which salad?", [("salad-lettuce", "Green"), ("cabbage", "Cabbage"), ("sauerkraut", "Sauerkraut"), ("tomato-salad", "Tomato"), ("cucumber-salad", "Cucumber"), ("potato-salad.oil", "Potato"), ("rocket-salad", "Rocket"), ("beetroot", "Beetroot")], words=["salata", "salatu", "salate", "salad"])
chooser("snacks", "Which snack?", [("potato-chips", "Chips"), ("popcorn", "Popcorn"), ("crackers", "Crackers"), ("rice-cakes", "Rice cakes")],
        words=["grickalice", "grickalica", "snack", "snacks"])
chooser("nuts", "Which nuts?", [("almonds", "Almonds"), ("walnuts", "Walnuts"), ("hazelnuts", "Hazelnuts"), ("peanuts", "Peanuts")], words=["nuts", "orašasti plodovi"])




# ======================= MORE DETAIL IN THE CHOOSERS (2026-10-29, round 2) =======================
# Owner 2026-10-29: "make food choices more detailed so users can pick exactly what they ate; a plain word still works
# with one tap". Fills research/improvements/chooser-gaps-2026-10-29.md. Every value is a USDA SR Legacy record
# (checked with usda_sr.py) or OUR recipe from USDA parts with stated grams (level C). Where USDA has no record of
# the kind, the variant is a PROXY (level B) and its text says which record stands in. Not added (no USDA SR Legacy
# record): oat milk, crepe-style palacinke, hake as its own fish (oslic stays under cod / white fish).
NEW_2026_10_29 = []
def add2(id, *a, **k):
    add(id, *a, **k); NEW_2026_10_29.append(id)

# ---- bakery
add2("pretzel", "Soft pretzel", ["perec", "pereci", "pereca", "perece", "brezel", "pretzel", "soft pretzel", "slani perec"], "solid",
     169064, "#a8642a", "null", ('p', r'^medium$', "1 pretzel"), gi="t21_soft_pretzel",
     note="Free sugars null: dough with some sugar, USDA gives no added-sugar split (as bread).")
add2("pita-bread", "Pita bread", ["pita bread", "pita kruh", "lepinja", "lepinje", "somun", "flatbread"], "solid",
     174915, "#e8cf98", "null", ('p', r'large', "1 pita"), gi="a1_pita",
     note="Also stands in for Balkan flatbreads (as in the pljeskavica recipe). The bare word for 'pita' is not an alias: in Croatian it means any pie.")
add2("muffin", "Muffin", ["muffin", "mafin", "mafini", "mafina", "mufin", "muffins", "blueberry muffin", "mafin s borovnicama"], "solid",
     172765, "#c88a5a", "upper", ('p', r'^medium$', "1 muffin"), gi="t21_blueberry_muffin",
     note="USDA record: commercial blueberry muffin. Upper-bound free sugars (as cakes).")
add2("cinnamon-roll", "Cinnamon roll", ["pužić", "puzic", "pužići", "puž s grožđicama", "puz s grozdicama", "puž", "cimet rolica", "rolica s cimetom", "cinnamon roll", "cinnamon bun", "raisin roll"], "solid",
     175034, "#c9874a", "upper", ('p', r'^roll', "1 roll"), gi="t21_fruit_bun",
     note="USDA record: cinnamon sweet roll with raisins, commercially prepared. Upper-bound free sugars.")
# ---- meat, fish
add2("turkey-breast", "Turkey breast (roasted)", ["puretina", "pureća prsa", "pureca prsa", "pureći file", "pureci file", "turkey breast", "roast turkey", "pureće meso"], "solid",
     174516, "#ecd2b4", "none", ('p', r'oz', "1 portion, 85 g"))
add2("schnitzel", "Breaded schnitzel", ["bečki odrezak", "becki odrezak", "pohani odrezak", "šnicl", "snicl", "schnitzel", "wiener schnitzel", "breaded schnitzel", "pohana teletina", "pohana svinjetina", "bečki šnicl", "becki snicel", "pohani svinjski odrezak"], "solid",
     173819, "#d9a050", "null", ('p', r'oz', "1 portion, 85 g"), proxy=True,
     note="USDA record: veal leg, pan-fried, breaded (a Wiener schnitzel is veal). PROXY for the breaded pork cutlet common in Croatia: USDA has no breaded pork record. Free sugars null: breading has some sugar, no split.")
add2("ground-meat", "Ground beef (cooked)", ["mljeveno meso", "mljevena govedina", "mljeveno goveđe meso", "ground beef", "ground meat", "minced meat", "mince", "faširano", "fasirano", "mljeveno meso kuhano", "mleveno meso"], "solid",
     174034, "#8e4a30", "none", ('p', r'oz', "1 portion, 85 g"),
     note="USDA record: ground beef 85% lean, crumbles, pan-browned (as in a Bolognese sauce). Cooked and unsalted: salt you add is not counted.")
add2("mackerel", "Mackerel (cooked)", ["skuša", "skusa", "skuše", "skuse", "mackerel", "pečena skuša"], "solid",
     175120, "#7a8a9a", "none", ('p', r'fillet', "1 fillet"),
     note="USDA record: Atlantic mackerel (Scomber scombrus, the species caught in the Adriatic), cooked, dry heat.")
add2("squid", "Fried calamari", ["lignje", "lignja", "linje", "pohane lignje", "pržene lignje", "przene lignje", "lignje pržene", "kalamari", "calamari", "squid", "fried calamari", "fried squid"], "solid",
     171982, "#efd8b0", "none", ('p', r'oz', "1 portion, 85 g"),
     note="USDA record: squid, mixed species, fried (floured). Grilled squid has less fat; USDA has no grilled record (raw only).")
# ---- salads
add2("tomato-salad", "Tomato salad", ["salata od rajčice", "salata od rajcice", "salata od paradajza", "rajčica salata", "rajcica salata", "paradajz salata", "tomato salad"], "solid",
     170457, "#d8402a", "none", ('p', r'medium whole', "1 bowl (1 tomato)"))
add2("cucumber-salad", "Cucumber salad", ["salata od krastavaca", "krastavac salata", "krastavci salata", "cucumber salad"], "solid",
     168409, "#a8cc88", "none", ('g', 150, "1 bowl, 150 g", "our assumption: half a cucumber (USDA 1 cucumber = 301 g)"))
add2("potato-salad", "Potato salad (with mayonnaise)", ["potato salad", "krumpir salata s majonezom", "francuska salata", "potato salad with mayo"], "solid",
     173343, "#e8d890", "null", ('p', r'cup', "1/2 cup"),
     note="USDA record: potato salad with egg (mayonnaise dressing). The Croatian oil-and-vinegar kind is a variant (our recipe). Free sugars null: the dressing has added sugar, no split.")
# ---- drinks
add2("nectar", "Apricot nectar", ["nektar", "nectar od marelice", "nektar marelica", "voćni nektar", "vocni nektar", "nectar", "fruit nectar", "sok od marelice", "nektar od marelice", "apricot nectar", "juice drink"], "liquid",
     171704, "#f2a64a", "all", ('ml', 250, r'fl oz'),
     note="Nectars are 25-50% fruit with added sugar; WHO counts the sugars of fruit juice and added sugar as free sugars (all).")
# ---- sweets, vegetables
add2("candy", "Gummy candy", ["bomboni", "bombon", "bombone", "gumeni bomboni", "gumene bombone", "gumeni medvjedići", "gumeni medvjedici", "gumeni bombon", "gumice", "haribo", "gummy bears", "gummies", "candy", "sweets", "slatkiši", "slatkisi", "slatkiš"], "solid",
     167989, "#e8506a", "all", ('p', r'gummy bears', "10 gummy bears"), gi="t21_gummy",
     note="USDA record: gumdrops, starch jelly pieces (gummy bears portion). Candy sugars are all added (WHO free sugars).")
add2("mixed-vegetables", "Mixed vegetables (boiled)", ["povrće", "povrce", "miješano povrće", "mijesano povrce", "kuhano povrće", "kuhano povrce", "vegetables", "veggies", "mixed vegetables", "mješavina povrća"], "solid",
     170472, "#7aa84a", "none", ('p', r'^cup$', "1/2 cup"),
     note="USDA record: mixed vegetables (corn, carrots, peas, green beans, lima beans), frozen, boiled, unsalted.")
for _id in NEW_2026_10_29:
    CHANGED_ON_PURPOSE[_id] = "2026-10-29 round 2: new food (owner: more detailed choices; chooser-gaps-2026-10-29.md)"
CHANGED_ON_PURPOSE["apple"] = "2026-10-29 round 2: aliases 'voće', 'fruit' (open 'Which fruit?', apple first)"
CHANGED_ON_PURPOSE["butter"] = "2026-10-29 round 2: aliases 'namaz', 'spread' (open 'Which spread?', butter first)"
next(e for e in E if e["id"] == "apple")["aliases"].extend(["voće", "voce", "voća", "fruit", "fruits"])
next(e for e in E if e["id"] == "butter")["aliases"].extend(["namaz", "spread"])

builder("tomato-salad", "Dressing?", dressing("tomato-salad", "Tomatoes"), "Tomato salad: USDA raw tomato plus the dressing you pick, in USDA spoon portions.", ask="Dressing?", cite=DR, url=DRU)
builder("cucumber-salad", "Dressing?", dressing("cucumber-salad", "Cucumber"), "Cucumber salad: USDA raw cucumber plus the dressing you pick, in USDA spoon portions.", ask="Dressing?", cite=DR, url=DRU)

# ---- variants
var("bread-white", "kaiser", "Kaiser", "Kaiser roll", usda=175031, serving=('p', r'^roll', "1 roll"), gi="inherit",
    words=["kajzerica", "kaiser", "makom", "sezamom", "sjemenkama"],
    aliases=["kajzerica", "kajzerice", "kaiser", "kaiser roll", "hard roll", "pecivo s makom", "pecivo sa sezamom", "pecivo sa sjemenkama",
             "poppy seed roll", "sesame roll", "seeded roll", "kifla s makom", "kifla sa sezamom", "kajzerca", "pecivo sa makom", "pecivo s sezamom"],
    text="Kaiser roll: values from the USDA record “Rolls, hard (includes kaiser)”, 1 roll = 57 g. Poppy or sesame seeds on top (about 1–2 g) are not counted separately.")
var("bread-white", "wholemeal-roll", "Wholemeal roll", "Wholemeal roll", usda=172794, serving=('p', r'hamburger', "1 roll"), gi="wholemeal_bread",
    words=["integralno", "integralna", "wholemeal"], aliases=["integralno pecivo", "integralna kifla", "wholemeal roll", "whole-wheat roll", "whole wheat roll"],
    text="Wholemeal roll: values from the USDA record “Rolls, dinner, whole-wheat”; 1 roll = 43 g (USDA size for a hamburger roll).")
var("bread-white", "rye-roll", "Rye roll", "Rye roll", usda=175029, serving=('p', r'^large', "1 roll"), gi="t21_rye",
    words=["razeno", "rye"], aliases=["raženo pecivo", "razeno pecivo", "rye roll"],
    text="Rye roll: values from the USDA record “Rolls, dinner, rye”; 1 large roll = 43 g.")
ask("croissant", "Which croissant?", "Butter")
var("croissant", "chocolate", "Chocolate", "Chocolate croissant", recipe=[("croissant", 57), ("chocolate-dark", 10)],
    serving=('g', None, "1 croissant", "our recipe"), words=["cokoladom", "cokoladni"],
    aliases=["kroasan s čokoladom", "kroasan s cokoladom", "čokoladni kroasan", "cokoladni kroasan", "chocolate croissant", "pain au chocolat"],
    text="Chocolate croissant is our recipe: a USDA butter croissant (57 g) with 10 g dark chocolate (two baking sticks of about 5 g, our estimate). USDA has no chocolate-croissant record; ones filled with chocolate cream differ.")
var("croissant", "cheese", "Cheese", "Cheese croissant", usda=174989, serving=('p', r'medium'), gi="inherit", words=["sirom", "sirni"],
    aliases=["kroasan sa sirom", "sirni kroasan", "cheese croissant"], text="Cheese croissant: values from the USDA record “Croissants, cheese”, 1 medium = 57 g. No cheese croissant was tested for GI; the butter croissant's value is used.")
ask("pretzel", "Which pretzel?", "Soft")
var("pretzel", "sticks", "Sticks", "Pretzel sticks", usda=167555, serving=('p', r'^oz$', "1 handful (1 oz)"), free="none", gi="t21_hard_pretzels",
    words=["stapici", "sticks"], aliases=["štapići", "stapici", "slani štapići", "slani stapici", "pretzel sticks", "hard pretzels"],
    text="Pretzel sticks: values from the USDA record for hard salted pretzels; 1 oz = 28 g, about a handful.")
ask("biscuits", "Which cookies?", "Butter")
var("biscuits", "tea", "Tea biscuits", "Tea biscuits", usda=171867, serving=('p', r'cookie', "5 biscuits"), proxy=True, gi="t21_rich_tea",
    words=["cajni", "plazma", "marie"], aliases=["plazma", "plazma keks", "plazma keksi", "plasma keks", "plazme", "čajni keksi", "cajni keksi", "marie biscuit", "marie keks", "tea biscuits"],
    text="Tea biscuits (Marie type): values from the USDA record “Cookies, Marie biscuit”, 5 biscuits = 28 g. Plazma itself has no USDA record; a Marie biscuit is the same kind of dry tea biscuit.")
var("biscuits", "chocolate-chip", "Chocolate chip", "Chocolate chip cookie", usda=172716, serving=('p', r'average weight', "1 cookie"), gi="t21_choc_chip",
    words=["chocolate chip"], aliases=["chocolate chip cookie", "chocolate chip cookies", "keks s komadićima čokolade", "keksi s komadicima cokolade"],
    text="Chocolate chip cookie: values from the USDA record for commercial chocolate chip cookies; 1 cookie = 12 g (USDA average of brands).")
var("biscuits", "wafer", "Wafers", "Cream wafers", usda=172736, serving=('p', r'^cookies$', "3 wafers"), gi="t21_cream_wafer",
    words=["napolitanke", "oblatne", "wafers"], aliases=["napolitanke", "napolitanka", "napolitanki", "neapolitanke", "oblatne", "wafers", "cream wafers"],
    text="Cream wafers: values from the USDA record “Cookies, sugar wafers with creme filling”, 3 wafers = 36 g.")
ask("pancake", "Which pancakes?", "US-style")
# Round 2: Croatian palačinke are thin crêpes (no USDA record): OUR recipe from USDA parts, a common home batter of
# 250 g flour, 500 ml milk, 2 eggs and a little oil for about 10 crêpes; 2 crêpes = 50 g flour, 103 g whole milk
# (100 ml), 20 g egg, 6 g sunflower oil for the pan. Grams are batter: frying drives off some water, so 2 crêpes weigh
# less on the plate, but what they contain is the same.
# (2026-10-30, video round 12: the flour in the batter carries the GI of tested homemade pancakes, the nearest tested
# food; the crêpes' GI is then COMPUTED, carbohydrate-weighted with the milk and the filling: level C)
CREPE2 = [((168894, "none", "a1_pancakes"), 50), ("milk-whole", 103), ((171287, "none"), 20), ((171017, "none"), 6)]
CREPE_TXT = "2 crêpes from our home recipe (USDA flour 50 g, whole milk 100 ml, egg 20 g, sunflower oil 6 g; a common batter of 250 g flour, 500 ml milk and 2 eggs makes about 10)"
var("pancake", "crepe", "Crepes", "Crepes", recipe=CREPE2, serving=('g', None, "2 crepes", "our recipe"),
    words=["tanke"], aliases=["palačinke", "palacinke", "palačinka", "palacinka", "palačinci", "palacinci", "palćinke", "crepes", "crêpes", "crepe", "thin pancakes"],
    text="Crepes are our recipe: " + CREPE_TXT + ". USDA has no crêpe record.")
var("pancake", "jam", "Jam crepes", "Crepes with jam", recipe=CREPE2 + [("jam", 20)], serving=('g', None, "2 crepes", "our recipe"),
    words=["dzemom", "marmeladom", "pekmezom"], aliases=["palačinke s džemom", "palacinke s dzemom", "palačinke s marmeladom", "palacinke s marmeladom", "palacinke sa dzemom", "palačinke s pekmezom", "crepes with jam"],
    text="Crepes with jam is our recipe: " + CREPE_TXT + ", with 1 tablespoon of jam (20 g, USDA portion).")
var("pancake", "nutella", "Chocolate crepes", "Crepes with chocolate spread", recipe=CREPE2 + [("nutella", 20)], serving=('g', None, "2 crepes", "our recipe"),
    words=["nutellom", "cokoladom", "linoladom"], aliases=["palačinke s nutellom", "palacinke s nutellom", "palačinke s čokoladom", "palacinke s cokoladom", "palacinke sa nutelom", "palačinke s linoladom", "crepes with nutella", "crepes with chocolate"],
    text="Crepes with chocolate spread is our recipe: " + CREPE_TXT + ", with 20 g hazelnut chocolate spread (Nutella label values).")
CHANGED_ON_PURPOSE["pancake"] = "2026-10-29 round 2: aliases 'palačinke' moved to the new crepe variant (thin Croatian crêpes); the base stays US-style pancakes"
CHANGED_ON_PURPOSE["nutella"] = "2026-10-30 video round 12: GI 29 from Atkinson 2008 A1 rows 1447-1449 (mean of three Nutella tests), so chocolate crepes get a computed GI"
CHANGED_ON_PURPOSE["pancake"] += "; 2026-10-30 video round 12: GI 66, Atkinson 2008 A1 row 30 (homemade pancakes), the nearest tested food"
CHANGED_ON_PURPOSE["cheese-gouda"] = "2026-10-29 round 2: alias 'trapist' moved to the new Trappist cheese (USDA port de salut)"
var("beer", "dark", "Dark", "Dark beer", usda=168746, proxy=True, words=["tamno", "dark", "stout", "porter"],
    aliases=["tamno pivo", "crno pivo", "dark beer", "dark lager", "stout", "porter"],
    text="Dark beer: USDA has no dark-beer record, so the values are those of the USDA record “Alcoholic beverage, beer, regular, all” (about 4.5% alcohol). Dark lagers are similar; strong stouts and porters have more alcohol (pick Strong).")
var("white-wine", "sparkling", "Sparkling", "Sparkling wine", usda=174837, proxy=True, words=["pjenusac", "prosecco", "sampanjac", "sparkling"],
    aliases=["pjenušac", "pjenusac", "prosecco", "šampanjac", "sampanjac", "champagne", "sparkling wine", "cava", "spumante"],
    text="Sparkling wine: USDA has no sparkling-wine record, so the values are those of the USDA white table wine (about 11–12% alcohol). A brut is close; sweeter kinds (extra dry, demi-sec) have more sugar.")
ask("yogurt-plain", "Which plain yogurt?", "Spoonable")
var("yogurt-plain", "drinkable", "Drinkable", "Drinkable yogurt", usda=171284, serving=('ml', 250, r'^cup'), gi="inherit", proxy=True,
    words=["tekuci", "drinkable"], aliases=["tekući jogurt", "tekuci jogurt", "tekuči jogurt", "jogurt tekući", "jogurt za piće", "jogurt za pice", "drinkable yogurt", "drinking yogurt", "yogurt drink"],
    text="Drinkable yogurt: USDA has no drinkable-yogurt record; the values are the USDA plain whole-milk yogurt (3.25% fat), poured as 250 ml. Croatian drinkable yogurts are plain yogurt of 2.8–3.2% fat in a thinner form.")
ask("schnitzel", "Which schnitzel?", "Veal or pork")
var("schnitzel", "chicken", "Chicken", "Breaded chicken", usda=173346, gi="a1_chicken_nuggets", serving=('g', 85, "1 portion, 85 g", "our assumption: the same portion as the veal schnitzel (USDA 3 oz)"),
    words=["pileci", "pilecim"], aliases=["pohana piletina", "pohani pileći odrezak", "pohani pileci odrezak", "chicken schnitzel", "breaded chicken", "pohana pileća prsa"],
    text="Breaded chicken: values from the USDA record “Chicken tenders, breaded, frozen, prepared”. Home-made breaded chicken breast has more meat and less breading.")
ask("ground-meat", "Which ground meat?", "Beef")
var("ground-meat", "pork", "Pork", "Ground pork", usda=167903, words=["svinjsko"],
    aliases=["mljevena svinjetina", "mljeveno svinjsko meso", "ground pork", "minced pork"],
    text="Ground pork: values from the USDA record “Pork, fresh, ground, cooked”.")
var("ground-meat", "mixed", "Mixed", "Ground beef and pork", recipe=[((174034, "none"), 42.5), ((167903, "none"), 42.5)],
    serving=('g', None, "1 portion, 85 g", "our recipe"), words=["mijesano", "mjesano"],
    aliases=["miješano mljeveno meso", "mijesano mljeveno meso", "mješano mljeveno meso", "mixed ground meat", "ground beef and pork"],
    text="Ground beef and pork is our recipe: half USDA cooked ground beef (85% lean), half USDA cooked ground pork, the usual Croatian mix.")
ask("potato-salad", "Which potato salad?", "Mayonnaise")
var("potato-salad", "oil", "Oil and vinegar", "Croatian potato salad", recipe=[("potato-boiled", 150), ("onion", 20), ((171017, "none"), 10), ((172237, "none"), 10)],
    serving=('g', None, "1 bowl", "our recipe"), words=["uljem", "octom"],
    aliases=["krumpir salata", "krompir salata", "salata od krumpira", "croatian potato salad", "potato salad with oil"],
    text="Croatian potato salad is our recipe: 150 g USDA boiled potato, 20 g onion, 10 g sunflower oil and 10 g vinegar (USDA parts; our amounts). Salt is not counted.")
ask("nectar", "Which nectar?", "Apricot")
var("nectar", "peach", "Peach", "Peach nectar", usda=168185, serving=('mlx', 250, 171704, r'fl oz'), words=["od breskve"],
    aliases=["nektar od breskve", "sok od breskve", "peach nectar"],
    text="Peach nectar: values from the USDA record “Peach nectar, canned”. Density from USDA apricot nectar (1 fl oz = 30.4 g): this record's only portion, 1 cup = 220 g, is below the density of water.")
var("nectar", "pear", "Pear", "Pear nectar", usda=168186, serving=('ml', 250, r'fl oz'), words=["od kruske"],
    aliases=["nektar od kruške", "nektar od kruske", "sok od kruške", "sok od kruske", "pear nectar"],
    text="Pear nectar: values from the USDA record “Pear nectar, canned”.")
ask("candy", "Which candy?", "Gummy")
var("candy", "hard", "Hard candy", "Hard candy", usda=167990, serving=('p', r'^piece$', "1 piece"),
    words=["tvrdi", "lizalica"], aliases=["tvrdi bomboni", "tvrdi bombon", "lizalica", "hard candy", "lollipop"],
    text="Hard candy: values from the USDA record “Candies, hard”, 1 piece = 6 g.")

# ---- choosers for the generic words (owner 2026-10-29: add them). Each food is in ONE row; "see" (third element)
# lists a food that keeps its own row (chocolate keeps "Which chocolate?"): picking it moves to that row.
chooser("fruit", "Which fruit?", [("apple", "Apple"), ("banana", "Banana"), ("orange", "Orange"), ("mandarin", "Mandarin"), ("grapes", "Grapes"),
        ("strawberries", "Strawberries"), ("pear", "Pear"), ("peach", "Peach"), ("watermelon", "Watermelon"), ("cherries", "Cherries")],
        words=["voće", "voca", "voćem", "voćka", "fruit", "fruits"])
chooser("vegetables", "Which vegetables?", [("mixed-vegetables", "Mixed"), ("tomato", "Tomato"), ("cucumber", "Cucumber"), ("carrot", "Carrot"),
        ("broccoli", "Broccoli"), ("pepper-red", "Bell pepper"), ("zucchini", "Zucchini"), ("spinach", "Spinach")],
        words=["povrće", "povrca", "povrćem", "vegetables", "veggies", "vegetable"])
chooser("spread", "Which spread?", [("butter", "Butter"), ("jam", "Jam"), ("honey", "Honey"), ("nutella", "Chocolate spread"), ("peanut-butter", "Peanut butter"),
        ("hummus", "Hummus")], words=["namaz", "namaza", "namazom", "spread"])
chooser("sweets", "Which sweets?", [("candy", "Candy"), ("chocolate-milk-bar", "Chocolate", "see"), ("biscuits", "Cookies"), ("cake-sponge", "Cake"),
        ("ice-cream", "Ice cream")], words=["slatkiši", "slatkisa", "slatkiš", "sweets", "candy"])

# ---- round 2 (2026-10-29, coordinator): the rest of chooser-gaps-2026-10-29.md where reliable data exists
# Oat drink: no USDA SR Legacy record. Values from the Oatly EU label (Open Food Facts); the USDA rice drink (also an
# enzyme-treated cereal drink) is only the carrier for water and density; every nutrient is replaced (override below).
add2("oat-milk", "Oat milk", ["zobeno mlijeko", "zobeni napitak", "zobeno", "zobeno mljeko", "oat milk", "oat drink", "mlijeko od zobi"], "liquid",
     171942, "#efe4cc", "null", ('ml', 250, r'fl oz'), gi="t21_oat_milk", proxy=True,
     note="Values: Oatly oat drink EU label (override). Sugars in oat drinks come from enzymes splitting the oat starch; the WHO text we read does not classify this, so free sugars are null (as rice milk).")
override("oat-milk", "per100ml", {"kcal": 48, "fat": 1.5, "satFat": 0.2, "carbs": 8.0, "sugars": 3.5, "fiber": 0.8, "protein": 1.1, "sodiumMg": 40, "caffeineMg": 0, "alcoholG": 0}, "B",
    "Oat milk: values from the Oatly oat drink label (per 100 ml: 48 kcal, 1.5 g fat, 7.2 g carbohydrate of which 3.5 g sugars, 0.8 g fiber, 1.1 g protein, 0.1 g salt), read from Open Food Facts. Other Oatly drinks run from 39 kcal (organic) to 61 kcal (barista).",
    "Open Food Facts: Oatly Lait d'Avoine / oat drink, EAN 7394376615979 (48 kcal, fat 1.5 g, saturates 0.2 g, carbohydrate 7.2 g, sugars 3.5 g, fibre 0.8 g, protein 1.1 g, salt 0.1 g per 100 ml); range Oatly Organic 7394376123337 (39 kcal) to Barista 7394376616228 (61 kcal)",
    "https://world.openfoodfacts.org/product/7394376615979",
    note="EU carbohydrate excludes fiber; USDA-style carbs = 7.2 + 0.8 = 8.0 so the app's available carbohydrate (carbs - fiber) is the label's 7.2. Sodium = salt 0.1 / 2.5 = 40 mg. Level B: label read on Open Food Facts, not on the pack.",
    ranges={"kcal": (39, 61)})
# cheeses
add2("cheese-swiss", "Emmental cheese", ["ementaler", "ementaller", "emmentaler", "emmental", "emental", "swiss cheese", "švicarski sir", "svicarski sir"], "solid",
     171251, "#f3e3a0", "none", ('p', r'^slice', "1 slice"), note="USDA record: Swiss cheese (the Emmental type).")
add2("cheese-trappist", "Trappist cheese", ["trapist", "trapist sir", "trappist", "trappist cheese", "port salut", "trapista"], "solid",
     170849, "#f0d890", "none", ('p', r'^slice', "1 slice"),
     note="USDA record: port de salut, the original French Trappist cheese; Croatian trapist is the same semi-hard washed-curd kind.")
add2("cheese-cream", "Cream cheese", ["krem sir", "kremasti sir", "namazni sir", "sirni namaz", "cream cheese", "philadelphia", "kremni sir"], "semi",
     173418, "#f6f0e0", "none", ('p', r'^tbsp$', "1 tbsp"))
add2("cheese-brie", "Brie cheese", ["brie", "bri", "brie sir", "brie cheese"], "solid",
     172177, "#f2ecd4", "none", ('p', r'^oz$', "1 portion, 28 g"))
ask("cheese-brie", "Which soft cheese?", "Brie")
var("cheese-brie", "camembert", "Camembert", "Camembert", usda=172178, serving=('p', r'wedge', "1 wedge"), words=["camembert", "kamember"],
    aliases=["camembert", "kamember", "kamamber", "camembert cheese"], text="Camembert: values from the USDA record “Cheese, camembert”, 1 wedge = 38 g.")
ask("yogurt-greek", "Which strained yogurt?", "Greek")
var("yogurt-greek", "skyr", "Skyr", "Skyr", usda=170894, serving=('p', r'container', "1 cup, 170 g"), proxy=True, words=["skyr"],
    aliases=["skyr", "skir", "skyr jogurt", "islandski jogurt", "icelandic yogurt"],
    text="Skyr: USDA has no skyr record; the values are the USDA plain nonfat Greek yogurt (a strained fat-free yogurt of the same kind, about 10 g protein per 100 g).")
var("yogurt-plain", "soy", "Soy", "Soy yogurt", usda=175227, serving=('p', r'container', "1 cup, 227 g"), words=["sojin", "soy", "biljni"],
    aliases=["sojin jogurt", "soja jogurt", "biljni jogurt", "soy yogurt", "plant yogurt", "vegan yogurt", "vegan jogurt"],
    free="upper", text="Soy yogurt: values from the USDA record “SILK Plain soy yogurt”; plain soy yogurts usually contain added sugar (upper-bound rule).")
var("milk-whole", "lactose-free", "Lactose-free", "Lactose-free milk", usda=171267, serving=('ml', 250, r'cup'), proxy=True, words=["bez laktoze", "lactose-free", "lactose free"],
    aliases=["mlijeko bez laktoze", "bezlaktozno mlijeko", "lactose-free milk", "lactose free milk", "mlijeko bez laktoza"],
    text="Lactose-free milk: the values of USDA 2% milk (lactose-free milks in Croatian shops are mostly 1.5–2.8% fat). Lactose-free milk has the same nutrients; its lactose is split into glucose and galactose, so it tastes sweeter but has no more sugar.")
ask("milk-whole", "Lactose-free?", "Regular")
# drinks
var("red-wine", "mulled", "Mulled", "Mulled wine", recipe=[("red-wine", ("ml", 200)), ("sugar", 20)], serving=('g', None, "200 ml", "our recipe"),
    words=["kuhano"], aliases=["kuhano vino", "kuhanog vina", "kuvano vino", "mulled wine", "glühwein", "gluhwein", "gluvajn"],
    text="Mulled wine is our recipe: 200 ml USDA red table wine with 20 g sugar (a common recipe: 1 liter of wine with 100 g sugar and spices). All of the wine's alcohol is counted; heating drives some off, so the real alcohol can be lower.")
var("beer", "wheat", "Wheat", "Wheat beer", usda=168746, proxy=True, words=["psenicno", "weiss", "wheat"],
    aliases=["pšenično pivo", "psenicno pivo", "wheat beer", "weissbier", "weizen", "hefeweizen", "witbier"],
    text="Wheat beer: USDA has no wheat-beer record, so the values are those of the USDA record “Alcoholic beverage, beer, regular, all” (about 4.5% alcohol). Wheat beers are often 5–5.5%.")
var("espresso", "americano", "Americano", "Americano", recipe=[("espresso", ("ml", 30)), ("water", ("ml", 120))], serving=('g', None, "150 ml", "our recipe"),
    words=["americano", "amerikano"], aliases=["americano", "amerikano", "caffe americano", "produženi espresso", "produzeni espresso", "produžena kava"],
    text="Americano is our recipe: a USDA espresso (30 ml) topped up with 120 ml hot water.")
var("espresso", "vienna", "With cream", "Espresso with whipped cream", recipe=[("espresso", ("ml", 30)), ((170860, "upper"), 15)], serving=('g', None, "1 cup", "our recipe"),
    words=["slagom", "sa slagom", "bečka"], aliases=["bečka kava", "becka kava", "kava sa šlagom", "kava sa slagom", "kava s šlagom", "espresso sa šlagom", "vienna coffee", "coffee with whipped cream"],
    text="Espresso with whipped cream is our recipe: a USDA espresso (30 ml) with 15 g spray whipped cream (USDA, about 5 tablespoons; our estimate of a café topping).")
add2("cranberry-juice", "Cranberry juice drink", ["sok od brusnice", "brusnica sok", "sok brusnica", "cranberry juice", "cranberry", "brusnica"], "liquid",
     171903, "#b8203a", "all", ('ml', 250, r'fl oz'), gi="t21_cranberry",
     note="USDA record: cranberry juice cocktail (about 27% juice, sweetened), the usual shop kind. Free sugars: all (juice plus added sugar).")
add2("carrot-juice", "Carrot juice", ["sok od mrkve", "sok mrkva", "mrkvin sok", "carrot juice"], "liquid",
     170491, "#f08a2a", "none", ('ml', 250, r'fl oz'), gi="t21_carrot_juice",
     note="WHO free-sugar definition names fruit juices, not vegetable juice (as tomato juice).")
# meat, fish
ask("chicken-breast", "Which chicken?", "Breast")
var("chicken-breast", "thigh", "Thigh", "Chicken thigh", usda=173625, serving=('p', r'thigh with skin', "1 thigh"), words=["batak", "zabatak", "thigh"],
    aliases=["pileći batak", "pileci batak", "pileći zabatak", "pileci zabatak", "batak", "zabatak", "chicken thigh", "chicken leg", "pečeni batak"],
    text="Chicken thigh: values from the USDA record for roasted chicken thigh with skin; 1 thigh = 137 g without the bone.")
var("chicken-breast", "wings", "Wings", "Chicken wings", usda=173630, serving=('p', r'^oz$', "1 portion, 85 g"), words=["krilca", "wings"],
    aliases=["pileća krilca", "pileca krilca", "krilca", "chicken wings", "wings", "pečena krilca"],
    text="Chicken wings: values from the USDA record for roasted chicken wings with skin; a portion of 85 g meat (USDA 3 oz).")
ask("beef-steak", "Which beef?", "Steak")
var("beef-steak", "veal", "Veal", "Roast veal", usda=173821, serving=('p', r'^oz$', "1 portion, 85 g"), words=["teletina", "telece", "veal"],
    aliases=["teletina", "teleće meso", "telece meso", "teleće pečenje", "telece pecenje", "veal", "roast veal"],
    text="Roast veal: values from the USDA record for roasted veal leg (lean and fat); a portion of 85 g (USDA 3 oz).")
add2("sea-bass", "Sea bass (cooked)", ["brancin", "lubin", "brancin na žaru", "sea bass", "seabass", "orada", "komarča", "komarca", "sea bream", "dorada"], "solid",
     173694, "#c8ccd0", "none", ('p', r'fillet', "1 fillet"), proxy=True,
     note="USDA record: sea bass, mixed species, cooked, dry heat. Gilthead sea bream has no USDA record and uses this one (PROXY): both are lean white farmed Adriatic fish.")
add2("shrimp", "Shrimp (cooked)", ["kozice", "kozica", "škampi", "skampi", "račići", "racici", "shrimp", "prawns", "gamberi"], "solid",
     175180, "#f2a090", "none", ('p', r'oz', "1 portion, 85 g"),
     note="USDA record: shrimp, cooked. Langoustines use it too: USDA has no langoustine record.")
add2("fish-sticks", "Fish sticks", ["riblji štapići", "riblji stapici", "fish sticks", "fish fingers", "riblji prsti"], "solid",
     174195, "#e8c070", "null", ('g', 112, "4 sticks", "USDA portion: 1 stick = 28 g; 4 sticks is our assumption of a portion"),
     piece=("stick", 28, "USDA portion: 1 stick (4\" × 1\" × ½\") = 28 g"),
     note="USDA record: fish sticks, frozen, prepared (breaded). Free sugars null: breading, no split.")
# salads, bread
add2("rocket-salad", "Rocket salad", ["rikola", "rukola", "rucola", "rikola salata", "rocket", "arugula", "rocket salad"], "solid",
     169387, "#5a8a3a", "none", ('g', 40, "1 bowl, 40 g", "our assumption: 2 handfuls (USDA ½ cup = 10 g)"))
builder("rocket-salad", "Dressing?", dressing("rocket-salad", "Rocket"), "Rocket salad: USDA raw rocket (arugula) plus the dressing you pick, in USDA spoon portions.", ask="Dressing?", cite=DR, url=DRU)
add2("beetroot", "Pickled beetroot", ["cikla", "cikla salata", "salata od cikle", "crvena repa", "pickled beets", "beetroot", "beets"], "solid",
     170480, "#8a1a3a", "upper", ('g', 100, "1 bowl, 100 g", "our assumption: USDA 1 cup of slices = 227 g; a side salad is less"),
     note="USDA record: pickled beets, canned, with the liquid. Upper-bound free sugars: the pickle usually has added sugar, no split.")
add2("tortilla", "Flour tortilla", ["tortilja", "tortilla", "tortilje", "tortillas", "flour tortilla", "wrap tortilja", "pšenična tortilja"], "solid",
     175037, "#eedcb0", "null", ('p', r'10" dia', "1 tortilla"), gi="a1_wheat_tortilla",
     note="USDA record: flour tortilla, refrigerated; 1 tortilla (10 inch) = 72 g. Free sugars null: no added-sugar split.")
for _id in NEW_2026_10_29:
    CHANGED_ON_PURPOSE.setdefault(_id, "2026-10-29 round 2: new food (owner: more detailed choices; chooser-gaps-2026-10-29.md)")
