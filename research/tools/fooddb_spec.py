# -*- coding: utf-8 -*-
"""Spec for fooddb.json. Each entry is a dict; build_fooddb.py resolves USDA records and writes the JSON.
usda: FDC id (int) | exact SR Legacy description (str)
mix:  optional [(usda, grams), ...] computed recipe (weights are OUR assumption, flagged in notes)
free: none | all | minusLactose | upper | null   (free-sugar rule, see fooddb-notes.md)
serving: ('p', regex_on_portion_modifier)  -> USDA portion, label from USDA
         ('ml', n, regex)                  -> n ml, grams = n * (USDA grams / ml of the matched fluid portion)
         ('g', grams, label, why)          -> explicit
gi: key into GI table in build script
"""
E = []
def add(id, name, aliases, kind, usda, color, free, serving, gi=None, note="", mix=None, proxy=False):
    E.append(dict(id=id, name=name, aliases=aliases, kind=kind, usda=usda, color=color, free=free,
                  serving=serving, gi=gi, note=note, mix=mix, proxy=proxy))

# ---------------- DRINKS ----------------
add("water", "Water (tap)", ["voda", "water", "tap water", "pitka voda", "vodovodna voda"], "liquid",
    173647, "#cfe8ff", "none", ('ml', 250, r'fl oz'))
add("sparkling-water", "Sparkling mineral water", ["gazirana voda", "mineralna voda", "mineral water", "sparkling water", "perrier", "soda voda", "gazirana"], "liquid",
    173233, "#d6ecff", "none", ('ml', 250, r'fl oz'), note="USDA record is bottled Perrier.")
add("cola", "Cola (regular)", ["cola", "kola", "coca cola", "coca-cola", "pepsi", "gazirani sok", "soda", "soft drink", "sok"], "liquid",
    174852, "#2a120a", "all", ('ml', 330, r'fl oz'), gi="softdrink", note="Free sugars rule: all sugars in a soft drink are added sugars.")
add("diet-cola", "Diet cola", ["diet cola", "cola zero", "coca cola zero", "light cola", "dijetalna cola", "cola light", "pepsi max", "zero cola"], "liquid",
    175099, "#2a120a", "none", ('ml', 330, r'fl oz'), note="Sweetened with aspartame (USDA record: low calorie, with aspartame, contains caffeine).")
add("orange-juice", "Orange juice", ["sok od naranče", "sok od narance", "narančin sok", "narancin sok", "orange juice", "juice", "sok", "voćni sok", "vocni sok"], "liquid",
    169100, "#f5a21b", "all", ('ml', 250, r'fl oz'), gi="orange_juice", note="Chilled, includes from concentrate.")
add("apple-juice", "Apple juice", ["sok od jabuke", "jabučni sok", "jabucni sok", "apple juice", "juice", "sok", "voćni sok", "vocni sok"], "liquid",
    173933, "#d9a93a", "all", ('ml', 250, r'fl oz'), gi="apple_juice", note="Canned or bottled, unsweetened, without added ascorbic acid.")
add("tomato-juice", "Tomato juice", ["sok od rajčice", "sok od rajcice", "tomato juice", "paradajz sok"], "liquid",
    "Tomato juice, canned, without salt added", "#b8321f", "none", ('ml', 250, r'fl oz'),
    note="WHO free-sugar definition (as quoted in foods.md G1) names fruit juices and juice concentrates, not vegetable juice.")
add("coconut-water", "Coconut water", ["kokosova voda", "coconut water"], "liquid",
    "Nuts, coconut water (liquid from coconuts)", "#eef0e4", "null", ('ml', 250, r'cup'),
    note="Free-sugar status of coconut water is not defined in the WHO text we read, so freeSugars is null.")
add("energy-drink", "Energy drink", ["energetsko piće", "energetsko pice", "energy drink", "red bull", "monster", "energetik", "energetski napitak"], "liquid",
    173210, "#e8e34a", "all", ('p', r'can'), gi="softdrink", note="USDA record is Red Bull. GI value is the Table 1 'soft drink/soda' average, not tested on energy drinks.")
add("espresso", "Espresso", ["espresso", "kava", "espreso", "crna kava", "kafa", "mala kava"], "liquid",
    171891, "#2b1608", "none", ('ml', 30, r'fl oz'), note="Restaurant-prepared espresso, serving 30 ml is a single shot by volume only.")
