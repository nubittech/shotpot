export type WheelSegmentType = 'prize' | 'lose' | 'jackpot';

export interface WheelSegmentDef {
  id: string;
  label: string;
  color: string;
  textColor: string;
  type: WheelSegmentType;
  defaultPrize: string | null;
  defaultCoupon: string;
  icon: string; // emoji for studio UI
}

export const BOHO_SEGMENT_DEFS: WheelSegmentDef[] = [
  { id: 'coffee',    label: 'Kahve',    color: '#c17f5a', textColor: '#3a2410', type: 'prize',   defaultPrize: 'İkram filtre kahve',      defaultCoupon: 'COFFEE', icon: '☕' },
  { id: 'lose1',     label: 'Olmadı',   color: '#d4b896', textColor: '#6b4423', type: 'lose',    defaultPrize: null,                       defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'tea',       label: 'Çay',      color: '#7a9e7e', textColor: '#3a2410', type: 'prize',   defaultPrize: 'Demli ev çayı',           defaultCoupon: 'TEA',    icon: '🍵' },
  { id: 'pastry',    label: 'Kruvasan', color: '#d4a0a0', textColor: '#3a2410', type: 'prize',   defaultPrize: 'Taze kruvasan',           defaultCoupon: 'PAST',   icon: '🥐' },
  { id: 'cake',      label: 'Pasta',    color: '#a0704a', textColor: '#f5efe0', type: 'prize',   defaultPrize: 'Günün pastası',           defaultCoupon: 'CAKE',   icon: '🍰' },
  { id: 'lose2',     label: 'Olmadı',   color: '#d4b896', textColor: '#6b4423', type: 'lose',    defaultPrize: null,                       defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'breakfast', label: 'Kahvaltı', color: '#8a9a5b', textColor: '#3a2410', type: 'prize',   defaultPrize: 'İkram kahvaltı tabağı',  defaultCoupon: 'BRKF',   icon: '🍳' },
  { id: 'jackpot',   label: 'Sürpriz',  color: '#c17f5a', textColor: '#f5efe0', type: 'jackpot', defaultPrize: 'Şefin sürpriz menüsü',  defaultCoupon: 'JACK',   icon: '⭐' },
];

export const IRISH_SEGMENT_DEFS: WheelSegmentDef[] = [
  { id: 'beer1',   label: 'Bira',    color: '#1a4d2e', textColor: '#f0e8d0', type: 'prize',   defaultPrize: 'Bedava pint',            defaultCoupon: 'BEER',   icon: '🍺' },
  { id: 'lose1',   label: 'Olmadı', color: '#2d1a0a', textColor: '#8b5e3c', type: 'lose',    defaultPrize: null,                      defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'whiskey', label: 'Viski',  color: '#8b5e1a', textColor: '#f0e8d0', type: 'prize',   defaultPrize: '15 yıl single malt',     defaultCoupon: 'WSKY',   icon: '🥃' },
  { id: 'music',   label: 'Müzik',  color: '#0d1a3d', textColor: '#f0e8d0', type: 'prize',   defaultPrize: 'Canlı seans bileti',     defaultCoupon: 'MUSK',   icon: '🎵' },
  { id: 'luck',    label: 'Şans',   color: '#6b1414', textColor: '#f0e8d0', type: 'prize',   defaultPrize: '%30 indirim',            defaultCoupon: 'LUCK',   icon: '🍀' },
  { id: 'lose2',   label: 'Olmadı', color: '#2d1a0a', textColor: '#8b5e3c', type: 'lose',    defaultPrize: null,                      defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'beer2',   label: 'Bira',   color: '#1a4d2e', textColor: '#f0e8d0', type: 'prize',   defaultPrize: 'Bedava pint',            defaultCoupon: 'BEER',   icon: '🍺' },
  { id: 'jackpot', label: 'Jackpot',color: '#c8922a', textColor: '#0d1a0e', type: 'jackpot', defaultPrize: 'Açık masa — bütün gece', defaultCoupon: 'JACK',   icon: '☘' },
];

export const MEDIT_SEGMENT_DEFS: WheelSegmentDef[] = [
  { id: 'wine',     label: 'Şarap',  color: '#1a6b8a', textColor: '#ffffff', type: 'prize',   defaultPrize: 'Kadeh ev şarabı',        defaultCoupon: 'WINE',   icon: '🍷' },
  { id: 'lose1',    label: 'Olmadı', color: '#dde6ea', textColor: '#0d2b4a', type: 'lose',    defaultPrize: null,                      defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'spritz',   label: 'Spritz', color: '#e8c87a', textColor: '#0d2b4a', type: 'prize',   defaultPrize: 'Aperol Spritz',          defaultCoupon: 'SPRZ',   icon: '🍹' },
  { id: 'meze',     label: 'Meze',   color: '#c85a2a', textColor: '#ffffff', type: 'prize',   defaultPrize: 'İkram meze tabağı',     defaultCoupon: 'MEZE',   icon: '🫒' },
  { id: 'olive',    label: 'Zeytin', color: '#7ac8b4', textColor: '#0d2b4a', type: 'prize',   defaultPrize: 'Marine zeytin',          defaultCoupon: 'OLIV',   icon: '🫙' },
  { id: 'lose2',    label: 'Olmadı', color: '#dde6ea', textColor: '#0d2b4a', type: 'lose',    defaultPrize: null,                      defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'cocktail', label: 'Kokteyl',color: '#4db8d4', textColor: '#ffffff', type: 'prize',   defaultPrize: 'Ev kokteyli',            defaultCoupon: 'CKTL',   icon: '🍸' },
  { id: 'jackpot',  label: 'Jackpot',color: '#0d2b4a', textColor: '#e8c87a', type: 'jackpot', defaultPrize: 'Sahil masası — bütün gece', defaultCoupon: 'JACK', icon: '☀' },
];

export function getWheelSegmentDefs(variant: 'boho' | 'irish' | 'medit'): WheelSegmentDef[] {
  if (variant === 'irish') return IRISH_SEGMENT_DEFS;
  if (variant === 'medit') return MEDIT_SEGMENT_DEFS;
  return BOHO_SEGMENT_DEFS;
}

export function defaultWheelSegmentCfg(variant: 'boho' | 'irish' | 'medit'): Record<string, { reward: string; coupon: string }> {
  const cfg: Record<string, { reward: string; coupon: string }> = {};
  for (const seg of getWheelSegmentDefs(variant)) {
    cfg[seg.id] = { reward: seg.defaultPrize ?? '', coupon: seg.defaultCoupon };
  }
  return cfg;
}
