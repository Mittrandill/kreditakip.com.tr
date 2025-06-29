-- Insert sample banks
INSERT INTO public.banks (name, logo_url, contact_phone, contact_email, website) VALUES
('Ziraat Bankası', '/placeholder.svg?height=48&width=48&text=ZB', '0312 123 45 67', 'info@ziraatbank.com.tr', 'https://ziraatbank.com.tr'),
('İş Bankası', '/placeholder.svg?height=48&width=48&text=İB', '0212 345 67 89', 'info@isbank.com.tr', 'https://isbank.com.tr'),
('Garanti BBVA', '/placeholder.svg?height=48&width=48&text=GB', '0216 456 78 90', 'info@garantibbva.com.tr', 'https://garantibbva.com.tr'),
('Akbank', '/placeholder.svg?height=48&width=48&text=AB', '0212 567 89 01', 'info@akbank.com.tr', 'https://akbank.com.tr'),
('Yapı Kredi', '/placeholder.svg?height=48&width=48&text=YK', '0212 678 90 12', 'info@yapikredi.com.tr', 'https://yapikredi.com.tr'),
('Halkbank', '/placeholder.svg?height=48&width=48&text=HB', '0312 789 01 23', 'info@halkbank.com.tr', 'https://halkbank.com.tr'),
('Vakıfbank', '/placeholder.svg?height=48&width=48&text=VB', '0212 890 12 34', 'info@vakifbank.com.tr', 'https://vakifbank.com.tr'),
('Denizbank', '/placeholder.svg?height=48&width=48&text=DB', '0212 901 23 45', 'info@denizbank.com.tr', 'https://denizbank.com.tr');

-- Insert credit types
INSERT INTO public.credit_types (name, description) VALUES
('Konut Kredisi', 'Ev satın almak için kullanılan uzun vadeli krediler'),
('İhtiyaç Kredisi', 'Kişisel ihtiyaçlar için kullanılan orta vadeli krediler'),
('Taşıt Kredisi', 'Araç satın almak için kullanılan krediler'),
('Kredi Kartı Borcu', 'Kredi kartı kullanımından doğan borçlar'),
('Ticari Kredi', 'İş amaçlı kullanılan krediler'),
('Eğitim Kredisi', 'Eğitim masrafları için kullanılan krediler');