add("filter-coffee", "Coffee (filter / brewed)", ["filter kava", "kava", "coffee", "brewed coffee", "filter coffee", "crna kava", "kafa", "turska kava"], "liquid",
    171890, "#3a1d0c", "none", ('ml', 250, r'fl oz'), note="Brewed with tap water.")
add("coffee-with-milk", "Coffee with milk", ["kava s mlijekom", "bijela kava", "kava sa mlijekom", "coffee with milk", "macchiato", "makijato", "kava s mlekom"], "liquid",
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
    171888, "#c98a2b", "all", ('ml', 250, r'cup'), note="Black tea ready-to-drink, lemon, sweetened.")
add("milk-whole", "Milk (whole)", ["mlijeko", "punomasno mlijeko", "mlijeko 3.2", "whole milk", "milk", "mleko", "mlijeko punomasno"], "liquid",
    171265, "#f4f1ea", "none", ('ml', 250, r'cup'), gi="milk_full", note="3.25% fat, with added vitamin D.")
add("milk-semi-skimmed", "Milk (semi-skimmed, 2%)", ["polumasno mlijeko", "mlijeko 1.5", "mlijeko 2", "semi-skimmed milk", "reduced fat milk", "2% milk", "milk", "mlijeko"], "liquid",
    171267, "#f4f1ea", "none", ('ml', 250, r'cup'), gi="milk_full", note="2% fat. GI: Table 1 gives full-fat 39 and skim 37; the full-fat value is shown here as nearest tested class.")
add("milk-skimmed", "Milk (skimmed)", ["obrano mlijeko", "mlijeko 0.5", "skim milk", "skimmed milk", "nonfat milk", "milk", "mlijeko"], "liquid",
    171269, "#f0f0ea", "none", ('ml', 250, r'cup'), gi="milk_skim")
add("chocolate-milk", "Chocolate milk", ["čokoladno mlijeko", "cokoladno mlijeko", "chocolate milk", "kakao"], "liquid",
    170880, "#8a5a3c", "minusLactose", ('ml', 250, r'cup'))
add("hot-chocolate", "Hot chocolate (homemade, with milk)", ["topla čokolada", "topla cokolada", "hot chocolate", "hot cocoa", "kakao", "vruća čokolada"], "liquid",
    171277, "#6b4028", "minusLactose", ('ml', 250, r'cup'))
add("soy-milk", "Soy milk", ["sojino mlijeko", "soy milk", "soja", "plant milk", "biljno mlijeko"], "liquid",
    "Soymilk, original and vanilla, unfortified", "#efe6c6", "upper", ('ml', 250, r'cup'), gi="soy_milk",
    note="Original and vanilla soymilk usually contains added sugar; upper-bound rule used.")
add("almond-milk", "Almond milk (unsweetened)", ["bademovo mlijeko", "almond milk", "plant milk", "biljno mlijeko"], "liquid",
    174832, "#f1ead9", "none", ('ml', 250, r'cup'), note="Unsweetened, shelf-stable.")
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
    168214, "#e8708a", "all", ('ml', 250, r'fl oz|cup'), note="Branded Naked Juice strawberry-banana, a juice-based smoothie. WHO counts sugars in fruit juices as free sugars.")
add("protein-shake", "Protein shake (whey + milk)", ["proteinski shake", "protein shake", "shake", "proteinski napitak", "whey"], "liquid",
    None, "#e9dfc9", "null", ('g', 280, "1 shaker, 280 g", "our assumption"),
    mix=[(173180, 30), (171267, 250)], note="COMPUTED mix (our assumption: 30 g whey-based protein powder USDA 173180 + 250 g 2% milk). Not a USDA record; powders vary strongly by brand.")
add("lemonade", "Lemonade (ready to drink)", ["limunada", "lemonade"], "liquid",
    173217, "#f3ec9a", "all", ('ml', 250, r'cup|fl oz'), gi="softdrink", note="Prepared from concentrate.")

# ---------------- DAIRY / EGGS ----------------
add("yogurt-plain", "Yogurt (plain, whole milk)", ["jogurt", "navlaka", "plain yogurt", "yoghurt", "yogurt", "bijeli jogurt", "kiselo mlijeko"], "semi",
    171284, "#f7f3ea", "none", ('p', r'8 fl oz|cup'))
add("yogurt-lowfat", "Yogurt (plain, low fat)", ["nemasni jogurt", "jogurt 1.5", "lowfat yogurt", "low fat yogurt", "jogurt", "yogurt", "yoghurt"], "semi",
    170886, "#f7f3ea", "none", ('p', r'8 fl oz|cup'))
