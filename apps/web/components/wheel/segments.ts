export type WheelSegmentType = 'prize' | 'lose' | 'jackpot';

export interface WheelSegmentDef {
  id: string;
  label: string;        // TR label (default)
  labelEn?: string;     // EN label for the studio editor
  color: string;
  textColor: string;
  type: WheelSegmentType;
  defaultPrize: string | null;     // TR default reward text
  defaultPrizeEn?: string | null;  // EN default reward text
  defaultCoupon: string;
  icon: string; // emoji for studio UI
}

export const BOHO_SEGMENT_DEFS: WheelSegmentDef[] = [
  { id: 'coffee',    label: 'Kahve',    labelEn: 'Coffee',    color: '#c17f5a', textColor: '#3a2410', type: 'prize',   defaultPrize: 'İkram filtre kahve',      defaultPrizeEn: 'Filter coffee on us',     defaultCoupon: 'COFFEE', icon: '☕' },
  { id: 'lose1',     label: 'Olmadı',   labelEn: 'No win',    color: '#d4b896', textColor: '#6b4423', type: 'lose',    defaultPrize: null,                       defaultPrizeEn: null,                       defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'tea',       label: 'Çay',      labelEn: 'Tea',       color: '#7a9e7e', textColor: '#3a2410', type: 'prize',   defaultPrize: 'Demli ev çayı',           defaultPrizeEn: 'House-brewed tea',         defaultCoupon: 'TEA',    icon: '🍵' },
  { id: 'pastry',    label: 'Kruvasan', labelEn: 'Croissant', color: '#d4a0a0', textColor: '#3a2410', type: 'prize',   defaultPrize: 'Taze kruvasan',           defaultPrizeEn: 'Fresh croissant',          defaultCoupon: 'PAST',   icon: '🥐' },
  { id: 'cake',      label: 'Pasta',    labelEn: 'Cake',      color: '#a0704a', textColor: '#f5efe0', type: 'prize',   defaultPrize: 'Günün pastası',           defaultPrizeEn: "Today's cake",             defaultCoupon: 'CAKE',   icon: '🍰' },
  { id: 'lose2',     label: 'Olmadı',   labelEn: 'No win',    color: '#d4b896', textColor: '#6b4423', type: 'lose',    defaultPrize: null,                       defaultPrizeEn: null,                       defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'breakfast', label: 'Kahvaltı', labelEn: 'Breakfast', color: '#8a9a5b', textColor: '#3a2410', type: 'prize',   defaultPrize: 'İkram kahvaltı tabağı',  defaultPrizeEn: 'Breakfast plate on us',    defaultCoupon: 'BRKF',   icon: '🍳' },
  { id: 'jackpot',   label: 'Sürpriz',  labelEn: 'Surprise',  color: '#c17f5a', textColor: '#f5efe0', type: 'jackpot', defaultPrize: 'Şefin sürpriz menüsü',  defaultPrizeEn: "Chef's surprise menu",     defaultCoupon: 'JACK',   icon: '⭐' },
];

export const IRISH_SEGMENT_DEFS: WheelSegmentDef[] = [
  { id: 'beer1',   label: 'Bira',    labelEn: 'Beer',    color: '#1a4d2e', textColor: '#f0e8d0', type: 'prize',   defaultPrize: 'Bedava pint',            defaultPrizeEn: 'Free pint',                defaultCoupon: 'BEER',   icon: '🍺' },
  { id: 'lose1',   label: 'Olmadı',  labelEn: 'No win',  color: '#2d1a0a', textColor: '#8b5e3c', type: 'lose',    defaultPrize: null,                      defaultPrizeEn: null,                       defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'whiskey', label: 'Viski',   labelEn: 'Whiskey', color: '#8b5e1a', textColor: '#f0e8d0', type: 'prize',   defaultPrize: '15 yıl single malt',     defaultPrizeEn: '15-year single malt',      defaultCoupon: 'WSKY',   icon: '🥃' },
  { id: 'music',   label: 'Müzik',   labelEn: 'Music',   color: '#0d1a3d', textColor: '#f0e8d0', type: 'prize',   defaultPrize: 'Canlı seans bileti',     defaultPrizeEn: 'Live session ticket',      defaultCoupon: 'MUSK',   icon: '🎵' },
  { id: 'luck',    label: 'Şans',    labelEn: 'Luck',    color: '#6b1414', textColor: '#f0e8d0', type: 'prize',   defaultPrize: '%30 indirim',            defaultPrizeEn: '30% off',                  defaultCoupon: 'LUCK',   icon: '🍀' },
  { id: 'lose2',   label: 'Olmadı',  labelEn: 'No win',  color: '#2d1a0a', textColor: '#8b5e3c', type: 'lose',    defaultPrize: null,                      defaultPrizeEn: null,                       defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'beer2',   label: 'Bira',    labelEn: 'Beer',    color: '#1a4d2e', textColor: '#f0e8d0', type: 'prize',   defaultPrize: 'Bedava pint',            defaultPrizeEn: 'Free pint',                defaultCoupon: 'BEER',   icon: '🍺' },
  { id: 'jackpot', label: 'Jackpot', labelEn: 'Jackpot', color: '#c8922a', textColor: '#0d1a0e', type: 'jackpot', defaultPrize: 'Açık masa — bütün gece', defaultPrizeEn: 'Open tab — all night',     defaultCoupon: 'JACK',   icon: '☘' },
];

