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
    mix=[(171891, 30), (171265, 120)], note="COMPUTED mix (our assumption: 30 g espresso + 120 g whole milk, foam not modelled). Not a USDA record.")
add("latte", "Latte", ["latte", "caffe latte", "kava latte", "late", "late macchiato", "café latte"], "liquid",
    None, "#c9a47c", "none", ('g', 250, "1 glass, 250 g", "our assumption"),
    mix=[(171891, 30), (171265, 220)], note="COMPUTED mix (our assumption: 30 g espresso + 220 g whole milk). Not a USDA record.")
add("black-tea", "Black tea", ["crni čaj", "crni caj", "black tea", "čaj", "caj", "tea", "english tea"], "liquid",
    173227, "#8a4a14", "none", ('ml', 250, r'fl oz'), note="Brewed, tap water, no sugar or milk.")
add("green-tea", "Green tea", ["zeleni čaj", "zeleni caj", "green tea", "čaj", "caj", "tea"], "liquid",
    171917, "#c6c04a", "none", ('ml', 250, r'fl oz'), note="Brewed, regular.")
add("herbal-tea", "Herbal tea", ["biljni čaj", "biljni caj", "herbal tea", "čaj", "caj", "tea", "kamilica", "menta", "voćni čaj"], "liquid",
    173232, "#d9b25a", "none", ('ml', 250, r'fl oz'), note="USDA record: herb tea other than chamomile, brewed.")
add("iced-tea", "Iced tea (sweetened)", ["ledeni čaj", "ledeni caj", "iced tea", "ice tea", "ledeni čaj limun"], "liquid",
    171888, "#c98a2b", "all", ('mlx', 250, 175111, r'fl oz'),
    note="Black tea ready-to-drink, lemon, sweetened. Density from USDA 175111 (Lipton Brisk lemon tea, 1 fl oz = 30.6 g, 1.035 g/ml): this record's only portion, 1 cup = 271 g (1.145 g/ml), is impossible for a ~10% sugar drink.")
add("milk-whole", "Milk (whole)", ["mlijeko", "punomasno mlijeko", "mlijeko 3.2", "whole milk", "milk", "mleko", "mlijeko punomasno"], "liquid",
    171265, "#f4f1ea", "none", ('ml', 250, r'cup'), gi="milk_full", note="3.25% fat, with added vitamin D.")
add("milk-semi-skimmed", "Milk (2%, reduced-fat)", ["milk (semi-skimmed, 2%)", "polumasno mlijeko", "mlijeko 1.5", "mlijeko 2", "semi-skimmed milk", "reduced fat milk", "2% milk", "milk", "mlijeko"], "liquid",
    171267, "#f4f1ea", "none", ('ml', 250, r'cup'), gi="milk_full", note="2% fat. GI: Table 1 gives full-fat 39 and skim 37; the full-fat value is shown here as nearest tested class.")
add("milk-skimmed", "Milk (skim)", ["milk (skimmed)", "obrano mlijeko", "mlijeko 0.5", "skim milk", "skimmed milk", "nonfat milk", "milk", "mlijeko"], "liquid",
    171269, "#f0f0ea", "none", ('ml', 250, r'cup'), gi="milk_skim")
add("chocolate-milk", "Chocolate milk", ["čokoladno mlijeko", "cokoladno mlijeko", "chocolate milk", "kakao"], "liquid",
    170880, "#8a5a3c", "minusLactose", ('ml', 250, r'cup'))
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
    170904, "#f5f1e6", "none", ('ml', 250, r'cup'), note="Lifeway low-fat plain kefir (branded record inside SR Legacy).")
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
    168214, "#e8708a", "all", ('mlx', 250, 173933, r'fl oz'),
    note="Branded Naked Juice strawberry-banana, a juice-based smoothie. WHO counts sugars in fruit juices as free sugars. Density from USDA 173933 (apple juice, 1 fl oz = 31 g, 1.048 g/ml): every USDA smoothie 'cup' weight is below 1 g/ml (a fill weight, not a density).")
add("protein-shake", "Protein shake (whey + milk)", ["proteinski shake", "protein shake", "shake", "proteinski napitak", "whey"], "liquid",
    None, "#e9dfc9", "none", ('g', 280, "1 shaker, 280 g", "our assumption"),
    mix=[(173180, 30), (171267, 250)], note="COMPUTED mix (our assumption: 30 g whey-based protein powder USDA 173180 + 250 g 2% milk). Not a USDA record; powders vary strongly by brand.")
add("lemonade", "Lemonade (ready to drink)", ["limunada", "lemonade"], "liquid",
    173217, "#f3ec9a", "all", ('ml', 250, r'cup|fl oz'), gi="softdrink", note="Prepared from concentrate.")

# ---------------- DAIRY / EGGS ----------------
# audit 2026-10-17: "navlaka" removed (the cream skin on milk, not yogurt)
add("yogurt-plain", "Yogurt (plain, whole milk)", ["jogurt", "plain yogurt", "yoghurt", "yogurt", "bijeli jogurt", "kiselo mlijeko"], "semi",
    171284, "#f7f3ea", "none", ('p', r'8 fl oz|cup', "1 bowl, 245 g"))
