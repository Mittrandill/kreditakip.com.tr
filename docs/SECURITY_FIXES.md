# Güvenlik Uyarıları ve Çözümleri

## ✅ 1. Function Search Path Mutable - ÇÖZÜLDÜ

**Durum:** Migration ile otomatik çözüldü
**Migration:** `20251125000003_fix_function_search_path.sql`

Tüm database fonksiyonlarına `SET search_path = ''` eklendi. Bu, SQL injection saldırılarını önler.

**Düzeltilen Fonksiyonlar:**
- ✅ `can_use_feature()`
- ✅ `get_ocr_save_count()`
- ✅ `increment_usage()`
- ✅ `initialize_free_tier()`
- ✅ `handle_new_user()`
- ✅ `create_default_notification_preferences()`
- ✅ `update_updated_at_column()`

---

## ⚠️ 2. Leaked Password Protection - MANUEL DÜZELTİLMELİ

**Durum:** Supabase Dashboard'dan manuel olarak etkinleştirilmeli

### Nasıl Düzeltilir:

1. **Supabase Dashboard'a gidin**
   - https://supabase.com/dashboard

2. **Projenizi seçin**

3. **Authentication > Settings** sayfasına gidin

4. **"Password Requirements"** bölümünü bulun

5. **"Check for leaked passwords"** seçeneğini aktif edin
   - Bu, [HaveIBeenPwned.org](https://haveibeenpwned.com/) veritabanını kullanır
   - Kullanıcıların sızdırılmış şifreleri kullanmasını engeller

6. **Save** butonuna tıklayın

### Ne İşe Yarar?

- ✅ Kullanıcılar, veri ihlallerinde sızdırılmış şifreleri kullanamaz
- ✅ Hesap güvenliği artar
- ✅ Şifre kırma saldırılarına karşı koruma
- ✅ 800+ milyon sızdırılmış şifre kontrol edilir

### Alternatif: CLI ile Etkinleştirme

```bash
# Supabase CLI ile (experimental)
npx supabase projects api-settings --project-ref your-project-ref \
  --password-min-length 6 \
  --password-required-characters abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 \
  --password-check-haveibeenpwned true
```

---

## 📊 Güvenlik Kontrol Listesi

- [x] Function search path koruması
- [ ] Leaked password protection (Manuel)
- [x] RLS policies aktif
- [x] Usage tracking limits
- [x] SECURITY DEFINER fonksiyonları korumalı
- [x] SQL injection önlemleri

---

## 🔒 Ek Güvenlik Önerileri

1. **MFA (Multi-Factor Authentication)**
   - Supabase Auth'ta MFA'yı etkinleştirin
   - `/uygulama/ayarlar` sayfasına MFA ayarları ekleyin

2. **Rate Limiting**
   - ✅ Zaten mevcut (analyze-pdf API'de)
   - Diğer API'lerde de genişletin

3. **CORS Ayarları**
   - Production'da sadece kendi domain'inizden gelen isteklere izin verin
   - Supabase Dashboard > Settings > API

4. **Database Backup**
   - Supabase otomatik backup yapıyor
   - Manuel backup ayarlarını kontrol edin

5. **Monitoring**
   - Supabase Dashboard > Logs sekmesini düzenli kontrol edin
   - Şüpheli aktiviteleri izleyin

---

## 📝 Migration'ları Çalıştırma

```bash
# 1. Search path fix
# Supabase Dashboard > SQL Editor'de çalıştırın:
cat supabase/migrations/20251125000003_fix_function_search_path.sql

# 2. Doğrulama sorgusu
SELECT
  p.proname as function_name,
  CASE
    WHEN 'search_path=' = ANY(p.proconfig::text[]) THEN '✅ Korumalı'
    ELSE '⚠️ Korumasız'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;
```

---

## 🆘 Sorun Giderme

### Migration çalışmazsa:

1. **Syntax hatası kontrolü:**
   ```sql
   BEGIN;
   -- Migration kodunu buraya yapıştırın
   -- HATA OLMADAN ÇALIŞIYORSA:
   COMMIT;
   -- HATA VARSA:
   ROLLBACK;
   ```

2. **Fonksiyon zaten varsa:**
   ```sql
   -- Önce mevcut fonksiyonu silin
   DROP FUNCTION IF EXISTS can_use_feature CASCADE;
   -- Sonra migration'ı çalıştırın
   ```

3. **Permission hatası:**
   - Service role key ile bağlanın
   - Dashboard SQL Editor kullanın (otomatik service role)

---

## 📞 Destek

Sorun yaşarsanız:
1. Supabase linter'ı tekrar çalıştırın
2. Logs'ları kontrol edin
3. GitHub Issues'a bildirin

**Linter Komutu:**
```bash
npx supabase db lint
```