add("yogurt-greek", "Greek yogurt (plain, low fat)", ["grčki jogurt", "grcki jogurt", "greek yogurt", "grcki", "jogurt"], "semi",
    170903, "#f8f4ea", "none", ('p', r'container'))
add("yogurt-fruit", "Yogurt (fruit, low fat)", ["voćni jogurt", "vocni jogurt", "fruit yogurt", "jogurt s voćem", "jogurt", "yogurt"], "semi",
    170889, "#f2c3c9", "minusLactose", ('p', r'container|cup|8 oz'), gi="yogurt_fruit")
add("cheese-cheddar", "Cheese (cheddar)", ["sir", "cheddar", "žuti sir", "zuti sir", "cheese", "ementaler", "trapist", "gouda"], "solid",
    170899, "#f0b83a", "none", ('p', r'slice \(1 oz'))
add("cheese-gouda", "Cheese (gouda)", ["gouda", "gauda", "sir", "cheese", "edamer"], "solid",
    171241, "#f2c84f", "none", ('p', r'slice|oz'))
add("cheese-mozzarella", "Cheese (mozzarella)", ["mozzarella", "mocarela", "mozzarela", "sir", "cheese"], "solid",
    170845, "#f6f1e0", "none", ('p', r'oz|slice'))
add("cheese-feta", "Cheese (feta)", ["feta", "ovčji sir", "ovcji sir", "bijeli sir", "sir", "cheese"], "solid",
    "Cheese, feta", "#f4f0e2", "none", ('p', r'oz'))
add("cheese-cottage", "Cottage cheese (creamed)", ["svježi sir", "svjezi sir", "cottage cheese", "skuta", "sir", "cheese", "vrhnje sir"], "semi",
    "Cheese, cottage, creamed, large or small curd", "#f7f4ea", "none", ('p', r'cup'))
add("cheese-parmesan", "Cheese (parmesan)", ["parmezan", "parmesan", "sir", "cheese", "tvrdi sir"], "solid",
    170848, "#f0dd9a", "none", ('p', r'oz|tbsp|cup'))
add("egg-boiled", "Egg (hard-boiled)", ["jaje", "jaja", "kuhano jaje", "kuhana jaja", "boiled egg", "egg", "eggs"], "solid",
    "Egg, whole, cooked, hard-boiled", "#f6df8a", "none", ('p', r'large'))
add("egg-fried", "Egg (fried)", ["pečeno jaje", "pečeno jaje", "pohano jaje", "jaje na oko", "fried egg", "egg", "eggs", "jaja"], "solid",
    "Egg, whole, cooked, fried", "#f0d060", "none", ('p', r'large'))
add("butter", "Butter (salted)", ["maslac", "butter", "puter"], "solid",
    "Butter, salted", "#f2dc7a", "none", ('p', r'tbsp'))

# ---------------- BREAD / CEREALS / STARCH ----------------
add("bread-white", "White bread", ["bijeli kruh", "kruh", "bread", "white bread", "kruh bijeli", "štruca", "struca", "tost"], "solid",
    174924, "#efe0b8", "null", ('p', r'slice'), gi="white_bread", note="Free sugars null: white bread contains sugars but USDA gives no added-sugar split.")
add("bread-wholemeal", "Wholemeal bread", ["integralni kruh", "crni kruh", "kruh", "whole wheat bread", "wholemeal bread", "bread", "polubijeli kruh"], "solid",
    172688, "#b88a52", "null", ('p', r'slice'), gi="wholemeal_bread")
add("bread-rye", "Rye bread", ["raženi kruh", "razeni kruh", "kruh", "rye bread", "bread"], "solid",
    172684, "#8c6a3f", "null", ('p', r'slice'))
add("bread-french", "Baguette / French bread", ["baget", "baguette", "pecivo", "french bread", "kruh", "štangica", "bread"], "solid",
    172675, "#e6c88a", "null", ('p', r'slice|oz'))
add("burek", "Burek (meat/cheese pastry)", ["burek", "sirnica", "pita od sira", "pita", "mesni burek", "pastry"], "solid",
    168963, "#d9a860", "null", ('p', r'\d|piece|serving|turnover'), proxy=True,
    note="PROXY: USDA has no burek record in SR Legacy. Closest is 'Turnover, filled with egg, meat and cheese, frozen'. Real burek (phyllo, oil) differs; treat as an estimate class, not a measurement.")
