"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function AuthCallback() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL'den hash parametrelerini al
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          toast({
            variant: "destructive",
            title: "Giriş Hatası",
            description: "Giriş işlemi sırasında bir hata oluştu.",
          })
          router.push("/giris")
          return
        }

        if (data?.session?.user) {
          // Kullanıcı profili var mı kontrol et
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.session.user.id).single()

          if (!profile) {
            // Profil yoksa oluştur
            const { error: profileError } = await supabase.from("profiles").insert({
              id: data.session.user.id,
              email: data.session.user.email,
              first_name:
                data.session.user.user_metadata?.first_name ||
                data.session.user.user_metadata?.full_name?.split(" ")[0] ||
                "",
              last_name:
                data.session.user.user_metadata?.last_name ||
                data.session.user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
                "",
              avatar_url: data.session.user.user_metadata?.avatar_url || null,
            })

            if (profileError) {
              console.error("Profile creation error:", profileError)
            }
          }

          toast({
            title: "Giriş Başarılı",
            description: "Google ile giriş işlemi tamamlandı.",
          })
          router.push("/uygulama/ana-sayfa")
        } else {
          router.push("/giris")
        }
      } catch (error) {
        console.error("Unexpected error:", error)
        toast({
          variant: "destructive",
          title: "Beklenmeyen Hata",
          description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        })
        router.push("/giris")
      }
    }

    handleAuthCallback()
  }, [router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#151515]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-white/80">Giriş işlemi tamamlanıyor...</p>
      </div>
    </div>
  )
}
