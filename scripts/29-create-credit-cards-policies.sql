-- Enable RLS on credit_cards table
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own credit cards
CREATE POLICY "Users can view own credit cards" ON credit_cards
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own credit cards
CREATE POLICY "Users can insert own credit cards" ON credit_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own credit cards
CREATE POLICY "Users can update own credit cards" ON credit_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own credit cards
CREATE POLICY "Users can delete own credit cards" ON credit_cards
  FOR DELETE USING (auth.uid() = user_id);
