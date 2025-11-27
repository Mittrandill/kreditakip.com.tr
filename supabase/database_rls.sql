-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Bu dosya, tabloların erişim güvenlik kurallarını (kimin neyi göreceğini) belirler.
-- Not: Politikalar 'auth.uid()' (giriş yapmış kullanıcı ID'si) ve 'is_admin()' fonksiyonuna dayanır.
-- =============================================================================

-- 1. BANKING_CREDENTIALS
ALTER TABLE banking_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own banking credentials" ON banking_credentials FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own banking credentials" ON banking_credentials FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own banking credentials" ON banking_credentials FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own banking credentials" ON banking_credentials FOR DELETE TO public USING (auth.uid() = user_id);

-- 2. BANKS
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banks are viewable by everyone" ON banks FOR SELECT TO public USING (true);

-- 3. BILLING_INFO
ALTER TABLE billing_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view billing info (admins see all)" ON billing_info FOR SELECT TO public USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert their own billing info" ON billing_info FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own billing info" ON billing_info FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own billing info" ON billing_info FOR DELETE TO public USING (auth.uid() = user_id);

-- 4. BLOG_CATEGORIES
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blog categories" ON blog_categories FOR SELECT TO public USING (true);
CREATE POLICY "Only admins can insert blog categories" ON blog_categories FOR INSERT TO public WITH CHECK (is_admin());
CREATE POLICY "Only admins can update blog categories" ON blog_categories FOR UPDATE TO public USING (is_admin());
CREATE POLICY "Only admins can delete blog categories" ON blog_categories FOR DELETE TO public USING (is_admin());

-- 5. BLOG_POSTS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published blog posts are publicly viewable" ON blog_posts FOR SELECT TO public USING (status = 'published' OR auth.uid() = author_id OR is_admin());
CREATE POLICY "Users can insert their own blog posts" ON blog_posts FOR INSERT TO public WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own blog posts" ON blog_posts FOR UPDATE TO public USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own blog posts" ON blog_posts FOR DELETE TO public USING (auth.uid() = author_id);

-- 6. CREDIT_TYPES
ALTER TABLE credit_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credit types are viewable by everyone" ON credit_types FOR SELECT TO public USING (true);

-- 7. CREDITS
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credits (admins see all)" ON credits FOR SELECT TO public USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert their own credits" ON credits FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credits" ON credits FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own credits" ON credits FOR DELETE TO public USING (auth.uid() = user_id);

-- 8. FINANCIAL_PROFILES
ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own financial profile" ON financial_profiles FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own financial profile" ON financial_profiles FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own financial profile" ON financial_profiles FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own financial profile" ON financial_profiles FOR DELETE TO public USING (auth.uid() = user_id);

-- 9. INVOICES
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all invoices" ON invoices FOR SELECT TO public USING (is_admin() OR auth.uid() = user_id); -- Users should see their own too
CREATE POLICY "Only admins can insert invoices" ON invoices FOR INSERT TO public WITH CHECK (is_admin());
CREATE POLICY "Only admins can update invoices" ON invoices FOR UPDATE TO public USING (is_admin());
CREATE POLICY "Only admins can delete invoices" ON invoices FOR DELETE TO public USING (is_admin());
CREATE POLICY "Service role can manage all invoices" ON invoices FOR ALL TO service_role USING (true);

-- 10. NEWSLETTER_SUBSCRIBERS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view subscribers" ON newsletter_subscribers FOR SELECT TO public USING (is_admin());
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update newsletter subscribers" ON newsletter_subscribers FOR UPDATE TO anon USING (true); -- Caution: This allows any anon to update
CREATE POLICY "Service role can manage newsletter subscribers" ON newsletter_subscribers FOR ALL TO service_role USING (true);

-- 11. NOTIFICATION_PREFERENCES
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences" ON notification_preferences FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification preferences" ON notification_preferences FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notification preferences" ON notification_preferences FOR DELETE TO public USING (auth.uid() = user_id);

-- 12. NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications" ON notifications FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE TO public USING (auth.uid() = user_id);

-- 13. PAYMENT_HISTORY
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Logic: User can access history if they own the related credit
CREATE POLICY "Users can view payment history for their credits" ON payment_history FOR SELECT TO public USING (EXISTS (SELECT 1 FROM credits WHERE credits.id = payment_history.credit_id AND credits.user_id = auth.uid()));
CREATE POLICY "Users can insert payment history for their credits" ON payment_history FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM credits WHERE credits.id = payment_history.credit_id AND credits.user_id = auth.uid()));
CREATE POLICY "Users can update payment history for their credits" ON payment_history FOR UPDATE TO public USING (EXISTS (SELECT 1 FROM credits WHERE credits.id = payment_history.credit_id AND credits.user_id = auth.uid()));
CREATE POLICY "Users can delete payment history for their credits" ON payment_history FOR DELETE TO public USING (EXISTS (SELECT 1 FROM credits WHERE credits.id = payment_history.credit_id AND credits.user_id = auth.uid()));

