"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, X } from "lucide-react"

interface DatePickerModalProps {
  onDateSelect: (date: Date) => void
  onClose: () => void
  initialDate?: Date
  title?: string
}

// Türkçe ay isimleri
const turkishMonths = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
]

export function DatePickerModal({ onDateSelect, onClose, initialDate, title = "Tarih Seçiniz" }: DatePickerModalProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const currentDay = new Date().getDate()

  // Yıl seçenekleri (son 15 yıl)
  const years = Array.from({ length: 15 }, (_, i) => currentYear - i)

  const [selectedYear, setSelectedYear] = useState<number>(initialDate ? initialDate.getFullYear() : currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate ? initialDate.getMonth() : currentMonth)
  const [selectedDay, setSelectedDay] = useState<number>(initialDate ? initialDate.getDate() : currentDay)

  // Seçilen ay ve yıla göre gün sayısını hesapla
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Seçilen gün, ayın gün sayısından fazlaysa düzelt
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth)
    }
  }, [selectedYear, selectedMonth, daysInMonth, selectedDay])

  const handleConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay)
    onDateSelect(selectedDate)
    onClose()
  }

  const formatSelectedDate = () => {
    return `${selectedDay} ${turkishMonths[selectedMonth]} ${selectedYear}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                {title}
              </CardTitle>
              <CardDescription>Yıl, ay ve gün seçiniz</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tarih Seçiciler */}
          <div className="space-y-4">
            {/* Yıl Seçici */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Yıl</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Yıl seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ay Seçici */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ay</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ay seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {turkishMonths.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gün Seçici */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gün</label>
              <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(Number.parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Gün seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seçilen Tarih Önizlemesi */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Seçilen Tarih:</span>
            </div>
            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100 mt-1">{formatSelectedDate()}</p>
          </div>

          {/* Butonlar */}
          <div className="flex gap-3">
            <Button onClick={handleConfirm} className="flex-1">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Tarihi Seç
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              İptal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
