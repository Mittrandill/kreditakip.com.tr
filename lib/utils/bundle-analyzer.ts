// Bundle analyzer utilities for optimizing imports
export const dynamicImports = {
  // Lazy load chart libraries only when needed
  recharts: () => import('recharts'),
  
  // Lazy load heavy UI components
  framerMotion: () => import('framer-motion'),
  
  // Lazy load form libraries
  reactHookForm: () => import('react-hook-form'),
  
  // Lazy load PDF libraries
  jspdf: () => import('jspdf'),
  
  // Lazy load Excel libraries
  xlsx: () => import('xlsx'),
}

// Tree shaking optimized imports
export const optimizedImports = {
  // Import only needed lodash functions
  debounce: () => import('lodash/debounce'),
  throttle: () => import('lodash/throttle'),
  
  // Import only needed date-fns functions
  format: () => import('date-fns/format'),
  parseISO: () => import('date-fns/parseISO'),
  
  // Import only needed lucide icons
  icons: {
    Loader2: () => import('lucide-react/dist/esm/icons/loader-2'),
    AlertCircle: () => import('lucide-react/dist/esm/icons/alert-circle'),
    CheckCircle: () => import('lucide-react/dist/esm/icons/check-circle'),
  }
}

// Code splitting boundaries
export const splitPoints = [
  '/uygulama/ana-sayfa',
  '/uygulama/krediler', 
  '/uygulama/kredi-kartlari',
  '/uygulama/hesaplar',
  '/uygulama/raporlar',
] as const