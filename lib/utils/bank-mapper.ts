// Banka adı eşleştirme fonksiyonu
export function mapBankName(detectedName: string): string {
  if (!detectedName) return detectedName

  const normalizedName = detectedName.toLowerCase().trim()

  // Banka eşleştirme haritası - daha kapsamlı
  const bankMappings: Record<string, string> = {
    // Devlet Bankaları
    ziraat: "Ziraat Bankası",
    "ziraat bankası": "Ziraat Bankası",
    "ziraat bank": "Ziraat Bankası",
    "tc ziraat bankası": "Ziraat Bankası",
    "türkiye cumhuriyeti ziraat bankası": "Ziraat Bankası",

    halk: "Türkiye Halk Bankası",
    halkbank: "Türkiye Halk Bankası",
    "halk bankası": "Türkiye Halk Bankası",
    "türkiye halk bankası": "Türkiye Halk Bankası",
    "t. halk bankası": "Türkiye Halk Bankası",

    vakıf: "Vakıfbank",
    vakif: "Vakıfbank",
    vakıfbank: "Vakıfbank",
    "vakıf bankası": "Vakıfbank",
    "vakif bankasi": "Vakıfbank",
    "türkiye vakıflar bankası": "Vakıfbank",
    "turkiye vakiflar bankasi": "Vakıfbank",
    "vakıflar bankası": "Vakıfbank",
    "vakiflar bankasi": "Vakıfbank",
    "t. vakıflar bankası": "Vakıfbank",
    "türkiye vakıflar bankası t.a.o.": "Vakıfbank",
    "turkiye vakiflar bankasi t.a.o.": "Vakıfbank",

    // Özel Sektör Bankaları
    akbank: "Akbank",
    "ak bank": "Akbank",
    "akbank t.a.ş.": "Akbank",
    "akbank t.a.s.": "Akbank",

    "iş bankası": "Türkiye İş Bankası",
    "is bankasi": "Türkiye İş Bankası",
    işbank: "Türkiye İş Bankası",
    isbank: "Türkiye İş Bankası",
    "türkiye iş bankası": "Türkiye İş Bankası",
    "turkiye is bankasi": "Türkiye İş Bankası",
    "t. iş bankası": "Türkiye İş Bankası",
    "türkiye iş bankası a.ş.": "Türkiye İş Bankası",

    "yapı kredi": "Yapı ve Kredi Bankası",
    "yapi kredi": "Yapı ve Kredi Bankası",
    yapıkredi: "Yapı ve Kredi Bankası",
    yapikredi: "Yapı ve Kredi Bankası",
    "yapı ve kredi bankası": "Yapı ve Kredi Bankası",
    "yapi ve kredi bankasi": "Yapı ve Kredi Bankası",
    "yapı kredi bankası": "Yapı ve Kredi Bankası",
    "yapi kredi bankasi": "Yapı ve Kredi Bankası",

    teb: "Türk Ekonomi Bankası",
    "türk ekonomi bankası": "Türk Ekonomi Bankası",
    "turk ekonomi bankasi": "Türk Ekonomi Bankası",
    "t.e.b.": "Türk Ekonomi Bankası",

    şekerbank: "Şekerbank",
    sekerbank: "Şekerbank",
    "şeker bank": "Şekerbank",
    "seker bank": "Şekerbank",

    anadolubank: "Anadolubank",
    "anadolu bank": "Anadolubank",

    fibabanka: "Fibabanka",
    "fiba bank": "Fibabanka",
    "fiba banka": "Fibabanka",

    "turkish bank": "Turkish Bank",
    turkishbank: "Turkish Bank",

    adabank: "Adabank",
    "ada bank": "Adabank",

    // Yabancı Bankalar
    garanti: "Türkiye Garanti Bankası",
    "garanti bbva": "Türkiye Garanti Bankası",
    garantibbva: "Türkiye Garanti Bankası",
    "türkiye garanti bankası": "Türkiye Garanti Bankası",
    "turkiye garanti bankasi": "Türkiye Garanti Bankası",
    "garanti bankası": "Türkiye Garanti Bankası",
    "garanti bankasi": "Türkiye Garanti Bankası",

    denizbank: "Denizbank",
    "deniz bank": "Denizbank",

    "qnb finansbank": "QNB Finansbank",
    "qnb finans": "QNB Finansbank",
    finansbank: "QNB Finansbank",
    "finans bank": "QNB Finansbank",

    ing: "ING Bank",
    "ing bank": "ING Bank",
    "ing bankası": "ING Bank",
    "ing bankasi": "ING Bank",

    hsbc: "HSBC Bank",
    "hsbc bank": "HSBC Bank",
    "hsbc bankası": "HSBC Bank",
    "hsbc bankasi": "HSBC Bank",

    "deutsche bank": "Deutsche Bank",
    deutsche: "Deutsche Bank",

    citibank: "Citibank",
    "citi bank": "Citibank",
    citi: "Citibank",

    "alternatif bank": "Alternatif Bank",
    alternatifbank: "Alternatif Bank",

    "burgan bank": "Burgan Bank",
    burganbank: "Burgan Bank",

    icbc: "ICBC Turkey Bank",
    "icbc turkey": "ICBC Turkey Bank",
    "icbc turkey bank": "ICBC Turkey Bank",

    "bank of china": "Bank of China Turkey",
    "bank of china turkey": "Bank of China Turkey",

    "arap türk bankası": "Arap Türk Bankası",
    "arap turk bankasi": "Arap Türk Bankası",

    "turkland bank": "Turkland Bank",
    turklandbank: "Turkland Bank",

    "odea bank": "Odea Bank",
    odeabank: "Odea Bank",

    rabobank: "Rabobank",
    "rabo bank": "Rabobank",

    mufg: "MUFG Bank Turkey",
    "mufg bank": "MUFG Bank Turkey",
    "mufg bank turkey": "MUFG Bank Turkey",

    // Katılım Bankaları
    "ziraat katılım": "Ziraat Katılım Bankası",
    "ziraat katilim": "Ziraat Katılım Bankası",
    "ziraat katılım bankası": "Ziraat Katılım Bankası",

    "vakıf katılım": "Vakıf Katılım Bankası",
    "vakif katilim": "Vakıf Katılım Bankası",
    "vakıf katılım bankası": "Vakıf Katılım Bankası",

    "emlak katılım": "Türkiye Emlak Katılım Bankası",
    "emlak katilim": "Türkiye Emlak Katılım Bankası",
    "türkiye emlak katılım": "Türkiye Emlak Katılım Bankası",

    "türkiye finans": "Türkiye Finans Katılım Bankası",
    "turkiye finans": "Türkiye Finans Katılım Bankası",
    "finans katılım": "Türkiye Finans Katılım Bankası",

    albaraka: "Albaraka Türk Katılım Bankası",
    "albaraka türk": "Albaraka Türk Katılım Bankası",
    "albaraka turk": "Albaraka Türk Katılım Bankası",

    "kuveyt türk": "Kuveyt Türk Katılım Bankası",
    "kuveyt turk": "Kuveyt Türk Katılım Bankası",
    kuveytturk: "Kuveyt Türk Katılım Bankası",

    // Kalkınma ve Yatırım Bankaları
    "iller bankası": "İller Bankası",
    "iller bank": "İller Bankası",
    ilbank: "İller Bankası",

    eximbank: "Türk Eximbank",
    "türk eximbank": "Türk Eximbank",
    "turk eximbank": "Türk Eximbank",

    "kalkınma bankası": "Türkiye Kalkınma ve Yatırım Bankası",
    "kalkinma bankasi": "Türkiye Kalkınma ve Yatırım Bankası",
    tkyb: "Türkiye Kalkınma ve Yatırım Bankası",

    tskb: "Türkiye Sınai Kalkınma Bankası",
    "sınai kalkınma": "Türkiye Sınai Kalkınma Bankası",
    "sinai kalkinma": "Türkiye Sınai Kalkınma Bankası",

    "aktif yatırım": "Aktif Yatırım Bankası",
    "aktif yatirim": "Aktif Yatırım Bankası",

    jpmorgan: "JPMorgan Chase Bank",
    "jp morgan": "JPMorgan Chase Bank",
    "jpmorgan chase": "JPMorgan Chase Bank",

    "société générale": "Société Générale",
    "societe generale": "Société Générale",
  }

  // Önce tam eşleşme ara
  if (bankMappings[normalizedName]) {
    return bankMappings[normalizedName]
  }

  // Kısmi eşleşme ara
  for (const [key, value] of Object.entries(bankMappings)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value
    }
  }

  // Eşleşme bulunamazsa orijinal adı döndür
  return detectedName
}

