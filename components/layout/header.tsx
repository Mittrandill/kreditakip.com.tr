import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Header() {
  return (
    <header className="py-6 px-4 md:px-8 lg:px-16 relative z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Image src="/images/logo-white.svg" alt="KrediTakip" width={180} height={40} className="h-8 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-white/80 hover:text-white transition-colors">
            Ana Sayfa
          </Link>
          <Link href="/ozellikler" className="text-white/80 hover:text-white transition-colors">
            Özellikler
          </Link>
          <Link href="/hakkimizda" className="text-white/80 hover:text-white transition-colors">
            Hakkımızda
          </Link>
          <Link href="/iletisim" className="text-white/80 hover:text-white transition-colors">
            İletişim
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/giris">
            <Button 
             variant="outline" 
             size="lg"
             className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white"
              >
            Giriş Yap
            </Button>
          </Link>
          <Link href="/kayit-ol">
            <Button 
            className="bg-brand-green text-white font-semibold hover:bg-brand-green/90"
            size="lg"
            >Kayıt Ol</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
