"use client"

import { useEffect } from "react"

// Sayfa önbellekten geldiği için görüntülenme sunucuda sayılamaz; tarayıcıdan bildirilir.
export function BlogViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/blog/posts/${encodeURIComponent(slug)}`).catch(() => {})
  }, [slug])

  return null
}
