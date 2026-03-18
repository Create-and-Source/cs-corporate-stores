-- Allow public read access to stores (needed for storefront)
CREATE POLICY "Public can read active stores" ON stores
  FOR SELECT USING (is_active = true);

-- Allow public read access to products (needed for storefront)
CREATE POLICY "Public can read active products" ON products
  FOR SELECT USING (is_active = true);

-- Allow public read access to credit balances (needed for storefront)
CREATE POLICY "Public can read credit balances" ON credit_balances
  FOR SELECT USING (true);

-- Allow public read access to orders (needed for order history)
CREATE POLICY "Public can read orders" ON orders
  FOR SELECT USING (true);

-- Allow public read access to order items
CREATE POLICY "Public can read order items" ON order_items
  FOR SELECT USING (true);

-- Allow public read access to users (needed for admin panel)
CREATE POLICY "Public can read users" ON users
  FOR SELECT USING (true);

-- Allow public read access to credit transactions
CREATE POLICY "Public can read credit transactions" ON credit_transactions
  FOR SELECT USING (true);

-- Allow inserts via API (service role handles auth)
CREATE POLICY "Allow insert products" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update orders" ON orders
  FOR UPDATE USING (true);
