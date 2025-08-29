-- E-posta tracking sistemi için notifications tablosuna yeni alanlar ekle
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'in_app' CHECK (notification_type IN ('in_app', 'email', 'sms'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_delivery_status TEXT CHECK (email_delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_provider_id TEXT; -- MailerSend message ID
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_error_message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- E-posta tracking için basit indeksler ekle
CREATE INDEX IF NOT EXISTS idx_notifications_email_status ON notifications(email_delivery_status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_user_payment_email ON notifications(user_id, payment_plan_id, notification_type, email_sent_at);

-- Problematik DATE cast index'i kaldırıldı, duplicate kontrolü uygulama seviyesinde yapılacak
-- E-posta duplicate kontrolü için basit index
CREATE INDEX IF NOT EXISTS idx_notifications_email_tracking ON notifications(user_id, payment_plan_id, notification_type, email_sent_at) 
WHERE notification_type = 'email';
