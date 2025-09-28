// Banka adı eşleştirme fonksiyonu
export function mapBankName(detectedName: string): string {
  if (!detectedName) return detectedName

  const normalizedName = detectedName.toLowerCase().trim()

  // Banka eşleştirme haritası - daha kapsamlı
  const bankMappings: Record<string, string> = {
    // Devlet Bankaları
    ziraat: "T.C. Ziraat Bankası A.Ş.",
    "ziraat bankası": "T.C. Ziraat Bankası A.Ş.",
    "ziraat bank": "T.C. Ziraat Bankası A.Ş.",
    "tc ziraat bankası": "T.C. Ziraat Bankası A.Ş.",
    "t.c. ziraat bankası": "T.C. Ziraat Bankası A.Ş.",
    "t.c. ziraat bankası a.ş.": "T.C. Ziraat Bankası A.Ş.",
    "türkiye cumhuriyeti ziraat bankası": "T.C. Ziraat Bankası A.Ş.",

    halk: "Türkiye Halk Bankası A.Ş.",
    halkbank: "Türkiye Halk Bankası A.Ş.",
    "halk bankası": "Türkiye Halk Bankası A.Ş.",
    "türkiye halk bankası": "Türkiye Halk Bankası A.Ş.",
    "türkiye halk bankası a.ş.": "Türkiye Halk Bankası A.Ş.",
    "t. halk bankası": "Türkiye Halk Bankası A.Ş.",

    vakıf: "Türkiye Vakıflar Bankası T.A.O.",
    vakif: "Türkiye Vakıflar Bankası T.A.O.",
    vakıfbank: "Türkiye Vakıflar Bankası T.A.O.",
    "vakıf bankası": "Türkiye Vakıflar Bankası T.A.O.",
    "vakif bankasi": "Türkiye Vakıflar Bankası T.A.O.",
    "türkiye vakıflar bankası": "Türkiye Vakıflar Bankası T.A.O.",
    "turkiye vakiflar bankasi": "Türkiye Vakıflar Bankası T.A.O.",
    "vakıflar bankası": "Türkiye Vakıflar Bankası T.A.O.",
    "vakiflar bankasi": "Türkiye Vakıflar Bankası T.A.O.",
    "t. vakıflar bankası": "Türkiye Vakıflar Bankası T.A.O.",
    "türkiye vakıflar bankası t.a.o.": "Türkiye Vakıflar Bankası T.A.O.",
    "turkiye vakiflar bankasi t.a.o.": "Türkiye Vakıflar Bankası T.A.O.",

    // Özel Sektör Bankaları
    akbank: "Akbank T.A.Ş.",
    "ak bank": "Akbank T.A.Ş.",
    "akbank t.a.ş.": "Akbank T.A.Ş.",
    "akbank t.a.s.": "Akbank T.A.Ş.",

    "iş bankası": "Türkiye İş Bankası A.Ş.",
    "is bankasi": "Türkiye İş Bankası A.Ş.",
    işbank: "Türkiye İş Bankası A.Ş.",
    isbank: "Türkiye İş Bankası A.Ş.",
    "türkiye iş bankası": "Türkiye İş Bankası A.Ş.",
    "turkiye is bankasi": "Türkiye İş Bankası A.Ş.",
    "t. iş bankası": "Türkiye İş Bankası A.Ş.",
    "türkiye iş bankası a.ş.": "Türkiye İş Bankası A.Ş.",

    "yapı kredi": "Yapı ve Kredi Bankası A.Ş.",
    "yapi kredi": "Yapı ve Kredi Bankası A.Ş.",
    yapıkredi: "Yapı ve Kredi Bankası A.Ş.",
    yapikredi: "Yapı ve Kredi Bankası A.Ş.",
    "yapı ve kredi bankası": "Yapı ve Kredi Bankası A.Ş.",
    "yapi ve kredi bankasi": "Yapı ve Kredi Bankası A.Ş.",
    "yapı kredi bankası": "Yapı ve Kredi Bankası A.Ş.",
    "yapi kredi bankasi": "Yapı ve Kredi Bankası A.Ş.",
    "yapı ve kredi bankası a.ş.": "Yapı ve Kredi Bankası A.Ş.",

    teb: "Türkiye Ekonomi Bankası A.Ş.",
    "türk ekonomi bankası": "Türkiye Ekonomi Bankası A.Ş.",
    "turk ekonomi bankasi": "Türkiye Ekonomi Bankası A.Ş.",
    "türkiye ekonomi bankası": "Türkiye Ekonomi Bankası A.Ş.",
    "türkiye ekonomi bankası a.ş.": "Türkiye Ekonomi Bankası A.Ş.",
    "t.e.b.": "Türkiye Ekonomi Bankası A.Ş.",

    şekerbank: "Şekerbank T.A.Ş.",
    sekerbank: "Şekerbank T.A.Ş.",
    "şeker bank": "Şekerbank T.A.Ş.",
    "seker bank": "Şekerbank T.A.Ş.",
    "şekerbank t.a.ş.": "Şekerbank T.A.Ş.",

    anadolubank: "Anadolubank A.Ş.",
    "anadolu bank": "Anadolubank A.Ş.",
    "anadolubank a.ş.": "Anadolubank A.Ş.",

    fibabanka: "Fibabanka A.Ş.",
    "fiba bank": "Fibabanka A.Ş.",
    "fiba banka": "Fibabanka A.Ş.",
    "fibabanka a.ş.": "Fibabanka A.Ş.",

    "turkish bank": "Turkish Bank A.Ş.",
    turkishbank: "Turkish Bank A.Ş.",
    "turkish bank a.ş.": "Turkish Bank A.Ş.",

    adabank: "Adabank A.Ş.",
    "ada bank": "Adabank A.Ş.",
    "adabank a.ş.": "Adabank A.Ş.",

    // Yabancı Bankalar
    garanti: "Türkiye Garanti Bankası A.Ş.",
    "garanti bbva": "Türkiye Garanti Bankası A.Ş.",
    garantibbva: "Türkiye Garanti Bankası A.Ş.",
    "türkiye garanti bankası": "Türkiye Garanti Bankası A.Ş.",
    "turkiye garanti bankasi": "Türkiye Garanti Bankası A.Ş.",
    "garanti bankası": "Türkiye Garanti Bankası A.Ş.",
    "garanti bankasi": "Türkiye Garanti Bankası A.Ş.",
    "türkiye garanti bankası a.ş.": "Türkiye Garanti Bankası A.Ş.",

    denizbank: "DenizBank A.Ş.",
    "deniz bank": "DenizBank A.Ş.",
    "denizbank a.ş.": "DenizBank A.Ş.",

    "qnb finansbank": "QNB Finansbank A.Ş.",
    "qnb finans": "QNB Finansbank A.Ş.",
    finansbank: "QNB Finansbank A.Ş.",
    "finans bank": "QNB Finansbank A.Ş.",
    "qnb finansbank a.ş.": "QNB Finansbank A.Ş.",

    ing: "ING Bank A.Ş.",
    "ing bank": "ING Bank A.Ş.",
    "ing bankası": "ING Bank A.Ş.",
    "ing bankasi": "ING Bank A.Ş.",
    "ing bank a.ş.": "ING Bank A.Ş.",

    hsbc: "HSBC Bank A.Ş.",
    "hsbc bank": "HSBC Bank A.Ş.",
    "hsbc bankası": "HSBC Bank A.Ş.",
    "hsbc bankasi": "HSBC Bank A.Ş.",
    "hsbc bank a.ş.": "HSBC Bank A.Ş.",

    "deutsche bank": "Deutsche Bank A.Ş.",
    deutsche: "Deutsche Bank A.Ş.",
    "deutsche bank a.ş.": "Deutsche Bank A.Ş.",

    citibank: "Citibank A.Ş.",
    "citi bank": "Citibank A.Ş.",
    citi: "Citibank A.Ş.",
    "citibank a.ş.": "Citibank A.Ş.",

    "alternatif bank": "Alternatif Bank A.Ş.",
    alternatifbank: "Alternatif Bank A.Ş.",
    "alternatif bank a.ş.": "Alternatif Bank A.Ş.",

    "burgan bank": "Burgan Bank A.Ş.",
    burganbank: "Burgan Bank A.Ş.",
    "burgan bank a.ş.": "Burgan Bank A.Ş.",

    icbc: "ICBC Turkey Bank A.Ş.",
    "icbc turkey": "ICBC Turkey Bank A.Ş.",
    "icbc turkey bank": "ICBC Turkey Bank A.Ş.",
    "icbc turkey bank a.ş.": "ICBC Turkey Bank A.Ş.",

    "bank of china": "Bank of China Turkey A.Ş.",
    "bank of china turkey": "Bank of China Turkey A.Ş.",
    "bank of china turkey a.ş.": "Bank of China Turkey A.Ş.",

    "arap türk bankası": "Arap Türk Bankası A.Ş.",
    "arap turk bankasi": "Arap Türk Bankası A.Ş.",
    "arap türk bankası a.ş.": "Arap Türk Bankası A.Ş.",

    "turkland bank": "Turkland Bank A.Ş.",
    turklandbank: "Turkland Bank A.Ş.",
    "turkland bank a.ş.": "Turkland Bank A.Ş.",

    "odea bank": "Odeabank A.Ş.",
    odeabank: "Odeabank A.Ş.",
    "odeabank a.ş.": "Odeabank A.Ş.",

    rabobank: "Rabobank A.Ş.",
    "rabo bank": "Rabobank A.Ş.",
    "rabobank a.ş.": "Rabobank A.Ş.",

    mufg: "MUFG Bank Turkey A.Ş.",
    "mufg bank": "MUFG Bank Turkey A.Ş.",
    "mufg bank turkey": "MUFG Bank Turkey A.Ş.",
    "mufg bank turkey a.ş.": "MUFG Bank Turkey A.Ş.",

    // Katılım Bankaları
    "ziraat katılım": "Ziraat Katılım Bankası A.Ş.",
    "ziraat katilim": "Ziraat Katılım Bankası A.Ş.",
    "ziraat katılım bankası": "Ziraat Katılım Bankası A.Ş.",
    "ziraat katılım bankası a.ş.": "Ziraat Katılım Bankası A.Ş.",

    "vakıf katılım": "Vakıf Katılım Bankası A.Ş.",
    "vakif katilim": "Vakıf Katılım Bankası A.Ş.",
    "vakıf katılım bankası": "Vakıf Katılım Bankası A.Ş.",
    "vakıf katılım bankası a.ş.": "Vakıf Katılım Bankası A.Ş.",

    "emlak katılım": "Türkiye Emlak Katılım Bankası A.Ş.",
    "emlak katilim": "Türkiye Emlak Katılım Bankası A.Ş.",
    "türkiye emlak katılım": "Türkiye Emlak Katılım Bankası A.Ş.",
    "türkiye emlak katılım bankası a.ş.": "Türkiye Emlak Katılım Bankası A.Ş.",

    "türkiye finans": "Türkiye Finans Katılım Bankası A.Ş.",
    "turkiye finans": "Türkiye Finans Katılım Bankası A.Ş.",
    "finans katılım": "Türkiye Finans Katılım Bankası A.Ş.",
    "türkiye finans katılım bankası a.ş.": "Türkiye Finans Katılım Bankası A.Ş.",

    albaraka: "Albaraka Türk Katılım Bankası A.Ş.",
    "albaraka türk": "Albaraka Türk Katılım Bankası A.Ş.",
    "albaraka turk": "Albaraka Türk Katılım Bankası A.Ş.",
    "albaraka türk katılım bankası a.ş.": "Albaraka Türk Katılım Bankası A.Ş.",

    "kuveyt türk": "Kuveyt Türk Katılım Bankası A.Ş.",
    "kuveyt turk": "Kuveyt Türk Katılım Bankası A.Ş.",
    kuveytturk: "Kuveyt Türk Katılım Bankası A.Ş.",
    "kuveyt türk katılım bankası a.ş.": "Kuveyt Türk Katılım Bankası A.Ş.",

    // Kalkınma ve Yatırım Bankaları
    "iller bankası": "İller Bankası A.Ş.",
    "iller bank": "İller Bankası A.Ş.",
    ilbank: "İller Bankası A.Ş.",
    "iller bankası a.ş.": "İller Bankası A.Ş.",

    eximbank: "Türk Eximbank",
    "türk eximbank": "Türk Eximbank",
    "turk eximbank": "Türk Eximbank",

    "kalkınma bankası": "Türkiye Kalkınma ve Yatırım Bankası A.Ş.",
    "kalkinma bankasi": "Türkiye Kalkınma ve Yatırım Bankası A.Ş.",
    tkyb: "Türkiye Kalkınma ve Yatırım Bankası A.Ş.",
    "türkiye kalkınma ve yatırım bankası a.ş.": "Türkiye Kalkınma ve Yatırım Bankası A.Ş.",

    tskb: "Türkiye Sınai Kalkınma Bankası A.Ş.",
    "sınai kalkınma": "Türkiye Sınai Kalkınma Bankası A.Ş.",
    "sinai kalkinma": "Türkiye Sınai Kalkınma Bankası A.Ş.",
    "türkiye sınai kalkınma bankası a.ş.": "Türkiye Sınai Kalkınma Bankası A.Ş.",

    "aktif yatırım": "Aktif Yatırım Bankası A.Ş.",
    "aktif yatirim": "Aktif Yatırım Bankası A.Ş.",
    "aktif yatırım bankası a.ş.": "Aktif Yatırım Bankası A.Ş.",

    jpmorgan: "JPMorgan Chase Bank N.A.",
    "jp morgan": "JPMorgan Chase Bank N.A.",
    "jpmorgan chase": "JPMorgan Chase Bank N.A.",
    "jpmorgan chase bank n.a.": "JPMorgan Chase Bank N.A.",

    "société générale": "Sociét Générale (SA)",
    "societe generale": "Sociét Générale (SA)",
    "sociét générale (sa)": "Sociét Générale (SA)",
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

  // 1. Önce tam eşleşme ara
  let match = availableBanks.find((bank) => bank.name.toLowerCase() === normalizedDetected)

  if (match) {
    return match
  }

  // 2. Eşlenmiş banka adını kullanarak ara
  const mappedName = mapBankName(detectedBankName)

  match = availableBanks.find((bank) => bank.name.toLowerCase() === mappedName.toLowerCase())

  if (match) {
    return match
  }

  // 3. A.Ş., T.A.Ş., T.A.O. gibi ekleri kaldırarak ara
  const cleanDetected = normalizedDetected
    .replace(/\s*a\.ş\.?\s*$/i, "")
    .replace(/\s*t\.a\.ş\.?\s*$/i, "")
    .replace(/\s*t\.a\.o\.?\s*$/i, "")
    .replace(/\s*n\.a\.?\s*$/i, "")
    .replace(/\s*s\.p\.a\.?\s*$/i, "")
    .replace(/\s*$$sa$$\s*$/i, "")
    .trim()

  match = availableBanks.find((bank) => {
    const cleanBankName = bank.name
      .toLowerCase()
      .replace(/\s*a\.ş\.?\s*$/i, "")
      .replace(/\s*t\.a\.ş\.?\s*$/i, "")
      .replace(/\s*t\.a\.o\.?\s*$/i, "")
      .replace(/\s*n\.a\.?\s*$/i, "")
      .replace(/\s*s\.p\.a\.?\s*$/i, "")
      .replace(/\s*$$sa$$\s*$/i, "")
      .trim()

    return cleanBankName === cleanDetected
  })

  if (match) {
    return match
  }

  // 4. Kısmi eşleşme ara - daha akıllı
  const bankKeywords = [
    { keywords: ["vakif", "vakıf"], target: "vakıf" },
    { keywords: ["ziraat"], target: "ziraat" },
    { keywords: ["garanti"], target: "garanti" },
    { keywords: ["akbank", "ak bank"], target: "akbank" },
    { keywords: ["halk", "halkbank"], target: "halk" },
    { keywords: ["is bank", "iş bank", "işbank", "isbank", "türkiye iş", "turkiye is"], target: "iş" },
    { keywords: ["yapi", "yapı", "kredi"], target: "yapı" },
    { keywords: ["teb", "ekonomi"], target: "ekonomi" },
    { keywords: ["deniz"], target: "deniz" },
    { keywords: ["finansbank", "qnb"], target: "finansbank" },
    { keywords: ["ing"], target: "ing" },
    { keywords: ["hsbc"], target: "hsbc" },
    { keywords: ["sekerbank", "şekerbank", "seker", "şeker"], target: "şeker" },
  ]

  for (const { keywords, target } of bankKeywords) {
    const hasKeyword = keywords.some((keyword) => cleanDetected.includes(keyword.toLowerCase()))

    if (hasKeyword) {
      match = availableBanks.find((bank) => bank.name.toLowerCase().includes(target))

      if (match) {
        return match
      }
    }
  }

  // 5. Genel kısmi eşleşme
  match = availableBanks.find((bank) => {
    const bankNameLower = bank.name.toLowerCase()
    const cleanBankName = bankNameLower
      .replace(/\s*a\.ş\.?\s*$/i, "")
      .replace(/\s*t\.a\.ş\.?\s*$/i, "")
      .replace(/\s*t\.a\.o\.?\s*$/i, "")
      .trim()

    return cleanBankName.includes(cleanDetected) || cleanDetected.includes(cleanBankName)
  })

  if (match) {
    return match
  }

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