add("pizza", "Pizza (cheese)", ["pizza", "pica", "margherita", "pizza margherita", "sirna pizza"], "solid",
    170317, "#e8b04a", "null", ('p', r'serving|slice'), note="Frozen, cooked, regular crust. Per-slice portion in USDA is small.")
add("pasta", "Pasta (cooked)", ["tjestenina", "špageti", "spageti", "pasta", "makaroni", "spaghetti", "tjestenine", "njoki"], "solid",
    "Pasta, cooked, enriched, without added salt", "#f1dd9a", "none", ('p', r'cup'), gi="spaghetti_white", note="GI is Table 1 'spaghetti, white'.")
add("pasta-wholewheat", "Pasta (whole-wheat, cooked)", ["integralna tjestenina", "whole wheat pasta", "tjestenina", "pasta"], "solid",
    168910, "#c9a46a", "none", ('p', r'cup'), gi="spaghetti_whole")
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
add("oatmeal", "Oatmeal / porridge (cooked)", ["zobena kaša", "zobena kasa", "zobene pahuljice", "kaša", "kasa", "porridge", "oatmeal", "oats", "owsianka"], "semi",
    173905, "#d9c7a3", "none", ('p', r'cup'), gi="porridge", note="Cooked with water, no sugar or milk.")
add("cornflakes", "Cornflakes", ["kukuruzne pahuljice", "corn flakes", "cornflakes", "pahuljice", "žitarice", "zitarice", "cereal"], "solid",
    174648, "#e8b94a", "upper", ('p', r'cup|NLEA'), gi="cornflakes",
    note="Upper-bound free sugars rule (all listed sugars assumed added).")
add("muesli", "Muesli", ["müsli", "musli", "muesli", "žitarice", "zitarice", "cereal"], "solid",
    169076, "#c9a56c", "null", ('p', r'cup'), gi="muesli",
    note="Contains dried fruit (not free sugars) plus possibly added sugar; no split available, null.")
add("crackers", "Crackers (saltines)", ["krekeri", "slani keksi", "cracker", "crackers", "grisini"], "solid",
    "Crackers, saltines (includes oyster, soda, soup)", "#e4cf9a", "null", ('p', r'.'))
add("pancake", "Pancakes (crêpes)", ["palačinke", "palacinke", "pancakes", "pancake", "palačinka"], "solid",
    "Pancakes, plain, prepared from recipe", "#e9c98a", "upper", ('p', r'4" dia|medium|\d'), note="Plain pancakes from recipe; upper-bound rule (sugar in recipe).")

# ---------------- MEAT / FISH ----------------
add("chicken-breast", "Chicken breast (roasted)", ["piletina", "pileća prsa", "pilece prsa", "chicken breast", "chicken", "piletina prsa", "pile"], "solid",
    "Chicken, broilers or fryers, breast, meat only, cooked, roasted", "#f0dcc0", "none", ('p', r'breast|half'))
add("beef-steak", "Beef steak (grilled)", ["biftek", "goveđi odrezak", "govedi odrezak", "steak", "govedina", "beef", "odrezak", "beef steak"], "solid",
    168727, "#8a4a2a", "none", ('p', r'steak|oz'))
add("cevapi", "Ćevapi (grilled minced meat)", ["ćevapi", "cevapi", "ćevapčići", "cevapcici", "ćevap", "cevap", "minced meat", "mljeveno meso"], "solid",
    "Beef, ground, 80% lean meat / 20% fat, patty, cooked, pan-broiled", "#a35a35", "none", ('p', r'oz'), proxy=True,
    note="PROXY: USDA has no ćevapi record. Ground beef 80/20 pan-broiled patty is the closest class (real ćevapi are usually beef-lamb-pork with spices and salt).")
add("pork-chop", "Pork chop / loin (roasted)", ["svinjetina", "svinjski kotlet", "kotlet", "pork", "svinjsko meso", "pork chop", "svinjski"], "solid",
    "Pork, fresh, loin, whole, separable lean and fat, cooked, roasted", "#d6a888", "none", ('p', r'chop|oz|slice'))
add("lamb-roast", "Lamb (roasted)", ["janjetina", "janjeće", "janjece", "lamb", "janje"], "solid",
    174312, "#9a5a3a", "none", ('p', r'oz|cup|slice'))
add("tuna-canned", "Tuna (canned in water)", ["tuna", "tuna iz konzerve", "tunjevina", "tuna konzerva", "riba"], "solid",
    171986, "#d9b8a0", "none", ('p', r'can|cup|oz'))