export const MEDIT_SEGMENT_DEFS: WheelSegmentDef[] = [
  { id: 'wine',     label: 'Şarap',   labelEn: 'Wine',     color: '#1a6b8a', textColor: '#ffffff', type: 'prize',   defaultPrize: 'Kadeh ev şarabı',        defaultPrizeEn: 'House wine by the glass',  defaultCoupon: 'WINE',   icon: '🍷' },
  { id: 'lose1',    label: 'Olmadı',  labelEn: 'No win',   color: '#dde6ea', textColor: '#0d2b4a', type: 'lose',    defaultPrize: null,                      defaultPrizeEn: null,                       defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'spritz',   label: 'Spritz',  labelEn: 'Spritz',   color: '#e8c87a', textColor: '#0d2b4a', type: 'prize',   defaultPrize: 'Aperol Spritz',          defaultPrizeEn: 'Aperol Spritz',            defaultCoupon: 'SPRZ',   icon: '🍹' },
  { id: 'meze',     label: 'Meze',    labelEn: 'Meze',     color: '#c85a2a', textColor: '#ffffff', type: 'prize',   defaultPrize: 'İkram meze tabağı',     defaultPrizeEn: 'Meze plate on us',         defaultCoupon: 'MEZE',   icon: '🫒' },
  { id: 'olive',    label: 'Zeytin',  labelEn: 'Olives',   color: '#7ac8b4', textColor: '#0d2b4a', type: 'prize',   defaultPrize: 'Marine zeytin',          defaultPrizeEn: 'Marinated olives',         defaultCoupon: 'OLIV',   icon: '🫙' },
  { id: 'lose2',    label: 'Olmadı',  labelEn: 'No win',   color: '#dde6ea', textColor: '#0d2b4a', type: 'lose',    defaultPrize: null,                      defaultPrizeEn: null,                       defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'cocktail', label: 'Kokteyl', labelEn: 'Cocktail', color: '#4db8d4', textColor: '#ffffff', type: 'prize',   defaultPrize: 'Ev kokteyli',            defaultPrizeEn: 'House cocktail',           defaultCoupon: 'CKTL',   icon: '🍸' },
  { id: 'jackpot',  label: 'Jackpot', labelEn: 'Jackpot',  color: '#0d2b4a', textColor: '#e8c87a', type: 'jackpot', defaultPrize: 'Sahil masası — bütün gece', defaultPrizeEn: 'Beachside table — all night', defaultCoupon: 'JACK', icon: '☀' },
];

export const PARIS_SEGMENT_DEFS: WheelSegmentDef[] = [
  { id: 'espresso',  label: 'Espresso',  labelEn: 'Espresso',  color: '#7a1f2b', textColor: '#e4c172', type: 'prize',   defaultPrize: 'Espresso ikram',           defaultPrizeEn: 'Espresso on us',           defaultCoupon: 'EXPR',   icon: '☕' },
  { id: 'lose1',     label: 'Dommage',   labelEn: 'No win',    color: '#fbf5e6', textColor: '#7a1f2b', type: 'lose',    defaultPrize: null,                        defaultPrizeEn: null,                        defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'macaron',   label: 'Macaron',   labelEn: 'Macaron',   color: '#7a1f2b', textColor: '#e4c172', type: 'prize',   defaultPrize: 'İkili macaron',             defaultPrizeEn: 'Macaron duo',               defaultCoupon: 'MACR',   icon: '🍬' },
  { id: 'tart',      label: 'Tarte',     labelEn: 'Tarte',     color: '#fbf5e6', textColor: '#7a1f2b', type: 'prize',   defaultPrize: 'Tarte au citron',           defaultPrizeEn: 'Lemon tart',                defaultCoupon: 'TART',   icon: '🍋' },
  { id: 'croissant', label: 'Croissant', labelEn: 'Croissant', color: '#7a1f2b', textColor: '#e4c172', type: 'prize',   defaultPrize: 'Tereyağlı kruvasan',        defaultPrizeEn: 'Butter croissant',          defaultCoupon: 'CROI',   icon: '🥐' },
  { id: 'lose2',     label: 'Dommage',   labelEn: 'No win',    color: '#fbf5e6', textColor: '#7a1f2b', type: 'lose',    defaultPrize: null,                        defaultPrizeEn: null,                        defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'wine',      label: 'Vin',       labelEn: 'Wine',      color: '#7a1f2b', textColor: '#e4c172', type: 'prize',   defaultPrize: 'Kadeh kırmızı şarap',       defaultPrizeEn: 'Glass of red wine',         defaultCoupon: 'VIN',    icon: '🍷' },
  { id: 'jackpot',   label: 'Grand Prix',labelEn: 'Grand Prix',color: '#2c1a14', textColor: '#e4c172', type: 'jackpot', defaultPrize: 'İki kişilik bistro menüsü', defaultPrizeEn: 'Bistro menu for two',       defaultCoupon: 'JACK',   icon: '👑' },
];

