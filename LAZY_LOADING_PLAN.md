# Lazy Loading Optimization Plan

## Overview
Comprehensive 5-phase plan to optimize bundle size and initial load time through lazy loading, code splitting, and performance optimizations.

**Expected Results:**
- 40-60% faster initial page load
- 30-50% smaller initial bundle size
- Improved Core Web Vitals (LCP, FID, CLS)

---

## Phase 1: Quick Wins - Library Lazy Loading ✅ COMPLETED

**Goal:** Remove heavy libraries from initial bundle

### 1.1 Consolidate Recharts Imports ✅
**Status:** COMPLETED
- Created `lib/chart-loader.tsx` with consolidated Recharts exports
- Replaced 11+ separate dynamic imports with single module
- Updated `app/uygulama/ana-sayfa/page.tsx`
- Updated `app/uygulama/raporlar/page.tsx`

### 1.2 Lazy Load XLSX Library ✅
**Status:** COMPLETED
- Modified `app/uygulama/odeme-plani/page.tsx`
- Changed `exportToExcel` function to async with dynamic import
- Saves ~400KB from initial bundle

### 1.3 Lazy Load jsPDF Library ✅
**Status:** COMPLETED
- Modified `lib/utils/pdf-generator.ts`
- Changed to type-only import: `import type { jsPDF } from "jspdf"`
- Made `generatePDFReport` and `generateCreditReport` functions lazy load jsPDF
- Saves ~250KB from initial bundle

### 1.4 Remove Unused ApexCharts ✅
**Status:** COMPLETED
- Removed unused ApexCharts imports from ana-sayfa and raporlar pages
- Removed packages: `pnpm remove apexcharts react-apexcharts`
- Saves ~500KB from bundle

**Phase 1 Total Savings:** ~1.15MB from initial bundle

---

## Phase 2: Page-Level Code Splitting

**Goal:** Split large pages into smaller chunks

### 2.1 Split Reports Page Components
**File:** `app/uygulama/raporlar/page.tsx`

Create separate components:
```typescript
// components/reports/overview-tab.tsx
// components/reports/payment-analysis-tab.tsx
// components/reports/bank-comparison-tab.tsx
// components/reports/projections-tab.tsx
```

Lazy load tabs:
```typescript
const OverviewTab = dynamic(() => import('@/components/reports/overview-tab'))
const PaymentAnalysisTab = dynamic(() => import('@/components/reports/payment-analysis-tab'))
// etc.
```

### 2.2 Split Credit Detail Page
**File:** `app/uygulama/kredi-detay/[id]/page.tsx`

Extract:
- Payment schedule table → `components/credit-detail/payment-schedule.tsx`
- Statistics cards → `components/credit-detail/statistics.tsx`
- Charts → `components/credit-detail/charts.tsx`

### 2.3 Split Payment Plan Page
**File:** `app/uygulama/odeme-plani/page.tsx`

Extract:
- Filter panel → `components/payment-plan/filters.tsx`
- Payment table → `components/payment-plan/payment-table.tsx`
- Export functionality → `components/payment-plan/export-modal.tsx`

### 2.4 Split Dashboard Page
**File:** `app/uygulama/ana-sayfa/page.tsx`

Extract:
- Metrics cards → `components/dashboard/metrics.tsx`
- Charts section → `components/dashboard/charts.tsx`
- Upcoming payments → `components/dashboard/upcoming-payments.tsx`

**Expected Savings:** 200-300KB per page, faster navigation between pages

---

## Phase 3: Modal & Dialog Lazy Loading

**Goal:** Only load modals when user opens them

### 3.1 Create Dynamic Modal Hook
**File:** `hooks/use-dynamic-modal.tsx`

```typescript
export function useDynamicModal<T>(importFn: () => Promise<any>) {
  const [isOpen, setIsOpen] = useState(false)
  const [ModalComponent, setModalComponent] = useState<any>(null)

  const openModal = async () => {
    if (!ModalComponent) {
      const mod = await importFn()
      setModalComponent(() => mod.default)
    }
    setIsOpen(true)
  }

  return { openModal, closeModal: () => setIsOpen(false), ModalComponent, isOpen }
}
```

