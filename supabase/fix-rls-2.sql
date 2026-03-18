-- Allow inserting users (for add employee)
CREATE POLICY "Allow insert users" ON users
  FOR INSERT WITH CHECK (true);

-- Allow updating users (for deactivate)
CREATE POLICY "Allow update users" ON users
  FOR UPDATE USING (true);

-- Allow inserting credit balances
CREATE POLICY "Allow insert credit balances" ON credit_balances
  FOR INSERT WITH CHECK (true);

-- Allow updating credit balances
CREATE POLICY "Allow update credit balances" ON credit_balances
  FOR UPDATE USING (true);

-- Allow inserting credit transactions
CREATE POLICY "Allow insert credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (true);
