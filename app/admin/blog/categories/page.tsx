"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2 } from "lucide-react"
import { AdminClientLayoutWrapper } from "@/components/admin-client-layout-wrapper"

interface Category {
  id: string
  name: string
  slug: string
  description: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: "", slug: "", description: "" })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/blog/categories")
      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/admin/blog/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create category")
      }

      // Reset form and refresh
      setFormData({ name: "", slug: "", description: "" })
      setShowForm(false)
      fetchCategories()
    } catch (error: any) {
      console.error("Error creating category:", error)
      alert(error.message || "Kategori oluşturulurken bir hata oluştu")
    }
  }

  const generateSlug = (name: string) => {
    const turkishMap: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
    }

    return name
      .split('')
      .map(char => turkishMap[char] || char)
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    })
  }

  return (
    <AdminClientLayoutWrapper>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Kategoriler</h1>
            <p className="text-white/60">Blog kategorilerini yönetin</p>
          </div>
        <Button
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kategori
        </Button>
      </div>

      {/* New Category Form */}
      {showForm && (
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Kategori Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="bg-black/20 border-white/10 text-white"
                  placeholder="Örn: Finans İpuçları"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug" className="text-white">Slug (URL için)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                  placeholder="Örn: finans-ipuclari"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                  placeholder="Kategori açıklaması"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                >
                  Kaydet
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ name: "", slug: "", description: "" })
                  }}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-white/60">Yükleniyor...</p>
        </div>
      ) : categories.length === 0 ? (
        <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
          <CardContent className="py-12 text-center">
            <p className="text-white/60">Henüz kategori yok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="bg-black/20 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                </div>
                <p className="text-sm text-white/40 mb-3">/{category.slug}</p>
                {category.description && (
                  <p className="text-sm text-white/60">{category.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </AdminClientLayoutWrapper>
  )
}
