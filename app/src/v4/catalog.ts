// Everything people can search for. Only "ready" items have finished research (every number sourced);
// the rest are listed honestly as in research. Aliases include Croatian names and common spellings.
export interface CatalogItem { id: string; name: string; serving: string; aliases: string[]; status: 'ready' | 'research' }

export const CATALOG: CatalogItem[] = [
  { id: 'espresso', name: 'Espresso', serving: '1 shot · 30 ml', status: 'ready', aliases: ['coffee', 'kava', 'kafa', 'caffe', 'cafe', 'espreso', 'ristretto', 'kofein', 'caffeine'] },
  { id: 'cola', name: 'Cola', serving: '1 can · 330 ml', status: 'ready', aliases: ['coca cola', 'coke', 'pepsi', 'kola', 'soda', 'gazirano', 'sok'] },
  { id: 'banana', name: 'Banana', serving: '1 medium', status: 'research', aliases: ['banane', 'voće', 'voce', 'fruit'] },
  { id: 'energy', name: 'Energy drink', serving: '1 can · 250 ml', status: 'research', aliases: ['red bull', 'monster', 'energetsko piće', 'energetsko pice', 'energy'] },
  { id: 'beer', name: 'Beer', serving: '0.5 l', status: 'research', aliases: ['pivo', 'lager', 'alcohol', 'alkohol'] },
  { id: 'wine', name: 'Wine', serving: '1 glass · 150 ml', status: 'research', aliases: ['vino', 'crno vino', 'bijelo vino', 'alcohol', 'alkohol'] },
  { id: 'water', name: 'Water', serving: '1 glass · 250 ml', status: 'ready', aliases: ['voda', 'mineralna'] },
  { id: 'orange-juice', name: 'Orange juice', serving: '1 glass · 250 ml', status: 'research', aliases: ['sok od naranče', 'sok od narance', 'juice', 'sok'] },
  { id: 'milk', name: 'Milk', serving: '1 glass · 250 ml', status: 'research', aliases: ['mlijeko', 'dairy'] },
  { id: 'green-tea', name: 'Green tea', serving: '1 cup · 250 ml', status: 'research', aliases: ['zeleni čaj', 'zeleni caj', 'čaj', 'caj', 'tea'] },
  { id: 'apple', name: 'Apple', serving: '1 medium', status: 'research', aliases: ['jabuka', 'voće', 'voce', 'fruit'] },
  { id: 'bread', name: 'White bread', serving: '2 slices', status: 'research', aliases: ['kruh', 'bijeli kruh', 'toast'] },
  { id: 'pizza', name: 'Pizza', serving: '1 slice', status: 'research', aliases: ['pica'] },
  { id: 'chocolate', name: 'Milk chocolate', serving: '40 g', status: 'research', aliases: ['čokolada', 'cokolada', 'slatkiš', 'slatkis', 'sweets'] },
  { id: 'protein-shake', name: 'Protein shake', serving: '1 scoop in water', status: 'research', aliases: ['protein', 'whey', 'proteinski šejk', 'sejk'] },
];

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').trim();

/** Ranked search over names and aliases. Ready items first, then by how well the text matches. */
export function searchCatalog(q: string): CatalogItem[] {
  const query = fold(q);
  if (!query) return CATALOG;
  const score = (item: CatalogItem) => {
    const words = [item.name, ...item.aliases].map(fold);
    let best = 0;
    for (const w of words) {
      if (w === query) best = Math.max(best, 4);
      else if (w.startsWith(query)) best = Math.max(best, 3);
      else if (w.split(/\s+/).some((p) => p.startsWith(query))) best = Math.max(best, 2);
      else if (w.includes(query)) best = Math.max(best, 1);
    }
    return best;
  };
  return CATALOG.map((i) => [i, score(i)] as const)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1] || (a[0].status === 'ready' ? -1 : 0) - (b[0].status === 'ready' ? -1 : 0))
    .map(([i]) => i);
}
