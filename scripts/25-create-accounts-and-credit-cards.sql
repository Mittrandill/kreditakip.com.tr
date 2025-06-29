-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_id UUID NOT NULL REFERENCES banks(id),
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('vadesiz', 'vadeli', 'tasarruf', 'yatirim', 'diger')),
    account_number TEXT, -- Encrypted
    iban TEXT, -- Encrypted
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    overdraft_limit DECIMAL(15,2) DEFAULT 0,
    overdraft_interest_rate DECIMAL(5,2) DEFAULT 0,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    last_balance_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit cards table
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_id UUID NOT NULL REFERENCES banks(id),
    card_name VARCHAR(255) NOT NULL,
    card_type VARCHAR(50) NOT NULL CHECK (card_type IN ('kredi', 'bankakarti', 'prepaid')),
    card_number TEXT, -- Encrypted (last 4 digits visible)
    credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_debt DECIMAL(15,2) NOT NULL DEFAULT 0,
    available_limit DECIMAL(15,2) GENERATED ALWAYS AS (credit_limit - current_debt) STORED,
    minimum_payment_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00, -- Minimum payment percentage
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- Monthly interest rate
    late_payment_fee DECIMAL(10,2) DEFAULT 0,
    annual_fee DECIMAL(10,2) DEFAULT 0,
    statement_day INTEGER CHECK (statement_day >= 1 AND statement_day <= 31),
    due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
    next_statement_date DATE,
    next_due_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account transactions table
CREATE TABLE IF NOT EXISTS account_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'interest', 'fee')),
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_number VARCHAR(100),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit card transactions table
CREATE TABLE IF NOT EXISTS credit_card_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'payment', 'interest', 'fee', 'refund')),
    amount DECIMAL(15,2) NOT NULL,
    debt_after DECIMAL(15,2) NOT NULL,
    description TEXT,
    merchant_name VARCHAR(255),
    reference_number VARCHAR(100),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_bank_id ON accounts(bank_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_bank_id ON credit_cards(bank_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_account_id ON account_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_card_id ON credit_card_transactions(credit_card_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
