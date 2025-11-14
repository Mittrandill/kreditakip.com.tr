import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, ArrowRight, User } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Image from "next/image"
import Link from "next/link"
import { createSupabaseServer } from "@/lib/supabase-server"

export const revalidate = 60 // Revalidate every 60 seconds

export default async function BlogPage() {
  const supabase = createSupabaseServer()

  // Fetch published blog posts with categories
  const { data: blogPosts } = await supabase
    .from("blog_posts")
    .select(`
      *,
      category:blog_categories(name)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  // Fetch all categories
  const { data: categoriesData } = await supabase
    .from("blog_categories")
    .select("name")
    .order("name", { ascending: true })

  const categories = ["Tümü", ...(categoriesData?.map(c => c.name) || [])]
  const posts = blogPosts || []

  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[60vw] h-[60vh] bg-teal-500/15 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-6 py-3 backdrop-blur-xl mb-8">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm font-medium">Kredi Takip Blog</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Finansal <span className="text-emerald-400">Bilgi</span> Merkezi
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Kredi yönetimi, finansal planlama ve teknoloji hakkında güncel içerikler
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"  
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {posts.length === 0 ? (
          <section className="py-20 px-4 md:px-8 lg:px-16">
            <div className="container mx-auto text-center">
              <p className="text-white/60 text-lg">Henüz blog yazısı yayınlanmamış.</p>
            </div>
          </section>
        ) : (
          <>
            {/* Featured Post */}
            <section className="py-12 px-4 md:px-8 lg:px-16">
              <div className="container mx-auto">
                <Link href={`/blog/${posts[0].slug}`}>
                  <Card className="bg-black/20 border-white/10 backdrop-blur-xl overflow-hidden hover:border-emerald-500/30 transition-all duration-500 cursor-pointer">
                    <div className="grid lg:grid-cols-2 gap-0">
                      {posts[0].featured_image && (
                        <div className="relative h-64 lg:h-auto">
                          <Image
                            src={posts[0].featured_image}
                            alt={posts[0].title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-4 left-4 bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                            Öne Çıkan
                          </div>
                        </div>
                      )}
                      <CardContent className="p-8 lg:p-12 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-emerald-400 text-sm font-semibold">
                            {posts[0].category?.name || "Genel"}
                          </span>
                          <span className="text-white/40">•</span>
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{posts[0].read_time || 5} dk</span>
                          </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">{posts[0].title}</h2>
                        <p className="text-white/70 mb-6 leading-relaxed">{posts[0].excerpt}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">Kredi Takip</p>
                              <p className="text-white/60 text-xs">
                                {new Date(posts[0].published_at || posts[0].created_at).toLocaleDateString("tr-TR")}
                              </p>
                            </div>
                          </div>
                          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600">
                            Devamını Oku
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              </div>
            </section>

            {/* Blog Posts Grid */}
            {posts.length > 1 && (
              <section className="py-12 px-4 md:px-8 lg:px-16">
                <div className="container mx-auto">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.slice(1).map((post) => (
                      <Link key={post.id} href={`/blog/${post.slug}`}>
                        <Card className="bg-black/20 border-white/10 backdrop-blur-xl overflow-hidden hover:border-emerald-500/30 transition-all duration-500 group cursor-pointer h-full">
                          {post.featured_image && (
                            <div className="relative h-48 overflow-hidden">
                              <Image
                                src={post.featured_image}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                                {post.category?.name || "Genel"}
                              </div>
                            </div>
                          )}
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-3 text-white/60 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(post.published_at || post.created_at).toLocaleDateString("tr-TR")}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{post.read_time || 5} dk</span>
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-white/70 text-sm mb-4 leading-relaxed line-clamp-3">{post.excerpt}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-teal-500/30 to-teal-500/10 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-teal-400" />
                                </div>
                                <span className="text-white/80 text-sm">Kredi Takip</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              >
                                Oku
                                <ArrowRight className="ml-1 w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* Newsletter CTA */}
        <section className="py-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <div className="relative bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl border border-emerald-500/20 p-12 text-center backdrop-blur-xl overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Haftalık <span className="text-emerald-400">Bültene</span> Abone Olun
                </h2>
                <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                  Finansal ipuçları, kredi yönetimi stratejileri ve platform güncellemeleri doğrudan e-postanızda
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="E-posta adresiniz"
                    className="flex-1 px-6 py-3 bg-black/20 border border-white/10 rounded-full text-white placeholder:text-white/50 focus:outline-none focus:border-emerald-500/50"
                  />
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 px-8 rounded-full">
                    Abone Ol
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