-- 14. PAYMENT_PLANS
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

-- Logic: User can access plan if they own the related credit
CREATE POLICY "Users can view payment plans for their credits" ON payment_plans FOR SELECT TO public USING (EXISTS (SELECT 1 FROM credits WHERE credits.id = payment_plans.credit_id AND credits.user_id = auth.uid()));
CREATE POLICY "Users can insert payment plans for their credits" ON payment_plans FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM credits WHERE credits.id = payment_plans.credit_id AND credits.user_id = auth.uid()));
CREATE POLICY "Users can update payment plans for their credits" ON payment_plans FOR UPDATE TO public USING (EXISTS (SELECT 1 FROM credits WHERE credits.id = payment_plans.credit_id AND credits.user_id = auth.uid()));
CREATE POLICY "Users can delete payment plans for their credits" ON payment_plans FOR DELETE TO public USING (EXISTS (SELECT 1 FROM credits WHERE credits.id = payment_plans.credit_id AND credits.user_id = auth.uid()));

-- 15. PAYMENT_TRANSACTIONS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions (admins see all)" ON payment_transactions FOR SELECT TO public USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert their own payment transactions" ON payment_transactions FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can update transactions" ON payment_transactions FOR UPDATE TO public USING (true); -- Usually restricted to service role or callback
CREATE POLICY "Service role can manage all transactions" ON payment_transactions FOR ALL TO service_role USING (true);

-- 16. PAYTR_RECURRING_PAYMENTS
ALTER TABLE paytr_recurring_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring payments" ON paytr_recurring_payments FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recurring payments" ON paytr_recurring_payments FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring payments" ON paytr_recurring_payments FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring payments" ON paytr_recurring_payments FOR DELETE TO public USING (auth.uid() = user_id);

-- 17. PAYTR_SAVED_CARDS
ALTER TABLE paytr_saved_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved cards" ON paytr_saved_cards FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved cards" ON paytr_saved_cards FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved cards" ON paytr_saved_cards FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved cards" ON paytr_saved_cards FOR DELETE TO public USING (auth.uid() = user_id);

-- 18. PAYTR_USER_TOKENS
ALTER TABLE paytr_user_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tokens" ON paytr_user_tokens FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tokens" ON paytr_user_tokens FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tokens" ON paytr_user_tokens FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tokens" ON paytr_user_tokens FOR DELETE TO public USING (auth.uid() = user_id);

-- 19. PENDING_RENEWAL_PAYMENTS
ALTER TABLE pending_renewal_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending renewals" ON pending_renewal_payments FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Service role has full access" ON pending_renewal_payments FOR ALL TO public USING (true); -- Ideally should be restricted to service_role

-- 20. PENDING_SUBSCRIPTIONS
ALTER TABLE pending_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pending subscriptions" ON pending_subscriptions FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pending subscriptions" ON pending_subscriptions FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pending subscriptions" ON pending_subscriptions FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pending subscriptions" ON pending_subscriptions FOR DELETE TO public USING (auth.uid() = user_id);

-- 21. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO public USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT TO public WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO public USING (auth.uid() = id);
CREATE POLICY "Only admins can delete profiles" ON profiles FOR DELETE TO public USING (is_admin());

-- 22. REQUEST_LOGS
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view request logs (admins see all)" ON request_logs FOR SELECT TO public USING (is_admin() OR auth.uid() = user_id);
CREATE POLICY "Service role can insert request logs" ON request_logs FOR INSERT TO public WITH CHECK (true); -- Assuming server-side logging

-- 23. RISK_ANALYSES
ALTER TABLE risk_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own risk analyses" ON risk_analyses FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own risk analyses" ON risk_analyses FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own risk analyses" ON risk_analyses FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own risk analyses" ON risk_analyses FOR DELETE TO public USING (auth.uid() = user_id);

-- 24. SUBSCRIPTION_PLANS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans FOR SELECT TO public USING (is_active = true OR is_admin());

-- 25. SUBSCRIPTIONS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subscriptions (admins see all)" ON subscriptions FOR SELECT TO public USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Service role can insert subscriptions" ON subscriptions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Service role can update subscriptions" ON subscriptions FOR UPDATE TO public USING (true);
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions FOR ALL TO service_role USING (true);

-- 26. USAGE_TRACKING
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON usage_tracking FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage usage" ON usage_tracking FOR ALL TO public USING (true); -- Should ideally be restricted to service logic

-- 27. WEBHOOK_LOGS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view webhook logs" ON webhook_logs FOR SELECT TO public USING (is_admin());
CREATE POLICY "Service role can insert webhook logs" ON webhook_logs FOR INSERT TO public WITH CHECK (true);