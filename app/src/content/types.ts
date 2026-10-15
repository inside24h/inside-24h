export type Level = 'A' | 'B' | 'C' | '?';

export interface Source {
  id: string;
  cite: string; // short human citation
  url: string;
}

export interface Claim {
  id: string; // matches research/<product>.md
  text: string;
  level: Level;
  sources: string[]; // Source ids
  method?: string; // for level C: how we estimated it
  verified: boolean; // false = seen only in a secondary summary; shown with a "source pending" mark
}

/** Organ keys match node names in anatomy.glb (pipeline/organs.json), plus a few groups. */
export type OrganKey =
  | 'tongue' | 'esophagus' | 'stomach' | 'duodenum' | 'jejunum' | 'ileum'
  | 'cecum' | 'colon_asc' | 'colon_trans' | 'colon_desc' | 'rectum'
  | 'liver' | 'gallbladder' | 'pancreas' | 'portal_vein' | 'kidney_l' | 'kidney_r' | 'bladder'
  | 'heart' | 'aorta' | 'vena_cava' | 'brain' | 'lung_l' | 'lung_r' | 'skin';

export interface Stage {
  min: number; // minutes after ingestion when this stage starts
  title: string;
  organs: OrganKey[];
  claims: string[];
}

export interface Product {
  id: string;
  name: string;
  serving: string;
  stages: Stage[];
  claims: Record<string, Claim>;
}

export const LEVEL_LABEL: Record<Level, string> = {
  A: 'Established',
  B: 'Supported, varies',
  C: 'Our estimate',
  '?': 'Not yet studied',
};