add("yogurt-lowfat", "Yogurt (plain, low fat)", ["nemasni jogurt", "jogurt 1.5", "lowfat yogurt", "low fat yogurt", "jogurt", "yogurt", "yoghurt"], "semi",
    170886, "#f7f3ea", "none", ('p', r'8 fl oz|cup', "1 bowl, 245 g"))
add("yogurt-greek", "Greek yogurt (plain, low fat)", ["grčki jogurt", "grcki jogurt", "greek yogurt", "grcki", "jogurt"], "semi",
    170903, "#f8f4ea", "none", ('p', r'container'))
add("yogurt-fruit", "Yogurt (fruit, low fat)", ["voćni jogurt", "vocni jogurt", "fruit yogurt", "jogurt s voćem", "jogurt", "yogurt"], "semi",
    170889, "#f2c3c9", "minusLactose", ('p', r'container|cup|8 oz'), gi="yogurt_fruit")
# audit 2026-10-17: "gouda" was on cheddar too and cheddar won the tie; "žuti sir"/"trapist" (Croatian semi-hard
# yellow cheese) moved to gouda; "ementaler" removed (Swiss cheese, no entry for it). "sir" → gouda, "cheese" → cheddar.
add("cheese-cheddar", "Cheese (cheddar)", ["sir", "cheddar", "cheese"], "solid",
    170899, "#f0b83a", "none", ('p', r'slice \(1 oz'))
add("cheese-gouda", "Cheese (gouda)", ["gouda", "gauda", "sir", "cheese", "edamer", "žuti sir", "zuti sir", "trapist"], "solid",
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
add("bread-white", "White bread", ["bijeli kruh", "kruh", "bread", "white bread", "kruh bijeli", "štruca", "struca", "tost", "polubijeli kruh"], "solid",
    174924, "#efe0b8", "null", ('p', r'slice'), gi="white_bread", note="Free sugars null: white bread contains sugars but USDA gives no added-sugar split.")
add("bread-wholemeal", "Wholemeal bread", ["integralni kruh", "crni kruh", "kruh", "whole wheat bread", "wholemeal bread", "bread"], "solid",
    172688, "#b88a52", "null", ('p', r'slice'), gi="wholemeal_bread")
add("bread-rye", "Rye bread", ["raženi kruh", "razeni kruh", "kruh", "rye bread", "bread"], "solid",
    172684, "#8c6a3f", "null", ('p', r'slice'))
# audit 2026-10-17: "pecivo" removed here and from croissant (a Croatian roll of ~60-80 g is neither a 30 g baguette slice nor a croissant)
add("bread-french", "Baguette / French bread", ["baget", "baguette", "french bread", "kruh", "štangica", "bread"], "solid",
    172675, "#e6c88a", "null", ('g', 30, "1 slice", "our assumption: the USDA 'slice' of this record is 139 g"))
# audit 2026-10-17: USDA turnover proxy replaced by a Croatian producer label (override below): the turnover had
# 228 kcal and 7.87 g sugar per 100 g; burek labels give 247-316 kcal and 2-3.4 g sugar. Serving: the producer's
# net weight of one piece. "pastry" (usually sweet) and bare "pita" (any pie, e.g. pita od jabuka) removed.
add("burek", "Burek (meat/cheese pastry)", ["burek", "sirnica", "sirna pita", "burek sa sirom", "mesni burek", "burek s mesom"], "solid",
    168963, "#d9a860", "null", ('g', 150, "1 piece", "producer: Čakovečki mlinovi burek, net weight 150 g"), proxy=True,
    note="PROXY: USDA has no burek record in SR Legacy. Energy and nutrients come from one Croatian producer label (Čakovečki mlinovi); water from the USDA turnover 'Turnover, filled with egg, meat and cheese, frozen'. Burek labels range 247-316 kcal per 100 g (Sofka beef 247, Čakovečki mlinovi 297, Lidl meat 316).")
# audit 2026-10-17: was frozen pizza 170317 + an app-side 107 g slice taken from THIS record; now the record itself.
add("pizza", "Pizza (cheese)", ["pizza", "pica", "margherita", "pizza margherita", "sirna pizza"], "solid",
    173292, "#e8b04a", "null", ('p', r'^slice$'), note="Fast-food chain 14-inch cheese pizza, regular crust; 1 slice = 107 g (USDA portion).")
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
    "Potatoes, mashed, home-prepared, whole milk and butter added", "#f3e5ad", "none", ('p', r'cup'), gi=None)
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
add("pancake", "Pancakes (US-style)", ["palačinke", "palacinke", "pancakes", "pancake", "palačinka"], "solid",
    "Pancakes, plain, prepared from recipe", "#e9c98a", "upper", ('p', r'4" dia|medium|\d'), proxy=True,
    note="PROXY for palačinke: a US fluffy pancake from recipe (baking powder, 4-inch); crêpes are thinner. Upper-bound rule (sugar in recipe).")

