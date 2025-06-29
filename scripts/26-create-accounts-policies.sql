-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_transactions ENABLE ROW LEVEL SECURITY;

-- Accounts policies
CREATE POLICY "Users can view their own accounts" ON accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Credit cards policies
CREATE POLICY "Users can view their own credit cards" ON credit_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit cards" ON credit_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit cards" ON credit_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit cards" ON credit_cards
    FOR DELETE USING (auth.uid() = user_id);

-- Account transactions policies
CREATE POLICY "Users can view their account transactions" ON account_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM accounts 
            WHERE accounts.id = account_transactions.account_id 
            AND accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their account transactions" ON account_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM accounts 
            WHERE accounts.id = account_transactions.account_id 
            AND accounts.user_id = auth.uid()
        )
    );

-- Credit card transactions policies
CREATE POLICY "Users can view their credit card transactions" ON credit_card_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM credit_cards 
            WHERE credit_cards.id = credit_card_transactions.credit_card_id 
            AND credit_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their credit card transactions" ON credit_card_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM credit_cards 
            WHERE credit_cards.id = credit_card_transactions.credit_card_id 
            AND credit_cards.user_id = auth.uid()
        )
    );
