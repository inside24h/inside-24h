// v23b (editor: "in the app the cola has no macro data"): a curated product (cola, espresso, water) is one database
// serving too; its parts carry its macros into the video facts, the captions and the swap check, like any food.
import { parseMeal, type Part } from './food/parse';

/** The database text of each curated product (PRODUCTS key -> parseMeal query). */
export const PRODUCT_Q: Record<string, string> = { cola: 'cola', espresso: 'espresso', water: 'glass of water' };
/** The current item as database parts: the food's own parts, or the curated product's serving. */
export const partsOf = (productId: string, foodParts: Part[]): Part[] => (productId === 'food' ? foodParts : parseMeal(PRODUCT_Q[productId] ?? productId));