# ---------------- MEAT / FISH ----------------
add("chicken-breast", "Chicken breast (roasted)", ["piletina", "pileća prsa", "pilece prsa", "chicken breast", "chicken", "piletina prsa", "pile"], "solid",
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
add("pork-chop", "Pork chop / loin (roasted)", ["svinjetina", "svinjski kotlet", "kotlet", "pork", "svinjsko meso", "pork chop", "svinjski"], "solid",
    "Pork, fresh, loin, whole, separable lean and fat, cooked, roasted", "#d6a888", "none", ('p', r'chop|oz|slice', "1 chop"))
add("lamb-roast", "Lamb (roasted)", ["janjetina", "janjeće", "janjece", "lamb", "janje"], "solid",
    174312, "#9a5a3a", "none", ('p', r'oz|cup|slice'))
# audit 2026-10-17: was 171986 "canned in water, WITHOUT SALT" (Na 50 mg); EU canned tuna is salted.
add("tuna-canned", "Tuna (canned in water)", ["tuna", "tuna iz konzerve", "tunjevina", "tuna konzerva", "riba"], "solid",
    173709, "#d9b8a0", "none", ('p', r'^can$'))
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
add("beans-kidney", "Kidney beans (boiled)", ["grah", "crveni grah", "kidney beans", "beans", "grah kuhani", "fižol", "pasulj"], "solid",
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
    "Tangerines, (mandarin oranges), raw", "#f6891c", "none", ('p', r'medium'))
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
    "Pears, raw", "#c9d46a", "none", ('p', r'medium'))
# audit 2026-10-17: "nektarina" (own USDA record, 44 vs 39 kcal) removed; "višnje" (sour cherries) removed from sweet cherries
add("peach", "Peach", ["breskva", "breskve", "peach", "peaches"], "solid",
    "Peaches, yellow, raw", "#f4b05a", "none", ('p', r'medium'))
add("cherries", "Cherries (sweet)", ["trešnje", "tresnje", "cherries", "cherry"], "solid",
    "Cherries, sweet, raw", "#9a1a2e", "none", ('p', r'NLEA', "1 bowl, 140 g"), gi="a1_cherries")
add("plum", "Plum", ["šljiva", "sljiva", "šljive", "sljive", "plum", "plums"], "solid",
    "Plums, raw", "#6a2a5a", "none", ('p', r'fruit|medium'))
add("kiwi", "Kiwi", ["kivi", "kiwi", "kiwifruit"], "solid",
    "Kiwifruit, green, raw", "#8aa83a", "none", ('p', r'medium|fruit'), gi="a1_kiwi")
add("pineapple", "Pineapple", ["ananas", "pineapple"], "solid",
    "Pineapple, raw, all varieties", "#f2d44a", "none", ('p', r'cup|slice'), gi="pineapple")
add("blueberries", "Blueberries", ["borovnice", "borovnica", "blueberries", "blueberry"], "solid",
    "Blueberries, raw", "#4a4a8a", "none", ('p', r'cup'))
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
    168000, "#5a3220", "upper", ('g', 15, "1 portion (1 tbsp)", "label: Ferrero Nutella portion 15 g"),
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
add("croissant", "Croissant", ["kroasan", "croissant", "kroasani"], "solid",
    "Croissants, butter", "#e2b25e", "null", ('p', r'medium'), note="Contains added sugar in dough but USDA gives no split; null.")
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
add("potato-chips", "Potato chips", ["potato chips (crisps)", "čips", "cips", "chips", "crisps", "potato chips", "grickalice"], "solid",
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
    note="NO DATA: SR Legacy has no doner/gyros/kebab record and any value would be a guess. All numeric fields null.")
# audit 2026-10-17: was 170308 (turkey + roast beef + ham sub); 170707 is the ham sub, matching "sa šunkom".
add("sandwich-ham", "Ham sandwich (sub)", ["sendvič", "sendvic", "sandwich", "sub", "sendvic sa sunkom", "sendvič sa šunkom", "ham sandwich"], "solid",
    170707, "#e8c888", "null", ('p', r'inch sub', "1 sub (15 cm)"), note="US fast-food submarine sandwich, ham on white bread with lettuce and tomato.")


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
    "Burek: there is no USDA burek, so the values are from a Croatian producer label (Čakovečki mlinovi: 297 kcal, 16 g fat, 3.3 g sugar per 100 g). Burek varies: labels range from about 250 to 320 kcal per 100 g.",
    "Čakovečki mlinovi, Burek (net weight 150 g): energy 1241 kJ / 297 kcal, fat 16 g, saturates 7.5 g, carbohydrate 29 g, sugars 3.3 g, protein 9.7 g, salt 1.4 g. Range: Sofka beef burek 247 kcal, Lidl meat burek 316 kcal (Open Food Facts 9120018535583, 4056489610953)",
    "https://cak-mlinovi.hr/en/kategorija_proizvoda/baked-goods/",
    note="Sodium = 1.4 / 2.5 = 560 mg. Fiber not declared (None). Water stays from the USDA turnover proxy.",
    ranges={"kcal": (247, 316), "sugars": (2.2, 3.4)})


