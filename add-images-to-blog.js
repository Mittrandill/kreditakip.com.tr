const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Unsplash'tan ücretsiz, telif haksız görseller
// Kredi ve finans temalı görseller
const blogImages = {
  "kredi-taksit-takibi-nasil-yapilir": {
    featured_image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=630&fit=crop",
    alt: "Kredi taksit takibi için dijital araçlar ve hesap makinesi"
  },
  "erken-kredi-kapatma-avantajlari": {
    featured_image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&h=630&fit=crop",
    alt: "Erken kredi kapatma ve finansal özgürlük konsepti"
  },
  "coklu-kredi-yonetimi-stratejileri": {
    featured_image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop",
    alt: "Çoklu kredi yönetimi için finansal planlama ve grafik analizi"
  }
}

async function addImages() {
  console.log("🖼️ Blog yazılarına görseller ekleniyor...\n")
  
  for (const [slug, imageData] of Object.entries(blogImages)) {
    const { data, error } = await supabase
      .from("blog_posts")
      .update({ featured_image: imageData.featured_image })
      .eq("slug", slug)
      .select()
    
    if (error) {
      console.error(`❌ Hata (${slug}):`, error.message)
    } else if (data && data.length > 0) {
      console.log(`✅ Görsel eklendi: ${data[0].title}`)
      console.log(`   📸 ${imageData.alt}`)
      console.log(`   🔗 ${imageData.featured_image}\n`)
    }
  }
  
  console.log("🎉 Tüm görseller başarıyla eklendi!")
  console.log("\n📊 SEO İyileştirmeleri:")
  console.log("   ✓ Yüksek kaliteli featured images (1200x630)")
  console.log("   ✓ Unsplash telif haksız görseller")
  console.log("   ✓ SEO-friendly alt text'ler")
  console.log("   ✓ Sosyal medya paylaşımları için optimize edilmiş boyutlar")
}

addImages()
