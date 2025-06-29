"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarModalProps {
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

// Türkçe gün kısaltmaları
const turkishDays = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]

export function CalendarModal({ onDateSelect, onClose, initialDate, title = "Tarih Seçiniz" }: CalendarModalProps) {
  const currentDate = new Date()
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null)
  const [viewDate, setViewDate] = useState<Date>(initialDate || currentDate)

  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()

  // Yıl seçenekleri (son 15 yıl)
  const years = Array.from({ length: 15 }, (_, i) => currentDate.getFullYear() - i)

  // Ayın ilk günü hangi gün (0=Pazar, 1=Pazartesi, ...)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  // Ayın kaç günü var
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Önceki ayın son günleri (boş hücreler için)
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

  // Takvim grid'ini oluştur
  const calendarDays = []

  // Önceki ayın son günleri
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isPrevMonth: true,
      date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i),
    })
  }

  // Bu ayın günleri
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      isPrevMonth: false,
      date: new Date(currentYear, currentMonth, day),
    })
  }

  // Sonraki ayın ilk günleri (42 hücre tamamlamak için)
  const remainingCells = 42 - calendarDays.length
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      isPrevMonth: false,
      date: new Date(currentYear, currentMonth + 1, day),
    })
  }

  const handleMonthChange = (month: string) => {
    const newDate = new Date(viewDate)
    newDate.setMonth(Number.parseInt(month))
    setViewDate(newDate)
  }

  const handleYearChange = (year: string) => {
    const newDate = new Date(viewDate)
    newDate.setFullYear(Number.parseInt(year))
    setViewDate(newDate)
  }

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setViewDate(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setViewDate(newDate)
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleConfirm = () => {
    if (selectedDate) {
      onDateSelect(selectedDate)
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return "Tarih seçilmedi"
    return `${selectedDate.getDate()} ${turkishMonths[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
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
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ay ve Yıl Seçiciler */}
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2 flex-1">
              <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {turkishMonths.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
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

            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Takvim Grid */}
          <div className="space-y-2">
            {/* Gün başlıkları */}
            <div className="grid grid-cols-7 gap-1">
              {turkishDays.map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Takvim günleri */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((calendarDay, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 text-sm font-normal",
                    !calendarDay.isCurrentMonth && "text-gray-400",
                    isToday(calendarDay.date) && "bg-blue-100 text-blue-900 font-semibold",
                    isSelected(calendarDay.date) && "bg-blue-600 text-white hover:bg-blue-700",
                    calendarDay.isCurrentMonth && !isSelected(calendarDay.date) && "hover:bg-gray-100",
                  )}
                  onClick={() => handleDayClick(calendarDay.date)}
                >
                  {calendarDay.day}
                </Button>
              ))}
            </div>
          </div>

          {/* Seçilen Tarih Önizlemesi */}
          {selectedDate && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Seçilen Tarih:</span>
              </div>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100 mt-1">{formatSelectedDate()}</p>
            </div>
          )}

          {/* Butonlar */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              İptal
            </Button>
            <Button onClick={handleConfirm} className="flex-1" disabled={!selectedDate}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Onayla
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