add("salmon", "Salmon (cooked)", ["losos", "salmon", "riba", "pečeni losos"], "solid",
    "Fish, salmon, Atlantic, farmed, cooked, dry heat", "#f08a5a", "none", ('p', r'fillet|oz'))
add("cod", "Cod / white fish (cooked)", ["bakalar", "oslić", "oslic", "bijela riba", "cod", "riba", "white fish", "fish"], "solid",
    "Fish, cod, Atlantic, cooked, dry heat", "#efe8da", "none", ('p', r'fillet|oz'))
add("sardines", "Sardines (canned in oil)", ["sardine", "srdele", "sardines", "riba", "plava riba"], "solid",
    "Fish, sardine, Atlantic, canned in oil, drained solids with bone", "#b8a89a", "none", ('p', r'can|sardine|oz'))
add("ham", "Ham (sliced)", ["šunka", "sunka", "ham", "narezak", "pureća šunka"], "solid",
    "Ham, sliced, regular (approximately 11% fat)", "#e8a7a0", "null", ('p', r'slice|oz'))
add("sausage", "Sausage (pork, cooked)", ["kobasica", "kobasice", "sausage", "kranjska", "hrenovka"], "solid",
    174577, "#b86a4a", "null", ('p', r'link|oz|sausage'))
add("frankfurter", "Frankfurter / hot-dog sausage", ["hrenovke", "hrenovka", "hot dog kobasica", "frankfurter", "hot dog", "virsla"], "solid",
    174614, "#d98a70", "null", ('p', r'frankfurter|oz'))
add("salami", "Salami (dry, pork)", ["salama", "salami", "kulen", "narezak"], "solid",
    "Salami, dry or hard, pork", "#a8403a", "null", ('p', r'slice'))
add("bacon", "Bacon (cooked)", ["slanina", "bacon", "pancetta", "panceta"], "solid",
    "Pork, cured, bacon, cooked, baked", "#c0603c", "null", ('p', r'slice'))
add("tofu", "Tofu (firm)", ["tofu", "sojin sir"], "solid",
    "Tofu, raw, firm, prepared with calcium sulfate", "#f3ecd5", "none", ('p', r'cup|oz|slice'))

# ---------------- LEGUMES / VEG ----------------
add("beans-kidney", "Kidney beans (boiled)", ["grah", "crveni grah", "kidney beans", "beans", "grah kuhani", "fižol", "pasulj"], "solid",
    "Beans, kidney, red, mature seeds, cooked, boiled, without salt", "#7a2f2a", "none", ('p', r'cup'), gi="kidney_beans")
add("beans-white", "White beans (boiled)", ["bijeli grah", "bijeli grah kuhani", "white beans", "beans", "grah", "tavče gravče"], "solid",
    "Beans, white, mature seeds, cooked, boiled, without salt", "#ece4cc", "none", ('p', r'cup'))
add("lentils", "Lentils (boiled)", ["leća", "leca", "lentils", "lećа", "grah"], "solid",
    "Lentils, mature seeds, cooked, boiled, without salt", "#a8794a", "none", ('p', r'cup'), gi="lentils")
add("chickpeas", "Chickpeas (boiled)", ["slanutak", "slanutak kuhani", "chickpeas", "garbanzo", "leblebije"], "solid",
    "Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt", "#d9bf84", "none", ('p', r'cup'), gi="chickpeas")
add("peas", "Green peas (boiled)", ["grašak", "grasak", "peas", "green peas", "zeleni grašak"], "solid",
    "Peas, green, cooked, boiled, drained, without salt", "#7aa83a", "none", ('p', r'cup'))
add("hummus", "Hummus", ["humus", "hummus"], "semi",
    "Hummus, commercial", "#dcc088", "null", ('p', r'tbsp|cup'))
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
    "Carrots, raw", "#ee8a1f", "none", ('p', r'medium|large'),
    note="GI left null: Table 1 gives 39 for 'carrots, boiled'; Atkinson's text also quotes carrots GI 39 but raw carrot is not separately listed.")
add("broccoli", "Broccoli (raw)", ["brokula", "brokoli", "broccoli"], "solid",
    "Broccoli, raw", "#4f8a3a", "none", ('p', r'cup|stalk|spear'))
add("onion", "Onion", ["luk", "crveni luk", "onion", "onions", "bijeli luk"], "solid",
    "Onions, raw", "#e9dcc0", "none", ('p', r'medium|cup'))