### 3.2 Apply to PDF Report Modal
**File:** `components/pdf-report-modal.tsx`

Instead of importing directly, use:
```typescript
const { openModal, ModalComponent, isOpen } = useDynamicModal(
  () => import('@/components/pdf-report-modal')
)
```

### 3.3 Apply to Other Modals
- Credit add/edit modals
- Payment confirmation dialogs
- Settings dialogs
- Notification modals

**Expected Savings:** 50-100KB per modal, only loaded when needed

---

## Phase 4: Table Virtualization

**Goal:** Improve performance for large data tables

### 4.1 Install react-window
```bash
pnpm add react-window @types/react-window
```

### 4.2 Create VirtualizedTable Component
**File:** `components/ui/virtualized-table.tsx`

```typescript
import { FixedSizeList } from 'react-window'

export function VirtualizedTable({ data, rowHeight = 50, height = 600 }) {
  const Row = ({ index, style }) => {
    const item = data[index]
    return (
      <div style={style}>
        {/* Render row content */}
      </div>
    )
  }

  return (
    <FixedSizeList
      height={height}
      itemCount={data.length}
      itemSize={rowHeight}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

### 4.3 Apply to Large Tables
- Payment plan table (can have 100+ rows)
- All payments table in reports
- Credit list on dashboard

**Expected Improvement:** 60-80% faster rendering for tables with 100+ rows

---

## Phase 5: Image Optimization

**Goal:** Lazy load images and optimize loading

### 5.1 Create LazyImage Component
**File:** `components/ui/lazy-image.tsx`

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export function LazyImage({ src, alt, ...props }) {
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef}>
      {isInView ? (
        <Image src={src} alt={alt} {...props} />
      ) : (
        <div className="animate-pulse bg-gray-200" style={props.style} />
      )}
    </div>
  )
}
```

### 5.2 Apply to Bank Logos
**File:** `components/bank-logo.tsx`

Replace with LazyImage for logos in lists

### 5.3 Optimize Image Loading Strategy
- Use Next.js Image component everywhere
- Set proper `sizes` attribute
- Use `priority` only for above-fold images
- Add blur placeholders where appropriate

**Expected Savings:** 30-50% faster LCP, better bandwidth usage

---

## Testing & Validation

After each phase:

### 1. Bundle Analysis
```bash
pnpm run build
# Check build output for chunk sizes
```

### 2. Lighthouse Audit
```bash
# Run Lighthouse in Chrome DevTools
# Target scores: Performance > 90, FCP < 1.5s, LCP < 2.5s
```

### 3. Network Analysis
- Check network tab in DevTools
- Verify lazy loading works (components load on demand)
- Ensure no regression in UX

### 4. User Testing
- Test all features still work
- Verify no broken imports
- Check loading states are smooth

---

## Implementation Order

1. ✅ **Phase 1** (COMPLETED) - Library lazy loading
2. **Phase 2** - Page-level code splitting
3. **Phase 3** - Modal lazy loading
4. **Phase 4** - Table virtualization
5. **Phase 5** - Image optimization

---

## Rollback Plan

If any phase causes issues:

1. Git revert the specific commit
2. Document the issue
3. Fix and retry, or skip to next phase
4. Each phase is independent and can be skipped if needed

---

## Success Metrics

**Before Optimization:**
- Initial bundle: ~2-3MB
- FCP: ~2-3s
- LCP: ~3-4s

**After All Phases (Target):**
- Initial bundle: <1.5MB (40-50% reduction)
- FCP: <1.5s (40-50% improvement)
- LCP: <2.5s (30-40% improvement)
- TTI: <3s

---

## Notes

- All phases are designed to be non-breaking
- Each phase can be implemented and tested independently
- User preferences: All 5 phases approved, react-window for virtualization, single Recharts loader
- Current status: Phase 1 completed, testing in progress
