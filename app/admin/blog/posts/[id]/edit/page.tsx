"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, Eye } from "lucide-react"
import Link from "next/link"
import { AdminClientLayoutWrapper } from "@/components/admin-client-layout-wrapper"

interface Category {
  id: string
  name: string
}

export default function EditBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image: "",
    category_id: "",
    status: "draft",
    read_time: 5,
  })

  useEffect(() => {
    fetchCategories()
    fetchPost()
  }, [postId])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/blog/categories")
      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/blog/posts/${postId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch post")
      }
      const data = await response.json()
      setFormData({
        title: data.post.title,
        slug: data.post.slug,
        excerpt: data.post.excerpt || "",
        content: data.post.content,
        featured_image: data.post.featured_image || "",
        category_id: data.post.category_id || "",
        status: data.post.status,
        read_time: data.post.read_time || 5,
      })
    } catch (error) {
      console.error("Error fetching post:", error)
      alert("Blog yazısı yüklenirken bir hata oluştu")
      router.push("/admin/blog/posts")
    } finally {
      setLoading(false)
    }
  }

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.trim().split(/\s+/).length
    return Math.max(1, Math.ceil(words / wordsPerMinute))
  }

  const handleContentChange = (content: string) => {
    setFormData({
      ...formData,
      content,
      read_time: estimateReadTime(content),
    })
  }

  const handleSubmit = async (status: string) => {
    if (!formData.title || !formData.slug || !formData.content) {
      alert("Lütfen başlık, slug ve içerik alanlarını doldurun")
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update post")
      }

      router.push("/admin/blog/posts")
    } catch (error: any) {
      console.error("Error updating post:", error)
      alert(error.message || "Blog yazısı güncellenirken bir hata oluştu")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <AdminClientLayoutWrapper>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/blog/posts">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Blog Yazısını Düzenle</h1>
          <p className="text-white/60">Blog yazısını güncelle</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">Başlık *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                  placeholder="Blog yazısı başlığı"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug" className="text-white">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                  placeholder="blog-yazisi-url"
                  required
                />
              </div>

              <div>
                <Label htmlFor="excerpt" className="text-white">Özet</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                  placeholder="Kısa bir özet yazın"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content" className="text-white">İçerik *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="bg-black/20 border-white/10 text-white min-h-[400px] font-mono"
                  placeholder="Blog yazısı içeriğini markdown formatında yazın..."
                  required
                />
                <p className="text-xs text-white/50 mt-2">
                  Markdown formatı desteklenir. Tahmini okuma süresi: {formData.read_time} dakika
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="category" className="text-white">Kategori</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-white">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="featured_image" className="text-white">Öne Çıkan Görsel URL</Label>
                <Input
                  id="featured_image"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="read_time" className="text-white">Okuma Süresi (dk)</Label>
                <Input
                  id="read_time"
                  type="number"
                  value={formData.read_time}
                  onChange={(e) => setFormData({ ...formData, read_time: parseInt(e.target.value) || 5 })}
                  className="bg-black/20 border-white/10 text-white"
                  min="1"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardContent className="p-6 space-y-3">
              <Button
                onClick={() => handleSubmit("draft")}
                disabled={saving}
                className="w-full bg-transparent border border-white/20 text-white hover:bg-white/10"
              >
                <Save className="mr-2 h-4 w-4" />
                Taslak Olarak Kaydet
              </Button>
              <Button
                onClick={() => handleSubmit("published")}
                disabled={saving}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
              >
                <Eye className="mr-2 h-4 w-4" />
                {formData.status === "published" ? "Güncelle ve Yayınla" : "Yayınla"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AdminClientLayoutWrapper>
  )
}
