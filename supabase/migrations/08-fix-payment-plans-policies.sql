-- Fix payment_plans RLS policies
DROP POLICY IF EXISTS "Users can view their own payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can insert their own payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can update their own payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can delete their own payment plans" ON payment_plans;

-- Create comprehensive RLS policies for payment_plans
CREATE POLICY "Users can view their own payment plans" ON payment_plans
    FOR SELECT USING (
        credit_id IN (
            SELECT id FROM credits WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own payment plans" ON payment_plans
    FOR INSERT WITH CHECK (
        credit_id IN (
            SELECT id FROM credits WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own payment plans" ON payment_plans
    FOR UPDATE USING (
        credit_id IN (
            SELECT id FROM credits WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own payment plans" ON payment_plans
    FOR DELETE USING (
        credit_id IN (
            SELECT id FROM credits WHERE user_id = auth.uid()
        )
    );

-- Ensure RLS is enabled
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
