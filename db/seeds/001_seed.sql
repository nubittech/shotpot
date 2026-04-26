INSERT INTO businesses (id, name)
VALUES ('default-business', 'Demo Cafe')
ON CONFLICT (id) DO NOTHING;

INSERT INTO business_configs (
  business_id,
  logo_symbol,
  headline,
  subheadline,
  background,
  surface,
  ink,
  accent,
  accent_soft,
  rewards
)
VALUES (
  'default-business',
  'ES',
  'Gecenin Ritmi',
  'Modern gastronomi deneyimi, jackpot ile tekrar gelme istegi yaratan oyunlu akis.',
  'linear-gradient(180deg, #111111 0%, #17111b 52%, #120f10 100%)',
  '#1c1b1d',
  '#f4e6ab',
  '#ffd84e',
  '#d06cff',
  '[{"icon":"🍸","label":"Electric Gin Fizz"},{"icon":"🍔","label":"Artisan Burger"},{"icon":"🎟","label":"Jackpot Kuponu"}]'::jsonb
)
ON CONFLICT (business_id) DO NOTHING;

INSERT INTO users (id, role)
VALUES ('demo-user-1', 'customer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rewards (id, business_id, name, probability, code_prefix)
VALUES
  ('reward-jackpot', 'default-business', 'Logo Jackpot', 0.1500, 'JACKPOT'),
  ('reward-latte', 'default-business', 'Free Latte', 0.4000, 'LATTE'),
  ('reward-suffle', 'default-business', 'Free Suffle', 0.2500, 'SUFLE'),
  ('reward-lose', 'default-business', 'No Reward', 0.2000, 'LOSE')
ON CONFLICT (id) DO NOTHING;