// Veritabanındaki bankalarla en iyi eşleşmeyi bul
export function findBestBankMatch(detectedBankName: string, availableBanks: any[]): any | null {
  if (!detectedBankName || !availableBanks || availableBanks.length === 0) {
    return null
  }

  const normalizedDetected = detectedBankName.toLowerCase().trim()

  console.log("=== BANKA EŞLEŞTIRME DEBUG ===")
  console.log("Aranan banka:", detectedBankName)
  console.log("Normalize edilmiş:", normalizedDetected)
  console.log(
    "Mevcut bankalar:",
    availableBanks.map((b) => b.name),
  )

  // 1. Önce tam eşleşme ara
  let match = availableBanks.find((bank) => bank.name.toLowerCase() === normalizedDetected)

  if (match) {
    console.log("Tam eşleşme bulundu:", match.name)
    return match
  }

  // 2. Eşlenmiş banka adını kullanarak ara
  const mappedName = mapBankName(detectedBankName)
  console.log("Eşlenmiş banka adı:", mappedName)

  match = availableBanks.find((bank) => bank.name.toLowerCase() === mappedName.toLowerCase())

  if (match) {
    console.log("Eşlenmiş ad ile bulundu:", match.name)
    return match
  }

  // 3. Kısmi eşleşme ara - daha akıllı
  const bankKeywords = [
    { keywords: ["vakif", "vakıf"], target: "vakıf" },
    { keywords: ["ziraat"], target: "ziraat" },
    { keywords: ["garanti"], target: "garanti" },
    { keywords: ["akbank", "ak bank"], target: "akbank" },
    { keywords: ["halk", "halkbank"], target: "halk" },
    { keywords: ["is bank", "iş bank", "işbank", "isbank"], target: "iş" },
    { keywords: ["yapi", "yapı", "kredi"], target: "yapı" },
    { keywords: ["teb", "ekonomi"], target: "ekonomi" },
    { keywords: ["deniz"], target: "deniz" },
    { keywords: ["finansbank", "qnb"], target: "finansbank" },
    { keywords: ["ing"], target: "ing" },
    { keywords: ["hsbc"], target: "hsbc" },
    { keywords: ["sekerbank", "şekerbank", "seker", "şeker"], target: "şeker" },
  ]

  for (const { keywords, target } of bankKeywords) {
    const hasKeyword = keywords.some((keyword) => normalizedDetected.includes(keyword.toLowerCase()))

    if (hasKeyword) {
      match = availableBanks.find((bank) => bank.name.toLowerCase().includes(target))

      if (match) {
        console.log(`Anahtar kelime "${target}" ile bulundu:`, match.name)
        return match
      }
    }
  }

  // 4. Genel kısmi eşleşme
  match = availableBanks.find((bank) => {
    const bankNameLower = bank.name.toLowerCase()
    return bankNameLower.includes(normalizedDetected) || normalizedDetected.includes(bankNameLower)
  })

  if (match) {
    console.log("Genel kısmi eşleşme:", match.name)
    return match
  }

  console.log("Hiç eşleşme bulunamadı")
  return null
}

// Basit faiz oranı hesaplayıcı
export function calculateInterestRate(
  loanAmount: number | null,
  totalPayback: number | null,
  loanTerm: number | null,
): number | null {
  if (
    loanAmount === null ||
    totalPayback === null ||
    loanAmount <= 0 ||
    totalPayback <= 0 ||
    !loanTerm ||
    loanTerm <= 0
  ) {
    return null
  }

  const totalInterest = totalPayback - loanAmount
  const years = loanTerm / 12

  if (years <= 0 || loanAmount === 0) return null

  const rate = (totalInterest / loanAmount / years) * 100
  // İki ondalık basamağa yuvarla
  return Math.round(rate * 100) / 100
}