add("pepper-red", "Red bell pepper", ["paprika", "crvena paprika", "bell pepper", "pepper", "paprike", "babura"], "solid",
    "Peppers, sweet, red, raw", "#cf2a1f", "none", ('p', r'medium|large|cup'))
add("spinach", "Spinach (raw)", ["špinat", "spinat", "spinach", "blitva"], "solid",
    "Spinach, raw", "#3f7a2a", "none", ('p', r'cup'))
add("zucchini", "Zucchini", ["tikvice", "tikvica", "zucchini", "courgette"], "solid",
    "Squash, summer, zucchini, includes skin, raw", "#9bbf5a", "none", ('p', r'medium|cup'))
add("mushrooms", "Mushrooms (white, raw)", ["gljive", "šampinjoni", "sampinjoni", "mushrooms", "pečurke", "pecurke"], "solid",
    "Mushrooms, white, raw", "#e4d9c8", "none", ('p', r'cup|medium|large'))
add("sweet-corn", "Sweet corn (boiled)", ["kukuruz šećerac", "kukuruz secerac", "kukuruz", "sweet corn", "corn", "kukuruz kuhani"], "solid",
    "Corn, sweet, yellow, cooked, boiled, drained, without salt", "#f0cf3a", "none", ('p', r'cup|ear'), gi="sweet_corn")
add("sweet-potato", "Sweet potato (boiled)", ["batat", "slatki krumpir", "sweet potato", "slatki krompir"], "solid",
    "Sweet potato, cooked, boiled, without skin", "#e8883a", "none", ('p', r'^medium'), gi="sweet_potato")
add("olives", "Olives (canned, ripe)", ["masline", "olive", "olives", "crne masline"], "solid",
    "Olives, ripe, canned (small-extra large)", "#3a3a2a", "none", ('p', r'large|small|extra|cup|tbsp'))
add("olive-oil", "Olive oil", ["maslinovo ulje", "ulje", "olive oil", "maslinovo", "oil"], "liquid",
    "Oil, olive, salad or cooking", "#c8b43a", "none", ('p', r'tablespoon'))
add("vegetable-soup", "Vegetable soup", ["juha od povrća", "juha od povrca", "povrtna juha", "vegetable soup", "soup", "juha"], "semi",
    174564, "#d98a3a", "null", ('p', r'cup'), gi="veg_soup",
    note="Canned vegetable soup prepared with water; proxy for home-made soup.")
add("chicken-soup", "Chicken noodle soup", ["pileća juha", "pilece juha", "juha", "goveđa juha", "govedja juha", "chicken soup", "soup", "juha s rezancima"], "semi",
    "Soup, chicken noodle, canned, prepared with equal volume water", "#e8c870", "null", ('p', r'cup'), note="Canned, prepared with water; proxy for home-made broth soup.")
add("tomato-soup", "Tomato soup", ["juha od rajčice", "juha od rajcice", "tomato soup", "soup", "juha"], "semi",
    171176, "#d8532a", "null", ('p', r'cup'))
add("bean-soup", "Bean soup (grah, with ham)", ["grah juha", "pasulj", "jota", "bean soup", "soup", "juha", "grah varivo"], "semi",
    "Soup, bean with ham, canned, chunky, ready-to-serve", "#9a6a3c", "null", ('p', r'cup'), proxy=True, note="PROXY: canned bean-with-ham soup for Croatian 'grah varivo'.")

# ---------------- FRUIT ----------------
add("apple", "Apple", ["jabuka", "jabuke", "apple", "apples"], "solid", 171688, "#c8e06a", "none", ('p', r'medium'), gi="apple")
add("banana", "Banana", ["banana", "banane", "bananas"], "solid", "Bananas, raw", "#f1de8c", "none", ('p', r'medium'), gi="banana")
add("orange", "Orange", ["naranča", "naranca", "narance", "orange", "oranges", "naranče"], "solid",
    "Oranges, raw, all commercial varieties", "#f59a1c", "none", ('p', r'fruit|medium'), gi="orange")
add("mandarin", "Mandarin", ["mandarina", "mandarine", "mandarin", "tangerine", "clementine"], "solid",
    "Tangerines, (mandarin oranges), raw", "#f6891c", "none", ('p', r'medium'))
add("grapes", "Grapes", ["grožđe", "grozde", "grapes", "groždje", "grozdje"], "solid",
    "Grapes, red or green (European type, such as Thompson seedless), raw", "#8fb04a", "none", ('p', r'cup'))
