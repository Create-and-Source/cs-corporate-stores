-- ============================================
-- Demo Data — ACME Corporation Store
-- ============================================

-- 1. Create the demo store
INSERT INTO stores (id, slug, company_name, primary_color, secondary_color, welcome_message)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'acme-corp',
  'ACME Corporation',
  '#000000',
  '#1a365d',
  'Celebrate your achievements with premium company merch. Use your credits to gear up.'
);

-- 2. Create users (1 admin + 4 employees)
INSERT INTO users (id, email, full_name, role, store_id, department) VALUES
  ('a0000001-0000-4000-a000-000000000001', 'admin@acmecorp.com', 'Rachel Torres', 'company_admin', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'HR'),
  ('a0000001-0000-4000-a000-000000000002', 'sarah.j@acmecorp.com', 'Sarah Johnson', 'employee', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Marketing'),
  ('a0000001-0000-4000-a000-000000000003', 'mike.c@acmecorp.com', 'Mike Chen', 'employee', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Engineering'),
  ('a0000001-0000-4000-a000-000000000004', 'lisa.p@acmecorp.com', 'Lisa Park', 'employee', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Design'),
  ('a0000001-0000-4000-a000-000000000005', 'james.w@acmecorp.com', 'James Wilson', 'employee', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sales');

-- 3. Give everyone credits
INSERT INTO credit_balances (user_id, store_id, balance, lifetime_received, lifetime_spent) VALUES
  ('a0000001-0000-4000-a000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 20000, 20000, 0),
  ('a0000001-0000-4000-a000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 7500, 20000, 12500),
  ('a0000001-0000-4000-a000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 15000, 20000, 5000),
  ('a0000001-0000-4000-a000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3200, 20000, 16800),
  ('a0000001-0000-4000-a000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 10000, 10000, 0);

-- 4. Credit transaction history
INSERT INTO credit_transactions (user_id, store_id, amount, type, description, created_by) VALUES
  ('a0000001-0000-4000-a000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 20000, 'new_hire', 'Welcome bonus', 'a0000001-0000-4000-a000-000000000001'),
  ('a0000001-0000-4000-a000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 20000, 'new_hire', 'Welcome bonus', 'a0000001-0000-4000-a000-000000000001'),
  ('a0000001-0000-4000-a000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 20000, 'new_hire', 'Welcome bonus', 'a0000001-0000-4000-a000-000000000001'),
  ('a0000001-0000-4000-a000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 20000, 'new_hire', 'Welcome bonus', 'a0000001-0000-4000-a000-000000000001'),
  ('a0000001-0000-4000-a000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 10000, 'bonus', 'Q1 performance bonus', 'a0000001-0000-4000-a000-000000000001');

-- 5. Demo products
INSERT INTO products (store_id, name, description, price, cost, category, fulfillment_provider, provider_product_id, provider_variant_id, sizes, colors) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Classic Logo Tee', 'Premium cotton crew neck with embroidered company logo', 2800, 1200, 'Apparel', 'fulfill_engine', 'FE-TEE-001', 'FE-TEE-001-BLK', ARRAY['S','M','L','XL','2XL'], ARRAY['Black','White','Navy','Gray']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Performance Hoodie', 'Heavyweight fleece hoodie with chest embroidery', 5500, 2400, 'Apparel', 'fulfill_engine', 'FE-HOOD-001', 'FE-HOOD-001-BLK', ARRAY['S','M','L','XL','2XL'], ARRAY['Black','Navy','Maroon']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Structured Cap', 'Richardson 112 trucker cap with embroidered logo', 2200, 900, 'Headwear', 'fulfill_engine', 'FE-CAP-001', 'FE-CAP-001-BLK', ARRAY['One Size'], ARRAY['Black','White','Kraft']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Insulated Water Bottle', '20oz stainless steel with laser-engraved logo', 3200, 1400, 'Drinkware', 'fulfill_engine', 'FE-BTL-001', 'FE-BTL-001-BLK', ARRAY['20oz'], ARRAY['Black','White']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Quarter Zip Pullover', 'Lightweight performance quarter zip with embroidery', 6200, 2800, 'Apparel', 'fulfill_engine', 'FE-QZ-001', 'FE-QZ-001-BLK', ARRAY['S','M','L','XL','2XL'], ARRAY['Black','Navy']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Embroidered Beanie', 'Cuffed knit beanie with embroidered logo', 1800, 700, 'Headwear', 'fulfill_engine', 'FE-BNE-001', 'FE-BNE-001-BLK', ARRAY['One Size'], ARRAY['Black','Maroon','Gray']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Canvas Tote Bag', 'Heavy duty canvas tote with screen-printed logo', 2400, 800, 'Accessories', 'printify', 'PF-TOTE-001', 'PF-TOTE-001-NAT', ARRAY['One Size'], ARRAY['Natural','Black']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Premium Notebook Set', 'Hardcover A5 notebook with debossed logo — set of 2', 1600, 600, 'Office', 'printify', 'PF-NOTE-001', 'PF-NOTE-001-BLK', ARRAY['A5'], ARRAY['Black']);
