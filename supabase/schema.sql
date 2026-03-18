-- ============================================
-- Create & Source — Corporate Stores Database
-- Run this in your Supabase SQL editor
-- ============================================

-- Stores (one per corporate client)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#C4A882',
  welcome_message TEXT,
  hero_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users (employees + company admins)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'company_admin', 'cs_admin')),
  store_id UUID REFERENCES stores(id),
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Credit balances (one per user per store)
CREATE TABLE credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  store_id UUID REFERENCES stores(id) NOT NULL,
  balance INTEGER DEFAULT 0, -- in cents
  lifetime_received INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  UNIQUE(user_id, store_id)
);

-- Credit transactions (audit trail)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  store_id UUID REFERENCES stores(id) NOT NULL,
  amount INTEGER NOT NULL, -- positive = added, negative = spent
  type TEXT NOT NULL CHECK (type IN ('bonus', 'new_hire', 'holiday', 'purchase', 'refund', 'manual')),
  description TEXT,
  order_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products (curated per store, linked to fulfillment provider)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- retail price in cents (credit cost)
  cost INTEGER NOT NULL, -- wholesale cost in cents (your cost)
  images TEXT[] DEFAULT '{}',
  category TEXT,
  fulfillment_provider TEXT NOT NULL CHECK (fulfillment_provider IN ('fulfill_engine', 'printify')),
  provider_product_id TEXT NOT NULL,
  provider_variant_id TEXT,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  artwork_url TEXT, -- design file URL
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  total INTEGER NOT NULL, -- in cents
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'in_production', 'shipped', 'delivered', 'canceled')),
  tracking_number TEXT,
  tracking_url TEXT,
  shipping_carrier TEXT,
  shipping_address JSONB NOT NULL,
  fulfillment_provider TEXT,
  provider_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  color TEXT,
  price INTEGER NOT NULL,
  image_url TEXT
);

-- ============================================
-- Functions for credit management
-- ============================================

-- Deduct credits when an order is placed
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_store_id UUID,
  p_amount INTEGER,
  p_order_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Update balance
  UPDATE credit_balances
  SET balance = balance - p_amount,
      lifetime_spent = lifetime_spent + p_amount
  WHERE user_id = p_user_id AND store_id = p_store_id;

  -- Record transaction
  INSERT INTO credit_transactions (user_id, store_id, amount, type, description, order_id, created_by)
  VALUES (p_user_id, p_store_id, -p_amount, 'purchase', 'Order placed', p_order_id, p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Refund credits when an order is canceled
CREATE OR REPLACE FUNCTION refund_credits(
  p_user_id UUID,
  p_store_id UUID,
  p_amount INTEGER,
  p_order_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE credit_balances
  SET balance = balance + p_amount,
      lifetime_spent = lifetime_spent - p_amount
  WHERE user_id = p_user_id AND store_id = p_store_id;

  INSERT INTO credit_transactions (user_id, store_id, amount, type, description, order_id, created_by)
  VALUES (p_user_id, p_store_id, p_amount, 'refund', 'Order canceled — credits refunded', p_order_id, p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Assign credits to an employee
CREATE OR REPLACE FUNCTION assign_credits(
  p_user_id UUID,
  p_store_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_admin_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Upsert balance
  INSERT INTO credit_balances (user_id, store_id, balance, lifetime_received)
  VALUES (p_user_id, p_store_id, p_amount, p_amount)
  ON CONFLICT (user_id, store_id)
  DO UPDATE SET
    balance = credit_balances.balance + p_amount,
    lifetime_received = credit_balances.lifetime_received + p_amount;

  -- Record transaction
  INSERT INTO credit_transactions (user_id, store_id, amount, type, description, created_by)
  VALUES (p_user_id, p_store_id, p_amount, p_type, p_description, p_admin_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Employees can only see their own store's data
CREATE POLICY "Users see own store" ON products FOR SELECT USING (
  store_id IN (SELECT store_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users see own orders" ON orders FOR SELECT USING (
  user_id = auth.uid() OR
  store_id IN (SELECT store_id FROM users WHERE id = auth.uid() AND role = 'company_admin')
);

CREATE POLICY "Users see own credits" ON credit_balances FOR SELECT USING (
  user_id = auth.uid() OR
  store_id IN (SELECT store_id FROM users WHERE id = auth.uid() AND role = 'company_admin')
);
