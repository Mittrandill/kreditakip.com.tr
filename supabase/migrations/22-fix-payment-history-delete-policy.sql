-- Payment history silme politikasını ekle
DROP POLICY IF EXISTS "Users can delete their own payment history" ON payment_history;

CREATE POLICY "Users can delete their own payment history" ON payment_history
FOR DELETE USING (
  credit_id IN (
    SELECT id FROM credits WHERE user_id = auth.uid()
  )
);

-- Mevcut politikaları kontrol et ve eksikleri tamamla
DROP POLICY IF EXISTS "Users can view their own payment history" ON payment_history;
DROP POLICY IF EXISTS "Users can insert their own payment history" ON payment_history;
DROP POLICY IF EXISTS "Users can update their own payment history" ON payment_history;

CREATE POLICY "Users can view their own payment history" ON payment_history
FOR SELECT USING (
  credit_id IN (
    SELECT id FROM credits WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own payment history" ON payment_history
FOR INSERT WITH CHECK (
  credit_id IN (
    SELECT id FROM credits WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own payment history" ON payment_history
FOR UPDATE USING (
  credit_id IN (
    SELECT id FROM credits WHERE user_id = auth.uid()
  )
);
