"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import {
  Zap,
  Brain,
  CheckCircle2,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
  Clock,
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useToast } from "@/hooks/use-toast"
import BankSelector from "@/components/bank-selector"

interface AnalysisResult {
  bankName: string | null
  planName: string
  loanAmount: number
  totalPayback: number
  currency: string
  installments: Array<{
    installmentNumber: number
    amount: number
    dueDate: string
    description?: string
    isPaid: boolean
  }>
  interestRate: number | null
  fees: number | null
  loanTerm: number
  monthlyPayment: number | null
}

export default function PDFOdemePlaniPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [processingTime, setProcessingTime] = useState<number | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0]
      if (selectedFile && selectedFile.type === "application/pdf") {
        setFile(selectedFile)
        setError(null)
        setProcessingTime(null)

        // Dosya boyutu uyarısı
        if (selectedFile.size > 5 * 1024 * 1024) {
          toast({
            title: "Büyük Dosya",
            description: "5MB üzeri dosyalar daha yavaş işlenebilir",
            variant: "default",
          })
        }
      } else {
        setError("Lütfen geçerli bir PDF dosyası seçin.")
      }
    },
    [toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const analyzeFile = async () => {
    if (!file) return

    setIsAnalyzing(true)
    setProgress(0)
    setError(null)
    const startTime = Date.now()

    try {
      // Hızlı progress animasyonu
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval)
            return 85
          }
          return prev + 15 // Daha hızlı artış
        })
      }, 300) // Daha sık güncelleme

      const formData = new FormData()
      formData.append("pdf", file)

      console.log("PDF analizi başlıyor...")
      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const processingTimeMs = Date.now() - startTime
      setProcessingTime(processingTimeMs)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "PDF analizi başarısız oldu")
      }

      const data = await response.json()
      console.log(`Analiz tamamlandı: ${processingTimeMs}ms`)

      if (data.success && data.paymentPlan) {
        setAnalysisResult(data.paymentPlan)

        toast({
          title: "Analiz Tamamlandı!",
          description: `${(processingTimeMs / 1000).toFixed(1)} saniyede ${data.paymentPlan.installments?.length || 0} taksit tespit edildi`,
        })

        // Banka adı tespit edilmediyse banka seçici göster
        if (!data.paymentPlan.bankName) {
          setShowBankSelector(true)
        } else {
          // Direkt analiz sayfasına yönlendir
          router.push(
            `/uygulama/krediler/pdf-odeme-plani/analiz?data=${encodeURIComponent(JSON.stringify(data.paymentPlan))}`,
          )
        }
      } else if (data.fallbackPlan) {
        setAnalysisResult(data.fallbackPlan)
        toast({
          title: "Kısmi Analiz",
          description: "PDF tam olarak analiz edilemedi, manuel düzenleme gerekebilir.",
          variant: "default",
        })
        router.push(
          `/uygulama/krediler/pdf-odeme-plani/analiz?data=${encodeURIComponent(JSON.stringify(data.fallbackPlan))}`,
        )
      } else {
        throw new Error(data.error || "PDF analizi tamamlanamadı")
      }
    } catch (err: any) {
      console.error("PDF analiz hatası:", err)
      setError(err.message || "PDF analizi sırasında bir hata oluştu")
      toast({
        title: "Analiz Hatası",
        description: err.message || "PDF analizi sırasında bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
    }
  }

  const handleBankSelect = (bankName: string) => {
    if (analysisResult) {
      const updatedResult = { ...analysisResult, bankName }
      router.push(`/uygulama/krediler/pdf-odeme-plani/analiz?data=${encodeURIComponent(JSON.stringify(updatedResult))}`)
    }
    setShowBankSelector(false)
  }

  const handleBankSkip = () => {
    if (analysisResult) {
      router.push(
        `/uygulama/krediler/pdf-odeme-plani/analiz?data=${encodeURIComponent(JSON.stringify(analysisResult))}`,
      )
    }
    setShowBankSelector(false)
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className="overflow-hidden border-0 shadow-xl rounded-2xl">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-8 text-white relative">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mt-32 -mr-32"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -mb-20 -ml-20"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">PDF Ödeme Planı Analizi</h1>
                <p className="text-purple-100 text-lg">
                  Gelişmiş AI teknolojisi ile ödeme planınızı otomatik olarak çıkarın
                </p>
                {processingTime && (
                  <p className="text-purple-100 text-sm mt-1">
                    Son analiz: {(processingTime / 1000).toFixed(1)} saniye
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-purple-100">
                  <Shield className="h-5 w-5" />
                  <span>Güvenli ve Hızlı</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-purple-100">
                  <Zap className="h-5 w-5" />
                  <span>Optimize Edilmiş OCR</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <div className="flex items-center gap-2 text-purple-100">
                  <Clock className="h-5 w-5" />
                  <span>3-5 Saniye Analiz</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Upload Area */}
      <Card className="shadow-lg border-gray-200 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            PDF Dosyası Yükle
          </CardTitle>
          <CardDescription>Bankanızdan aldığınız ödeme planı PDF'ini yükleyin</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-purple-500 bg-purple-50"
                : file
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-purple-400 hover:bg-purple-50/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-6">
              {file ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <div>
                    <p className="text-xl font-medium text-green-700 mb-2">{file.name}</p>
                    <p className="text-sm text-green-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                      {file.size > 5 * 1024 * 1024 && " - Büyük dosya, yavaş olabilir"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-16 w-16 text-gray-400" />
                  <div>
                    <p className="text-xl font-medium text-gray-700 mb-2">
                      {isDragActive ? "Dosyayı buraya bırakın" : "PDF dosyasını sürükleyin veya seçin"}
                    </p>
                    <p className="text-sm text-gray-500">Maksimum 10MB - Küçük dosyalar daha hızlı</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Progress */}
          {isAnalyzing && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                <span className="text-sm font-medium">PDF hızlı analiz ediliyor...</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-gray-500">Optimize edilmiş AI ile 3-5 saniyede tamamlanacak</p>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={analyzeFile}
            disabled={!file || isAnalyzing}
            className="w-full mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-14 text-lg font-semibold"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Hızlı Analiz Ediliyor...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-6 w-6" />
                PDF'i Hızlı Analiz Et
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Features */}
      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          {
            icon: CheckCircle2,
            title: "Yüksek Doğruluk",
            description: "Gelişmiş OCR teknolojisi ile %99 doğruluk oranı",
            color: "from-green-500 to-emerald-600",
          },
          {
            icon: Zap,
            title: "Hızlı İşlem",
            description: "Saniyeler içinde analiz tamamlanır",
            color: "from-yellow-500 to-orange-600",
          },
          {
            icon: Brain,
            title: "Akıllı Analiz",
            description: "AI destekli detaylı finansal analiz",
            color: "from-purple-500 to-indigo-600",
          },
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <motion.div
                className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <feature.icon className="h-7 w-7 text-white" />
              </motion.div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Bank Selector Modal */}
      {showBankSelector && <BankSelector onBankSelect={handleBankSelect} onSkip={handleBankSkip} />}
    </div>
  )
}
