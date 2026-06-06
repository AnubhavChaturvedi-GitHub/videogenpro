import type { Preset } from '../preset';
import { textPresets } from './text';
import { imagePresets } from './image';
import { transitionPresets } from './transition';
import { enterPresets } from './enter';
import { exitPresets } from './exit';
import { audioPresets } from './audio';

const ALL: Preset[] = [
  ...textPresets, ...imagePresets, ...enterPresets, ...exitPresets, ...audioPresets, ...transitionPresets,
];

export const REGISTRY: Map<string, Preset> = new Map(ALL.map((p) => [p.id, p]));

export const getPreset = (id: string): Preset | undefined => REGISTRY.get(id);

export const allPresets = (): Preset[] => [...REGISTRY.values()];

// The AI-facing manifest: a machine-readable menu of every preset.
// This is what an agent searches to pick by intent and tune by range.
export type ManifestEntry = {
  id: string;
  category: string;
  description: string;
  tags: string[];
  params: Record<string, { default: number; min?: number; max?: number; unit?: string; desc?: string }>;
  defaultDuration: number;
  continuous?: boolean;
  split?: string;
};

export const buildManifest = (): ManifestEntry[] =>
  allPresets().map((p) => ({
    id: p.id,
    category: p.category,
    description: p.description,
    tags: p.tags,
    params: p.params,
    defaultDuration: p.defaultDuration,
    ...(p.continuous ? { continuous: true } : {}),
    ...(p.split ? { split: p.split } : {}),
  }));

// Plain-text search over the catalog (no model needed) — name/desc/tag match + score.
export const searchPresets = (query: string, category?: string): ManifestEntry[] => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const score = (e: ManifestEntry): number => {
    const hay = `${e.id} ${e.description} ${e.tags.join(' ')}`.toLowerCase();
    return terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
  };
  return buildManifest()
    .filter((e) => !category || e.category === category)
    .map((e) => ({ e, s: score(e) }))
    .filter((x) => x.s > 0 || terms.length === 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.e);
};