add("strawberries", "Strawberries", ["jagode", "jagoda", "strawberries", "strawberry"], "solid",
    "Strawberries, raw", "#d6283a", "none", ('p', r'cup|medium'))
add("watermelon", "Watermelon", ["lubenica", "lubenice", "watermelon", "dinja lubenica"], "solid",
    "Watermelon, raw", "#e84a5a", "none", ('p', r'cup|wedge'), gi="watermelon")
add("melon", "Melon (cantaloupe)", ["dinja", "dinje", "melon", "cantaloupe"], "solid",
    "Melons, cantaloupe, raw", "#f4b872", "none", ('p', r'cup|wedge'))
add("pear", "Pear", ["kruška", "kruska", "kruške", "pear", "pears"], "solid",
    "Pears, raw", "#c9d46a", "none", ('p', r'medium'))
add("peach", "Peach", ["breskva", "breskve", "peach", "peaches", "nektarina"], "solid",
    "Peaches, yellow, raw", "#f4b05a", "none", ('p', r'medium'))
add("cherries", "Cherries (sweet)", ["trešnje", "tresnje", "višnje", "visnje", "cherries", "cherry"], "solid",
    "Cherries, sweet, raw", "#9a1a2e", "none", ('p', r'NLEA'))
add("plum", "Plum", ["šljiva", "sljiva", "šljive", "sljive", "plum", "plums"], "solid",
    "Plums, raw", "#6a2a5a", "none", ('p', r'fruit|medium'))
add("kiwi", "Kiwi", ["kivi", "kiwi", "kiwifruit"], "solid",
    "Kiwifruit, green, raw", "#8aa83a", "none", ('p', r'medium|fruit'))
add("pineapple", "Pineapple", ["ananas", "pineapple"], "solid",
    "Pineapple, raw, all varieties", "#f2d44a", "none", ('p', r'cup|slice'), gi="pineapple")
add("blueberries", "Blueberries", ["borovnice", "borovnica", "blueberries", "blueberry"], "solid",
    "Blueberries, raw", "#4a4a8a", "none", ('p', r'cup'))
add("avocado", "Avocado", ["avokado", "avocado"], "solid",
    "Avocados, raw, all commercial varieties", "#a8b84a", "none", ('p', r'fruit|avocado'))
add("raisins", "Raisins", ["grožđice", "grozdice", "suho grožđe", "suho grozde", "raisins", "dried fruit", "sušeno voće", "suseno voce"], "solid",
    168165, "#4a2a1a", "none", ('p', r'small box'),
    note="Dried whole fruit: not free sugars under the WHO definition as quoted in foods.md G1 (juices, honey, syrups, added sugars).")
add("dried-apricots", "Dried apricots", ["suhe marelice", "marelice sušene", "dried apricots", "dried fruit", "sušeno voće", "suseno voce", "marelice"], "solid",
    "Apricots, dried, sulfured, uncooked", "#d9822a", "none", ('p', r'cup|half'))
add("dried-figs", "Dried figs", ["suhe smokve", "smokve", "dried figs", "dried fruit", "sušeno voće", "suseno voce", "smokva"], "solid",
    "Figs, dried, uncooked", "#6a4a3a", "none", ('p', r'cup|fig'))
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
add("sunflower-seeds", "Sunflower seeds", ["sjemenke suncokreta", "sjemenke", "suncokret", "sunflower seeds", "bundeva sjemenke"], "solid",
    "Seeds, sunflower seed kernels, dried", "#d8c48a", "none", ('p', r'^cup$'))
add("peanut-butter", "Peanut butter", ["maslac od kikirikija", "peanut butter", "kikiriki maslac", "putar od kikirikija"], "semi",
    174266, "#b88a4a", "null", ('p', r'tbsp'), note="Peanut butter may contain added sugar; USDA gives no split, null.")
add("nutella", "Hazelnut chocolate spread", ["nutella", "krem namaz", "čokoladni namaz", "cokoladni namaz", "plazma namaz", "chocolate spread"], "semi",
    168000, "#5a3220", "upper", ('p', r'tbsp'), note="Upper-bound rule: sugar is the main ingredient, milk lactose is small.")

# ---------------- SWEETS / SNACKS ----------------
add("chocolate-milk-bar", "Milk chocolate", ["mliječna čokolada", "mlijecna cokolada", "čokolada", "cokolada", "milk chocolate", "chocolate"], "solid",
    "Candies, milk chocolate", "#6a3a22", "minusLactose", ('p', r'1\.55'), gi="chocolate", note="GI is the generic Table 1 'chocolate' value (40), not milk-chocolate specific.")
