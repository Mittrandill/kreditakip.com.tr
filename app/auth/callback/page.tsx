"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function AuthCallback() {
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {

    const handleAuthCallback = async () => {
      try {
        // URL parametrelerini kontrol et
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')
        
        if (error) {
          const errorDescription = urlParams.get('error_description')
          toast({
            variant: "destructive",
            title: "Giriş Hatası",
            description: errorDescription || "Google ile giriş yapılırken bir hata oluştu.",
          })
          router.push("/giris")
          return
        }

        if (!code) {
          // Code yoksa mevcut session'ı kontrol et
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          if (currentSession) {
            handleUserProfile(currentSession.user).catch(console.error)
            router.push("/uygulama/ana-sayfa")
            return
          } else {
            router.push("/giris")
            return
          }
        }

        // Kısa bir delay sonra session kontrolü
        setTimeout(async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            
            if (session) {
              // Session var, direkt yönlendir
              toast({
                title: "Giriş Başarılı",
                description: "Google ile giriş işlemi tamamlandı.",
              })
              
              // Profil kontrolünü arka planda yap (await etme)
              handleUserProfile(session.user).catch(console.error)
              
              router.push("/uygulama/ana-sayfa")
            } else {
              // Session henüz yok, listener başlat
              const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                  authListener.subscription.unsubscribe()
                  
                  toast({
                    title: "Giriş Başarılı",
                    description: "Google ile giriş işlemi tamamlandı.",
                  })
                  
                  // Profil kontrolünü arka planda yap
                  handleUserProfile(session.user).catch(console.error)
                  
                  router.push("/uygulama/ana-sayfa")
                }
              })
              
              // 5 saniye timeout
              setTimeout(() => {
                authListener.subscription.unsubscribe()
                toast({
                  variant: "destructive",
                  title: "Giriş Hatası",
                  description: "Oturum oluşturulamadı. Lütfen tekrar deneyin.",
                })
                router.push("/giris")
              }, 5000)
            }
          } catch (error) {
            console.error("Session check error:", error)
            router.push("/giris")
          }
        }, 1000)

      } catch (error: any) {
        console.error("Auth callback error:", error)
        toast({
          variant: "destructive",
          title: "Beklenmeyen Hata",
          description: "Bir hata oluştu. Lütfen tekrar deneyin.",
        })
        router.push("/giris")
      } finally {
        setIsProcessing(false)
      }
    }

    const handleUserProfile = async (user: any) => {
      try {
        // Profil kontrolü - eğer hata varsa sessizce devam et
        const { data: profile, error: profileCheckError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        if (profileCheckError && profileCheckError.code !== "PGRST116") {
          console.log("Profile check error:", profileCheckError.message)
          // Profil hatası olsa bile devam et
          return
        }

        if (!profile) {
          // Profil yoksa oluşturmaya çalış
          const newProfile = {
            id: user.id,
            email: user.email,
            first_name:
              user.user_metadata?.first_name ||
              user.user_metadata?.full_name?.split(" ")[0] ||
              user.user_metadata?.name?.split(" ")[0] ||
              "",
            last_name:
              user.user_metadata?.last_name ||
              user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
              user.user_metadata?.name?.split(" ").slice(1).join(" ") ||
              "",
            avatar_url: user.user_metadata?.avatar_url || 
                      user.user_metadata?.picture || null,
          }

          const { error: profileError } = await supabase
            .from("profiles")
            .insert(newProfile)

          if (profileError) {
            console.log("Profile creation error:", profileError.message)
            // Profil oluşturulamasa bile devam et
          }
        }
      } catch (error: any) {
        console.log("Profile error:", error.message)
        // Profil hatası olsa bile devam et
      }
    }

    // Component mount olduğunda callback'i başlat
    handleAuthCallback()

    // Cleanup function
    return () => {
      // Cleanup if needed
    }
  }, [router, toast])

  if (!isProcessing) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#151515]">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}
