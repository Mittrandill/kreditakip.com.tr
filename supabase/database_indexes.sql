-- =============================================================================
-- INDEXES & CONSTRAINTS (PERFORMANS VE KISITLAMALAR)
-- Bu dosya, sorgu performansını artırmak için kullanılan indeksleri içerir.
-- =============================================================================

-- BANKING CREDENTIALS
CREATE INDEX IF NOT EXISTS idx_banking_credentials_user_id ON banking_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_banking_credentials_bank_id ON banking_credentials(bank_id);
CREATE INDEX IF NOT EXISTS idx_banking_credentials_active ON banking_credentials(is_active);
CREATE INDEX IF NOT EXISTS idx_banking_credentials_user_active ON banking_credentials(user_id, is_active);

-- BANKS
CREATE INDEX IF NOT EXISTS idx_banks_category ON banks(category);
CREATE INDEX IF NOT EXISTS idx_banks_is_active ON banks(is_active);

-- BILLING INFO
CREATE INDEX IF NOT EXISTS idx_billing_info_user_id ON billing_info(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_info_identity_number ON billing_info(identity_number);

-- BLOG POSTS
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status) WHERE status = 'published';

-- CREDIT TYPES
CREATE INDEX IF NOT EXISTS idx_credit_types_category ON credit_types(category);
CREATE INDEX IF NOT EXISTS idx_credit_types_is_active ON credit_types(is_active);
CREATE INDEX IF NOT EXISTS idx_credit_types_display_order ON credit_types(display_order);

-- CREDITS
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_bank_id ON credits(bank_id);
CREATE INDEX IF NOT EXISTS idx_credits_credit_type_id ON credits(credit_type_id);
CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);
CREATE INDEX IF NOT EXISTS idx_credits_user_id_status ON credits(user_id, status);
CREATE INDEX IF NOT EXISTS idx_credits_user_id_created_at ON credits(user_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_credit_code_per_user ON credits(user_id, credit_code);

-- FINANCIAL PROFILES
CREATE INDEX IF NOT EXISTS idx_financial_profiles_user ON financial_profiles(user_id);

-- INVOICES
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_date ON invoices(user_id, invoice_date);

-- NEWSLETTER SUBSCRIBERS
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);

-- NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_credit_id ON notifications(credit_id);
CREATE INDEX IF NOT EXISTS idx_notifications_payment_plan_id ON notifications(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_user_active ON notifications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_email_status ON notifications(email_delivery_status);

-- PAYMENT HISTORY
CREATE INDEX IF NOT EXISTS idx_payment_history_credit_id ON payment_history(credit_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_plan ON payment_history(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON payment_history(payment_date);

-- PAYMENT PLANS
CREATE INDEX IF NOT EXISTS idx_payment_plans_credit_id ON payment_plans(credit_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_due_date ON payment_plans(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_plans_overdue ON payment_plans(due_date) WHERE status = 'pending' AND due_date < CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_payment_plans_credit_id_status ON payment_plans(credit_id, status);

-- PAYMENT TRANSACTIONS
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_plan_id ON payment_transactions(plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paytr_order_id ON payment_transactions(paytr_order_id);

-- PAYTR RECURRING PAYMENTS
CREATE INDEX IF NOT EXISTS idx_paytr_recurring_payments_user_id ON paytr_recurring_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_paytr_recurring_payments_subscription_id ON paytr_recurring_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_paytr_recurring_payments_merchant_oid ON paytr_recurring_payments(merchant_oid);
CREATE INDEX IF NOT EXISTS idx_paytr_recurring_payments_status ON paytr_recurring_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_paytr_recurring_is_3d ON paytr_recurring_payments(is_3d_secure);

-- PAYTR SAVED CARDS
CREATE INDEX IF NOT EXISTS idx_paytr_saved_cards_user_id ON paytr_saved_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_paytr_saved_cards_utoken ON paytr_saved_cards(utoken);
CREATE INDEX IF NOT EXISTS idx_paytr_saved_cards_ctoken ON paytr_saved_cards(ctoken);
CREATE INDEX IF NOT EXISTS idx_paytr_saved_cards_is_active ON paytr_saved_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_paytr_saved_cards_is_default ON paytr_saved_cards(is_default);

-- PAYTR USER TOKENS
CREATE INDEX IF NOT EXISTS idx_paytr_user_tokens_user_id ON paytr_user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_paytr_user_tokens_utoken ON paytr_user_tokens(utoken);

-- PENDING RENEWAL PAYMENTS
CREATE INDEX IF NOT EXISTS idx_pending_renewal_user_id ON pending_renewal_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_renewal_subscription_id ON pending_renewal_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_pending_renewal_merchant_oid ON pending_renewal_payments(merchant_oid);
CREATE INDEX IF NOT EXISTS idx_pending_renewal_status ON pending_renewal_payments(status);
CREATE INDEX IF NOT EXISTS idx_pending_renewal_expires_at ON pending_renewal_payments(expires_at);

-- PENDING SUBSCRIPTIONS
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_user_id ON pending_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_token ON pending_subscriptions(token);
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_status ON pending_subscriptions(status);

-- PROFILES
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON profiles(theme);

-- RISK ANALYSES
CREATE INDEX IF NOT EXISTS risk_analyses_user_id_idx ON risk_analyses(user_id);
CREATE INDEX IF NOT EXISTS risk_analyses_created_at_idx ON risk_analyses(created_at);

-- SUBSCRIPTION PLANS
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON subscription_plans(sort_order);

-- SUBSCRIPTIONS
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_reference ON subscriptions(payment_subscription_reference);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paytr_order_id ON subscriptions(paytr_order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_expires ON subscriptions(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_unique_active_subscription ON subscriptions(user_id) WHERE status = 'active';

-- USAGE TRACKING
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_tracking_user_feature ON usage_tracking(user_id, feature_type);

-- WEBHOOK LOGS
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_subscription_ref ON webhook_logs(subscription_reference);