add("chocolate-dark", "Dark chocolate (70-85% cacao)", ["tamna čokolada", "tamna cokolada", "gorka čokolada", "dark chocolate", "čokolada", "cokolada", "chocolate"], "solid",
    "Chocolate, dark, 70-85% cacao solids", "#3a1c10", "minusLactose", ('p', r'bar|oz|piece'), gi="chocolate", note="GI is the generic Table 1 'chocolate' value (40).")
add("ice-cream", "Ice cream (vanilla)", ["sladoled", "ice cream", "vanilla ice cream", "sladoled vanilija"], "semi",
    167575, "#f6ecc8", "minusLactose", ('p', r'cup|scoop|bar'), gi="ice_cream")
add("biscuits", "Butter biscuits / cookies", ["keksi", "biskvit", "cookies", "biscuits", "keks", "kolačići", "kolacici", "petit beurre"], "solid",
    "Cookies, butter, commercially prepared, enriched", "#e0b878", "upper", ('p', r'cookie|oz'))
add("croissant", "Croissant", ["kroasan", "croissant", "kroasani", "pecivo"], "solid",
    "Croissants, butter", "#e2b25e", "null", ('p', r'medium'), note="Contains added sugar in dough but USDA gives no split; null.")
add("cake-sponge", "Sponge cake", ["torta", "kolač", "kolac", "biskvit torta", "cake", "sponge cake", "kolači"], "solid",
    "Cake, sponge, commercially prepared", "#f0d890", "upper", ('p', r'piece'))
add("doughnut", "Doughnut (glazed)", ["krafna", "krafne", "doughnut", "donut", "krafna s marmeladom"], "solid",
    "Doughnuts, yeast-leavened, glazed, enriched (includes honey buns)", "#d9a85a", "upper", ('p', r'doughnut \(3-3/4'))
add("honey", "Honey", ["med", "honey"], "semi", "Honey", "#e8a31a", "all", ('p', r'tbsp'), gi="honey",
    note="WHO names sugars naturally present in honey as free sugars.")
add("sugar", "Sugar (white)", ["šećer", "secer", "sugar", "bijeli šećer", "kristal šećer", "white sugar", "saharoza"], "solid",
    "Sugars, granulated", "#f8f8f4", "all", ('p', r'^tsp'), gi="sucrose")
add("jam", "Jam / preserves", ["džem", "dzem", "marmelada", "jam", "preserves", "pekmez"], "semi",
    "Jams and preserves", "#a8283a", "all", ('p', r'tbsp'), gi="jam", note="GI is Table 1 'strawberry jam/jelly'.")
add("potato-chips", "Potato chips (crisps)", ["čips", "cips", "chips", "crisps", "potato chips", "grickalice"], "solid",
    169677, "#e8c060", "null", ('p', r'oz|cup|10 chips'), gi="crisps")
add("popcorn", "Popcorn (air-popped)", ["kokice", "kokice zrnje", "popcorn"], "solid",
    167959, "#f5ecc8", "none", ('p', r'cup'), gi="popcorn")
add("rice-cakes", "Rice cakes", ["rižine galete", "rizine galete", "puffed rice", "rice cakes", "galete"], "solid",
    170250, "#e4d3a8", "none", ('p', r'cake|\d'), gi="rice_crackers",
    note="GI is Table 1 'rice crackers/crisps' (87), a different product; shown as nearest class.")

# ---------------- MEALS / FAST FOOD ----------------
add("hamburger", "Hamburger (fast food)", ["hamburger", "burger", "hamburger fast food", "pljeskavica"], "solid",
    "McDONALD'S, Hamburger", "#b8803a", "null", ('p', r'sandwich|item|hamburger|\d'), note="USDA record is McDonald's hamburger.")
add("kebab", "Kebab / doner", ["kebab", "döner", "doner", "gyros", "dener"], "solid",
    None, "#c9854a", "null", ('g', None, None, "no source"), proxy=True,
    note="NO DATA: SR Legacy has no doner/gyros/kebab record and any value would be a guess. All numeric fields null.")
add("sandwich-ham", "Sandwich (turkey, roast beef and ham sub)", ["sendvič", "sendvic", "sandwich", "sub", "sendvic sa sunkom"], "solid",
    170308, "#e8c888", "null", ('g', 207, "1 six-inch sub", "USDA food_portion: 6 inch sub = 207 g"))


