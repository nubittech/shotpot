-- 021_menu_design.sql
-- Visual ("overlay") menu editor. The venue uploads a menu background image and
-- places editable text layers on top of it (name/price rows, headings, etc.).
-- Stored as a single JSONB document on the venue. Coordinates/sizes are stored
-- as percentages of the canvas so the menu scales responsively everywhere.
--
-- Shape:
-- {
--   "bgUrl": "https://.../menu-images/...png",
--   "aspect": 1.414,                     -- height / width of the background
--   "layers": [
--     { "id","content","xPct","yPct","widthPct","fontSizePct",
--       "fontFamily","color","align","letterSpacing","lineHeight",
--       "opacity","weight","visible" }
--   ]
-- }
-- Empty {} = no visual design yet (fall back to the structured category/item menu).

alter table venues
  add column if not exists menu_design jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
