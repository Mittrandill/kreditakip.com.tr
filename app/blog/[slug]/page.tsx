import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, ArrowLeft, User, Share2 } from "lucide-react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Image from "next/image"
import Link from "next/link"
import { createSupabaseServer } from "@/lib/supabase-server"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"

export const revalidate = 60 // Revalidate every 60 seconds

interface PageProps {
  params: {
    slug: string
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const supabase = createSupabaseServer()

  // Fetch the blog post
  const { data: post } = await supabase
    .from("blog_posts")
    .select(`
      *,
      category:blog_categories(name, slug),
      author:profiles(first_name, last_name)
    `)
    .eq("slug", params.slug)
    .eq("status", "published")
    .single()

  if (!post) {
    notFound()
  }

  // Fetch related posts from the same category
  const { data: relatedPosts } = await supabase
    .from("blog_posts")
    .select(`
      id,
      title,
      slug,
      excerpt,
      featured_image,
      read_time,
      published_at,
      created_at
    `)
    .eq("status", "published")
    .eq("category_id", post.category_id)
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(3)

  // Increment view count (fire and forget)
  supabase
    .from("blog_posts")
    .update({ views: (post.views || 0) + 1 })
    .eq("id", post.id)
    .then()

  return (
    <div className="min-h-screen w-full bg-[#151515] text-white font-sans">
      <div className="absolute inset-0 -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-emerald-500/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[60vw] h-[60vh] bg-teal-500/15 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Header />

        {/* Back Button */}
        <section className="pt-20 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto">
            <Link href="/blog">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Blog'a Dön
              </Button>
            </Link>
          </div>
        </section>

        {/* Article Header */}
        <article className="pb-16 px-4 md:px-8 lg:px-16">
          <div className="container mx-auto max-w-4xl">
            {/* Category Badge */}
            <div className="mb-6">
              <span className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {post.category?.name || "Genel"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-8 text-white/60">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-white">
                  {post.author?.first_name && post.author?.last_name
                    ? `${post.author.first_name} ${post.author.last_name}`
                    : "Kredi Takip"}
                </span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.published_at || post.created_at).toLocaleDateString("tr-TR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.read_time || 5} dakika</span>
              </div>
            </div>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-12">
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Excerpt */}
            {post.excerpt && (
              <div className="mb-8 p-6 bg-black/20 border border-white/10 rounded-xl backdrop-blur-xl">
                <p className="text-lg text-white/80 leading-relaxed italic">
                  {post.excerpt}
                </p>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-invert prose-lg max-w-none mb-12">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-4xl font-bold mb-6 mt-8" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-3xl font-bold mb-4 mt-8" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-2xl font-bold mb-3 mt-6" {...props} />,
                  p: ({ node, ...props }) => <p className="text-white/80 mb-4 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 text-white/80" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-white/80" {...props} />,
                  li: ({ node, ...props }) => <li className="text-white/80" {...props} />,
                  a: ({ node, ...props }) => <a className="text-emerald-400 hover:text-emerald-300 underline" {...props} />,
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-white/70 my-6" {...props} />
                  ),
                  code: ({ node, ...props }) => (
                    <code className="bg-black/40 px-2 py-1 rounded text-emerald-400 text-sm" {...props} />
                  ),
                  pre: ({ node, ...props }) => (
                    <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto mb-4" {...props} />
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Share Section */}
            <div className="border-t border-white/10 pt-8 mb-12">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Bu yazıyı paylaş</span>
                <Button
                  variant="outline"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"  
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Paylaş
                </Button>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="py-16 px-4 md:px-8 lg:px-16 border-t border-white/10">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl font-bold mb-8">İlgili Yazılar</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <Card className="bg-black/20 border-white/10 backdrop-blur-xl overflow-hidden hover:border-emerald-500/30 transition-all duration-500 group cursor-pointer h-full">
                      {relatedPost.featured_image && (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={relatedPost.featured_image}
                            alt={relatedPost.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-white/70 text-sm mb-3 line-clamp-2">{relatedPost.excerpt}</p>
                        <div className="flex items-center gap-2 text-white/60 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{relatedPost.read_time || 5} dk</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </div>
  )
}
