-- Allow updating store settings
CREATE POLICY "Allow update stores" ON stores
  FOR UPDATE USING (true);
