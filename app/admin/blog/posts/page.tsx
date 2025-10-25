"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, Eye, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AdminClientLayoutWrapper } from "@/components/admin-client-layout-wrapper"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  status: string
  views: number
  read_time: number
  created_at: string
  published_at: string
  category: {
    name: string
  }
  author: {
    first_name: string
    last_name: string
  }
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
  }, [filter])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const url = filter === "all"
        ? "/api/admin/blog/posts"
        : `/api/admin/blog/posts?status=${filter}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu blog yazısını silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete post")
      }

      // Refresh the posts list
      fetchPosts()
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Blog yazısı silinirken bir hata oluştu")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { label: "Yayında", className: "bg-emerald-500/20 text-emerald-400" },
      draft: { label: "Taslak", className: "bg-yellow-500/20 text-yellow-400" },
      archived: { label: "Arşivlendi", className: "bg-gray-500/20 text-gray-400" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <AdminClientLayoutWrapper>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Blog Yazıları</h1>
            <p className="text-white/60">Tüm blog yazılarını yönetin</p>
          </div>
        <Link href="/admin/blog/posts/new">
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Yazı
          </Button>
        </Link>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          className={filter === "all"
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            : "bg-transparent border-white/20 text-white/80 hover:bg-white/10"}
          onClick={() => setFilter("all")}
        >
          Tümü
        </Button>
        <Button
          variant={filter === "published" ? "default" : "outline"}
          className={filter === "published"
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            : "bg-transparent border-white/20 text-white/80 hover:bg-white/10"}
          onClick={() => setFilter("published")}
        >
          Yayında
        </Button>
        <Button
          variant={filter === "draft" ? "default" : "outline"}
          className={filter === "draft"
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            : "bg-transparent border-white/20 text-white/80 hover:bg-white/10"}
          onClick={() => setFilter("draft")}
        >
          Taslak
        </Button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-white/60">Yükleniyor...</p>
        </div>
      ) : posts.length === 0 ? (
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardContent className="py-12 text-center">
            <p className="text-white/60">Henüz blog yazısı yok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                      {getStatusBadge(post.status)}
                    </div>
                    <p className="text-white/60 text-sm mb-3">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>{post.category?.name || "Kategorisiz"}</span>
                      <span>•</span>
                      <span>
                        {post.author?.first_name} {post.author?.last_name}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.views || 0} görüntülenme</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.read_time || 5} dk</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/admin/blog/posts/${post.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </AdminClientLayoutWrapper>
  )
}
