-- Create credit_cards table
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    card_type VARCHAR(50) DEFAULT 'Classic',
    card_number VARCHAR(255), -- Encrypted card number
    credit_limit DECIMAL(15,2) DEFAULT 0,
    current_debt DECIMAL(15,2) DEFAULT 0,
    available_limit DECIMAL(15,2) GENERATED ALWAYS AS (credit_limit - current_debt) STORED,
    minimum_payment_rate DECIMAL(5,2) DEFAULT 2.5, -- Minimum payment percentage
    due_date INTEGER, -- Day of month (1-31)
    next_due_date DATE,
    annual_fee DECIMAL(10,2) DEFAULT 0,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    description TEXT,
    status VARCHAR(20) DEFAULT 'aktif',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraint for status
    CONSTRAINT credit_cards_status_check CHECK (status IN ('aktif', 'pasif', 'blokeli', 'iptal')),
    
    -- Add constraint for card_type
    CONSTRAINT credit_cards_type_check CHECK (card_type IN ('Classic', 'Gold', 'Platinum', 'World')),
    
    -- Add constraint for due_date
    CONSTRAINT credit_cards_due_date_check CHECK (due_date >= 1 AND due_date <= 31),
    
    -- Add constraint for rates
    CONSTRAINT credit_cards_rates_check CHECK (
        minimum_payment_rate >= 0 AND 
        minimum_payment_rate <= 100 AND
        interest_rate >= 0 AND 
        interest_rate <= 100
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_bank_name ON credit_cards(bank_name);
CREATE INDEX IF NOT EXISTS idx_credit_cards_status ON credit_cards(status);
CREATE INDEX IF NOT EXISTS idx_credit_cards_next_due_date ON credit_cards(next_due_date);
CREATE INDEX IF NOT EXISTS idx_credit_cards_is_active ON credit_cards(is_active);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_credit_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_credit_cards_updated_at
    BEFORE UPDATE ON credit_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_credit_cards_updated_at();

-- Create trigger to automatically calculate next_due_date
CREATE OR REPLACE FUNCTION calculate_next_due_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.due_date IS NOT NULL THEN
        -- Calculate next due date based on due_date
        NEW.next_due_date = (
            CASE 
                WHEN EXTRACT(DAY FROM CURRENT_DATE) <= NEW.due_date THEN
                    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' * 0 + INTERVAL '1 day' * (NEW.due_date - 1)
                ELSE
                    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '1 day' * (NEW.due_date - 1)
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_next_due_date
    BEFORE INSERT OR UPDATE ON credit_cards
    FOR EACH ROW
    EXECUTE FUNCTION calculate_next_due_date();
