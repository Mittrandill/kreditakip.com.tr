"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LegalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "terms" | "kvkk"
}

export function LegalModal({ open, onOpenChange, type }: LegalModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-[#1a1a1a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-400">
            {type === "terms" ? "Kullanım Şartları" : "KVKK Aydınlatma Metni"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">{type === "terms" ? <TermsContent /> : <KVKKContent />}</ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function TermsContent() {
  return (
    <div className="space-y-6 text-white/90">
      <div>
        <p className="leading-relaxed">
          Bu Şartlar, Kredi Takip uygulamasının kullanımına ilişkin kuralları düzenler.
          <strong> Uygulamaya erişen tüm kullanıcılar bu şartları kabul etmiş sayılır.</strong>
        </p>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">1. Hizmet Tanımı</h3>
        <div className="text-white/80 leading-relaxed space-y-2">
          <p>
            Kredi Takip, kullanıcıların yüklediği kredi dökümanlarını işleyerek dijital planlara dönüştürür ve
            kullanıcıya takibi kolaylaştırır.
          </p>
          <p>Ayrıca, kullanıcının tercihiyle, internet bankacılığı şifreleri şifrelenmiş şekilde saklanabilir.</p>
          <p>
            <strong>Sunulan Hizmetler:</strong>
          </p>
          <p>• OCR teknolojisi ile döküm analizi</p>
          <p>• Akıllı ödeme planı oluşturma</p>
          <p>• Finansal analiz ve raporlama</p>
          <p>• Güvenli veri saklama</p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">2. Sorumluluk Reddi</h3>
        <div className="text-white/80 leading-relaxed space-y-2">
          <p>
            <strong>
              Uygulama, kullanıcıların yüklediği içeriklerin doğruluğundan veya güncelliğinden sorumlu değildir.
            </strong>
          </p>
          <p>
            <strong>
              Uygulama, herhangi bir banka, finans kurumu veya kamu kuruluşu ile doğrudan bağlantılı değildir.
            </strong>
          </p>
          <p>
            <strong>
              Otomasyon çıktıları yalnızca kullanıcı bilgilendirme amaçlıdır; resmi belge niteliği taşımaz.
            </strong>
          </p>
          <p className="text-yellow-200">
            ⚠️ Önemli: Finansal kararlarınızı alırken mutlaka uzman görüşü alın ve resmi belgelerinizi kontrol edin.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">3. Kullanıcının Yükümlülükleri</h3>
        <div className="text-white/80 leading-relaxed space-y-2">
          <p>
            <strong>Veri Sorumluluğu:</strong>
          </p>
          <p>• Sisteme yüklenen içerikler (PDF vb.) kullanıcının sorumluluğundadır</p>
          <p>
            <strong>• Üçüncü kişilere ait verilerin izinsiz yüklenmesi hukuken yasaktır</strong>
          </p>
          <p>• Yükleyen kişi tüm hukuki sonuçları üstlenir</p>

          <p>
            <strong>Hesap Güvenliği:</strong>
          </p>
          <p>• Kullanıcı hesabının güvenliği kullanıcıya aittir</p>
          <p>• Güçlü şifre kullanımı zorunludur</p>
          <p>
            <strong>• Yetkisiz erişim riski oluşması durumunda derhal bildirim yapılmalıdır</strong>
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">4. Hesabın Kapatılması</h3>
        <div className="text-white/80 leading-relaxed space-y-2">
          <p>
            <strong>Kullanıcı Tarafından:</strong> Kullanıcı dilerse hesabını istediği zaman silebilir.
          </p>
          <p>
            <strong>Platform Tarafından:</strong> Kullanım koşullarına aykırı hareket eden kullanıcıların hesabı uyarı
            yapılmaksızın askıya alınabilir veya kapatılabilir.
          </p>

          <p>
            <strong>Hesap Kapatma Sebepleri:</strong>
          </p>
          <p>• Sahte bilgi kullanımı</p>
          <p>• Üçüncü kişi verilerinin izinsiz yüklenmesi</p>
          <p>• Sistem güvenliğini tehdit edici faaliyetler</p>
          <p>• Yasal olmayan kullanım</p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">5. Uyuşmazlık</h3>
        <div className="text-white/80 leading-relaxed space-y-2">
          <p>
            Taraflar arasında çıkabilecek uyuşmazlıklarda <strong>İstanbul Merkez Mahkemeleri ve İcra Daireleri</strong>{" "}
            yetkilidir.
          </p>
          <p>• Türk Hukuku uygulanır</p>
          <p>• Öncelikle dostane çözüm aranır</p>
          <p>• Arabuluculuk tercih edilir</p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h4 className="text-lg font-bold text-white mb-3">Sorularınız için İletişim</h4>
        <div className="text-white/80 space-y-2">
          <p>Kullanım şartları hakkında sorularınız varsa bizimle iletişime geçebilirsiniz:</p>
          <p>
            <strong>E-posta:</strong>{" "}
            <a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline">
              info@kreditakip.com.tr
            </a>
          </p>
          <p>
            <strong>Telefon:</strong>{" "}
            <a href="tel:+905432035309" className="text-emerald-400 hover:underline">
              0 543 203 53 09
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

function KVKKContent() {
  return (
    <div className="space-y-6 text-white/90">
      <div>
        <h3 className="text-xl font-bold text-white mb-3">Veri Sorumlusu</h3>
        <div className="text-white/80 space-y-2">
          <p>
            <strong>Kredi Takip</strong>
          </p>
          <p>
            <strong>E-posta:</strong>{" "}
            <a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline">
              info@kreditakip.com.tr
            </a>
          </p>
          <p>
            <strong>Telefon:</strong>{" "}
            <a href="tel:+905432035309" className="text-emerald-400 hover:underline">
              0 543 203 53 09
            </a>
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">1. Hangi Verileri İşliyoruz?</h3>
        <div className="text-white/80 leading-relaxed space-y-2">
          <p>
            <strong>Kimlik Verileri:</strong> Ad, soyad, e-posta adresi, telefon numarası
          </p>
          <p>
            <strong>Finansal Veriler:</strong> Kredi dökümanları (PDF), şifrelenmiş bankacılık verileri, kullanıcı giriş
            geçmişi
          </p>
          <p>
            <strong>Teknik Veriler:</strong> IP Adresi, cihaz bilgisi, lokasyon, log kayıtları
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">2. İşleme Amaçlarımız</h3>
        <div className="text-white/80 leading-relaxed space-y-2">
          <p>1. Hizmetin sunulması ve destek verilmesi</p>
          <p>2. Kullanıcının kredi takibini yapabilmesi</p>
          <p>3. Hukuki yükümlülüklerin yerine getirilmesi</p>
          <p>4. Uygulamanın güvenliğini sağlama</p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">3. Hukuki Sebep</h3>
        <div className="text-white/80 leading-relaxed space-y-2">
          <p>Kişisel verileriniz aşağıdaki hukuki sebeplere dayanarak işlenmektedir:</p>
          <p>• KVKK m.5/2(c): Sözleşmenin kurulması ve ifası</p>
          <p>• KVKK m.5/2(e): Bir hakkın tesisi, kullanılması veya korunması</p>
          <p>• KVKK m.5/2(f): Meşru menfaat</p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">4. Verilerin Aktarımı</h3>
        <div className="text-white/80 leading-relaxed space-y-2">
          <p>
            <strong>Yurt dışına veri aktarımı yapılmaz.</strong> Teknik hizmet alınan altyapılar Türkiye merkezlidir
            veya KVKK uygunluğu belgelenmiş sağlayıcılardır.
          </p>
          <p>• Türkiye Sunucuları: Vercel, Supabase</p>
          <p>• KVKK Uyumlu: Sertifikalı sağlayıcılar</p>
          <p>• Güvenli Aktarım: SSL/TLS şifreleme</p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">5. Haklarınız</h3>
        <div className="text-white/80 leading-relaxed space-y-2">
          <p>
            <strong>KVKK m.11 uyarınca</strong> aşağıdaki haklara sahipsiniz:
          </p>
          <p>• Bilgi talep etme</p>
          <p>• Düzeltme</p>
          <p>• Silme</p>
          <p>• İşlemeye itiraz etme</p>
          <p>• İşlemeyi kısıtlama</p>
          <p>• Kurula şikayette bulunma</p>

          <p>
            <strong>Haklarınızı Nasıl Kullanabilirsiniz?</strong>
          </p>
          <p>1. Kimlik bilgilerinizi belirtin</p>
          <p>2. Talebinizi açık şekilde yazın</p>
          <p>3. 30 gün içinde yanıt alın</p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h4 className="text-lg font-bold text-white mb-3">KVKK Başvuru ve İletişim</h4>
        <div className="text-white/80 space-y-2">
          <p>Kişisel verilerinizle ilgili sorularınız ve talepleriniz için:</p>
          <p>
            <strong>E-posta:</strong>{" "}
            <a href="mailto:info@kreditakip.com.tr" className="text-emerald-400 hover:underline">
              info@kreditakip.com.tr
            </a>
          </p>
          <p>
            <strong>Telefon:</strong>{" "}
            <a href="tel:+905432035309" className="text-emerald-400 hover:underline">
              0 543 203 53 09
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
