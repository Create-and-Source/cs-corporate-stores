-- Create a public storage bucket for logo/artwork uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork', 'artwork', true);

-- Allow anyone to upload to the artwork bucket
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artwork');

-- Allow anyone to read from the artwork bucket
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'artwork');