export const CHALK_SEGMENT_DEFS: WheelSegmentDef[] = [
  { id: 'cake',     label: 'Pasta',     labelEn: 'Cake',      color: '#f4b9c5', textColor: '#5a3a2a', type: 'prize',   defaultPrize: 'Günün dilim pastası',      defaultPrizeEn: "Today's slice of cake",     defaultCoupon: 'CAKE',   icon: '🍰' },
  { id: 'lose1',    label: 'Olmadı',    labelEn: 'No win',    color: '#fff7e9', textColor: '#b07b56', type: 'lose',    defaultPrize: null,                        defaultPrizeEn: null,                        defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'macaron',  label: 'Macaron',   labelEn: 'Macaron',   color: '#c9e5d5', textColor: '#5a3a2a', type: 'prize',   defaultPrize: 'İkili macaron',             defaultPrizeEn: 'Macaron duo',               defaultCoupon: 'MACR',   icon: '🍬' },
  { id: 'cookie',   label: 'Kurabiye',  labelEn: 'Cookie',    color: '#f7d68a', textColor: '#5a3a2a', type: 'prize',   defaultPrize: 'Tereyağlı kurabiye',        defaultPrizeEn: 'Butter cookie',             defaultCoupon: 'COOK',   icon: '🍪' },
  { id: 'tart',     label: 'Tart',      labelEn: 'Tart',      color: '#f4b9c5', textColor: '#5a3a2a', type: 'prize',   defaultPrize: 'Meyveli tart',              defaultPrizeEn: 'Fruit tart',                defaultCoupon: 'TART',   icon: '🍓' },
  { id: 'lose2',    label: 'Olmadı',    labelEn: 'No win',    color: '#fff7e9', textColor: '#b07b56', type: 'lose',    defaultPrize: null,                        defaultPrizeEn: null,                        defaultCoupon: 'LOSE',   icon: '✕' },
  { id: 'choc',     label: 'Çikolata',  labelEn: 'Chocolate', color: '#b07b56', textColor: '#fff7e9', type: 'prize',   defaultPrize: 'El yapımı çikolata',        defaultPrizeEn: 'Handmade chocolate',        defaultCoupon: 'CHOC',   icon: '🍫' },
  { id: 'jackpot',  label: 'Sürpriz',   labelEn: 'Surprise',  color: '#b03a5b', textColor: '#f0c878', type: 'jackpot', defaultPrize: 'Pastacının özel kutusu',    defaultPrizeEn: "Pastry chef's special box", defaultCoupon: 'JACK',   icon: '🎁' },
];

export type WheelVariantKey = 'boho' | 'irish' | 'medit' | 'paris' | 'chalk';

export function getWheelSegmentDefs(variant: WheelVariantKey): WheelSegmentDef[] {
  if (variant === 'irish') return IRISH_SEGMENT_DEFS;
  if (variant === 'medit') return MEDIT_SEGMENT_DEFS;
  if (variant === 'paris') return PARIS_SEGMENT_DEFS;
  if (variant === 'chalk') return CHALK_SEGMENT_DEFS;
  return BOHO_SEGMENT_DEFS;
}

/** Return the segment label for the given locale (falls back to TR). */
export function segLabel(seg: WheelSegmentDef, locale: "tr" | "en"): string {
  return locale === "en" ? (seg.labelEn ?? seg.label) : seg.label;
}

/** Return the default reward text for the given locale (falls back to TR). */
export function segDefaultPrize(seg: WheelSegmentDef, locale: "tr" | "en"): string | null {
  return locale === "en" ? (seg.defaultPrizeEn ?? seg.defaultPrize) : seg.defaultPrize;
}

export function defaultWheelSegmentCfg(
  variant: WheelVariantKey,
  locale: "tr" | "en" = "tr",
): Record<string, { reward: string; coupon: string; share: number }> {
  const cfg: Record<string, { reward: string; coupon: string; share: number }> = {};
  for (const seg of getWheelSegmentDefs(variant)) {
    cfg[seg.id] = { reward: segDefaultPrize(seg, locale) ?? '', coupon: seg.defaultCoupon, share: 20 };
  }
  return cfg;
}
