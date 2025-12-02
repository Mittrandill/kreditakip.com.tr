/**
 * Font İndirme Script'i
 * Roboto fontunu Google Fonts'tan indirir ve public/fonts klasörüne kaydeder
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const FONT_URL = 'https://github.com/google/roboto/raw/main/src/hinted/Roboto-Regular.ttf'
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'fonts')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'Roboto-Regular.ttf')

// Klasör yoksa oluştur
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log('✓ fonts klasörü oluşturuldu')
}

// Font dosyasını indir
console.log('Roboto font indiriliyor...')

https.get(FONT_URL, (response) => {
  if (response.statusCode === 302 || response.statusCode === 301) {
    // Redirect takip et
    https.get(response.headers.location, (redirectResponse) => {
      const fileStream = fs.createWriteStream(OUTPUT_FILE)
      redirectResponse.pipe(fileStream)

      fileStream.on('finish', () => {
        fileStream.close()
        console.log('✓ Roboto-Regular.ttf başarıyla indirildi!')
        console.log(`  Dosya konumu: ${OUTPUT_FILE}`)
      })
    })
  } else {
    const fileStream = fs.createWriteStream(OUTPUT_FILE)
    response.pipe(fileStream)

    fileStream.on('finish', () => {
      fileStream.close()
      console.log('✓ Roboto-Regular.ttf başarıyla indirildi!')
      console.log(`  Dosya konumu: ${OUTPUT_FILE}`)
    })
  }
}).on('error', (err) => {
  console.error('✗ Font indirme hatası:', err.message)
  console.log('\nAlternatif: Manuel indirme')
  console.log('1. https://fonts.google.com/specimen/Roboto adresine gidin')
  console.log('2. "Download family" butonuna tıklayın')
  console.log('3. ZIP içinden Roboto-Regular.ttf dosyasını çıkarın')
  console.log(`4. ${OUTPUT_FILE} konumuna kaydedin`)
})
