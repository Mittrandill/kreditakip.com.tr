export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      banks: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          category: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          category: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          category?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      credit_types: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      credits: {
        Row: {
          id: string
          user_id: string
          bank_id: string
          credit_type_id: string
          credit_code: string
          account_number: string | null
          initial_amount: number
          remaining_debt: number
          monthly_payment: number
          interest_rate: number
          start_date: string
          end_date: string
          last_payment_date: string | null
          status: "active" | "closed" | "overdue"
          payment_progress: number
          remaining_installments: number
          total_installments: number
          overdue_days: number
          collateral: string | null
          insurance_status: string
          branch_name: string | null
          customer_number: string | null
          credit_score: string | null
          created_at: string
          updated_at: string
          total_payback: number
          calculated_interest_rate: number | null
        }
        Insert: {
          id?: string
          user_id: string
          bank_id: string
          credit_type_id: string
          credit_code: string
          account_number?: string | null
          initial_amount: number
          remaining_debt: number
          monthly_payment: number
          interest_rate: number
          start_date: string
          end_date: string
          last_payment_date?: string | null
          status?: "active" | "closed" | "overdue"
          payment_progress?: number
          remaining_installments?: number
          total_installments?: number
          overdue_days?: number
          collateral?: string | null
          insurance_status?: string
          branch_name?: string | null
          customer_number?: string | null
          credit_score?: string | null
          created_at?: string
          updated_at?: string
          total_payback: number
          calculated_interest_rate?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          bank_id?: string
          credit_type_id?: string
          credit_code?: string
          account_number?: string | null
          initial_amount?: number
          remaining_debt?: number
          monthly_payment?: number
          interest_rate?: number
          start_date?: string
          end_date?: string
          last_payment_date?: string | null
          status?: "active" | "closed" | "overdue"
          payment_progress?: number
          remaining_installments?: number
          total_installments?: number
          overdue_days?: number
          collateral?: string | null
          insurance_status?: string
          branch_name?: string | null
          customer_number?: string | null
          credit_score?: string | null
          updated_at?: string
          total_payback?: number
          calculated_interest_rate?: number | null
        }
      }
      payment_plans: {
        Row: {
          id: string
          credit_id: string
          installment_number: number
          due_date: string
          principal_amount: number
          interest_amount: number
          total_payment: number
          remaining_debt: number
          status: "paid" | "pending" | "overdue"
          payment_date: string | null
          payment_channel: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          credit_id: string
          installment_number: number
          due_date: string
          principal_amount: number
          interest_amount: number
          total_payment: number
          remaining_debt: number
          status?: "paid" | "pending" | "overdue"
          payment_date?: string | null
          payment_channel?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          credit_id?: string
          installment_number?: number
          due_date?: string
          principal_amount?: number
          interest_amount?: number
          total_payment?: number
          remaining_debt?: number
          status?: "paid" | "pending" | "overdue"
          payment_date?: string | null
          payment_channel?: string | null
          updated_at?: string
        }
      }
      payment_history: {
        Row: {
          id: string
          credit_id: string
          payment_plan_id: string | null
          amount: number
          payment_date: string
          payment_channel: string | null
          status: "completed" | "failed" | "pending"
          transaction_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          credit_id: string
          payment_plan_id?: string | null
          amount: number
          payment_date: string
          payment_channel?: string | null
          status?: "completed" | "failed" | "pending"
          transaction_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          credit_id?: string
          payment_plan_id?: string | null
          amount?: number
          payment_date?: string
          payment_channel?: string | null
          status?: "completed" | "failed" | "pending"
          transaction_id?: string | null
          notes?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          credit_id: string | null
          payment_plan_id: string | null
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credit_id?: string | null
          payment_plan_id?: string | null
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credit_id?: string | null
          payment_plan_id?: string | null
          title?: string
          message?: string
          is_read?: boolean
        }
      }
      financial_profiles: {
        Row: {
          user_id: string
          monthly_income: number | null
          monthly_expenses: number | null
          total_assets: number | null
          total_liabilities: number | null
          employment_status: string | null
          housing_status: string | null
          other_debt_obligations: string | null
          savings_goals: string | null
          risk_tolerance: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          {
            user_id: string
            monthly_income: number | null
            monthly_expenses: number | null
            total_assets: number | null
            total_liabilities: number | null
            employment_status: string | null
            housing_status: string | null
            other_debt_obligations: string | null
            savings_goals: string | null
            risk_tolerance: string | null
            created_at: string
            updated_at: string
          },
          "user_id" | "created_at" | "updated_at"
        > & { user_id?: string }
        Update: Partial<
          Omit<
            {
              user_id: string
              monthly_income: number | null
              monthly_expenses: number | null
              total_assets: number | null
              total_liabilities: number | null
              employment_status: string | null
              housing_status: string | null
              other_debt_obligations: string | null
              savings_goals: string | null
              risk_tolerance: string | null
              created_at: string
              updated_at: string
            },
            "user_id" | "created_at" | "updated_at"
          >
        > & { user_id?: string }
      }
      risk_analyses: {
        Row: {
          id: string
          user_id: string
          analysis_data: any // JSONB
          overall_risk_score: string | null
          overall_risk_color: string | null
          debt_to_income_ratio: string | null
          monthly_income: number | null
          monthly_expenses: number | null
          total_assets: number | null
          total_credits_count: number | null
          total_debt_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          analysis_data: any
          overall_risk_score?: string | null
          overall_risk_color?: string | null
          debt_to_income_ratio?: string | null
          monthly_income?: number | null
          monthly_expenses?: number | null
          total_assets?: number | null
          total_credits_count?: number | null
          total_debt_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          analysis_data?: any
          overall_risk_score?: string | null
          overall_risk_color?: string | null
          debt_to_income_ratio?: string | null
          monthly_income?: number | null
          monthly_expenses?: number | null
          total_assets?: number | null
          total_credits_count?: number | null
          total_debt_amount?: number | null
          updated_at?: string
        }
      }
      refinancing_analyses: {
        Row: {
          id: string
          user_id: string
          analysis_data: any // JSONB
          total_potential_savings: number | null
          refinancing_potential: string | null
          urgency_level: string | null
          recommended_strategy: string | null
          credits_analyzed: number | null
          market_rates: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          analysis_data: any
          total_potential_savings?: number | null
          refinancing_potential?: string | null
          urgency_level?: string | null
          recommended_strategy?: string | null
          credits_analyzed?: number | null
          market_rates?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          analysis_data?: any
          total_potential_savings?: number | null
          refinancing_potential?: string | null
          urgency_level?: string | null
          recommended_strategy?: string | null
          credits_analyzed?: number | null
          market_rates?: any | null
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          bank_id: string
          account_name: string
          account_number: string | null
          iban: string | null
          account_type: "vadesiz" | "vadeli" | "tasarruf" | "yatirim" | "diger"
          current_balance: number
          currency: "TRY" | "USD" | "EUR" | "GBP"
          interest_rate: number
          overdraft_limit: number
          overdraft_interest_rate: number
          is_active: boolean
          last_balance_update: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_id: string
          account_name: string
          account_type: "vadesiz" | "vadeli" | "tasarruf" | "yatirim" | "diger"
          account_number?: string | null
          iban?: string | null
          currency?: "TRY" | "USD" | "EUR" | "GBP"
          current_balance?: number
          overdraft_limit?: number
          overdraft_interest_rate?: number
          interest_rate?: number
          last_balance_update?: string
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_type?: "vadesiz" | "vadeli" | "tasarruf" | "yatirim" | "diger"
          account_number?: string | null
          iban?: string | null
          currency?: "TRY" | "USD" | "EUR" | "GBP"
          current_balance?: number
          overdraft_limit?: number
          overdraft_interest_rate?: number
          interest_rate?: number
          last_balance_update?: string
          is_active?: boolean
          notes?: string | null
          updated_at?: string
        }
      }
      credit_cards: {
        Row: {
          id: string
          user_id: string
          bank_id: string
          card_name: string
          card_type: "kredi" | "bankakarti" | "prepaid"
          card_number: string | null
          credit_limit: number
          current_debt: number
          available_limit: number
          minimum_payment_rate: number
          interest_rate: number
          late_payment_fee: number
          annual_fee: number
          statement_day: number | null
          due_day: number | null
          next_statement_date: string | null
          next_due_date: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_id: string
          card_name: string
          card_type: "kredi" | "bankakarti" | "prepaid"
          card_number?: string | null
          credit_limit?: number
          current_debt?: number
          minimum_payment_rate?: number
          interest_rate?: number
          late_payment_fee?: number
          annual_fee?: number
          statement_day?: number | null
          due_day?: number | null
          next_statement_date?: string | null
          next_due_date?: string | null
          is_active?: boolean
          notes?: string | null
        }
        Update: {
          card_name?: string
          card_type?: "kredi" | "bankakarti" | "prepaid"
          card_number?: string | null
          credit_limit?: number
          current_debt?: number
          minimum_payment_rate?: number
          interest_rate?: number
          late_payment_fee?: number
          annual_fee?: number
          statement_day?: number | null
          due_day?: number | null
          next_statement_date?: string | null
          next_due_date?: string | null
          is_active?: boolean
          notes?: string | null
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name?: string
          avatar_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      banking_credentials: {
        Row: {
          id: string
          user_id: string
          bank_id: string
          credential_name: string
          username: string | null
          encrypted_password: string | null
          credential_type: "internet_banking" | "mobile_banking" | "phone_banking" | "other"
          notes: string | null
          last_used_date: string | null
          password_change_frequency_days: number | null
          last_password_change_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_id: string
          credential_name: string
          username?: string | null
          encrypted_password?: string | null
          credential_type?: "internet_banking" | "mobile_banking" | "phone_banking" | "other"
          notes?: string | null
          last_used_date?: string | null
          password_change_frequency_days?: number | null
          last_password_change_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          credential_name?: string
          username?: string | null
          encrypted_password?: string | null
          credential_type?: "internet_banking" | "mobile_banking" | "phone_banking" | "other"
          notes?: string | null
          last_used_date?: string | null
          password_change_frequency_days?: number | null
          last_password_change_date?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
    }
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Bank = Database["public"]["Tables"]["banks"]["Row"]
export type CreditType = Database["public"]["Tables"]["credit_types"]["Row"]
export type Credit = Database["public"]["Tables"]["credits"]["Row"]
export type PaymentPlan = Database["public"]["Tables"]["payment_plans"]["Row"]
export type PaymentHistory = Database["public"]["Tables"]["payment_history"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type User = Database["public"]["Tables"]["users"]["Row"]

export type FinancialProfile = {
  id: string
  user_id: string
  monthly_income: number
  monthly_expenses: number
  existing_debt: number
  credit_score?: number
  employment_status: string
  employment_duration_months?: number
  created_at: string
  updated_at: string
}

export type RiskAnalysis = Database["public"]["Tables"]["risk_analyses"]["Row"]
export type RefinancingAnalysis = Database["public"]["Tables"]["refinancing_analyses"]["Row"]

// Yeni tipler
export type Account = Database["public"]["Tables"]["accounts"]["Row"]
export type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"]
export type AccountTransaction = Database["public"]["Tables"]["account_transactions"]["Row"]
export type CreditCardTransaction = Database["public"]["Tables"]["credit_card_transactions"]["Row"]
export type AccountBalanceHistory = Database["public"]["Tables"]["account_balance_history"]["Row"]
export type CreditCardBalanceHistory = Database["public"]["Tables"]["credit_card_balance_history"]["Row"]

// Gelişmiş Risk Analizi Veri Yapısı
export interface RiskAnalysisData {
  overallRiskScore: {
    value: string // "Düşük", "Orta", "Yüksek" veya sayısal "7.5/10"
    color: "emerald" | "yellow" | "red"
    numericScore?: number // Sayısal skor (örn: 75)
    scoreMax?: number // Maksimum skor (örn: 100)
    detailedExplanation: string // Skorun neden bu şekilde olduğunun detaylı açıklaması
  }
  overallRiskSummary: string // Genel risk profilinin daha kapsamlı bir özeti

  debtToIncomeRatio: {
    value: string // Hesaplanan Borç/Gelir Oranı (örn: "0.35" veya "%35")
    assessment: "İyi" | "Orta" | "İyileştirilmeli" | "Yüksek" | "Hesaplanamadı"
    explanation: string // Oranın ve kullanıcı için etkilerinin detaylı açıklaması
    benchmark?: {
      idealRange: string // örn: "< %30"
      warningRange: string // örn: "%30 - %40"
      criticalRange: string // örn: "> %40"
    }
    // Grafik için veri noktaları (isteğe bağlı, AI üretebilirse)
    incomeForDTI?: number
    debtPaymentsForDTI?: number
  }

  cashFlowAnalysis?: {
    monthlyIncome: number | null
    monthlyExpenses: number | null
    disposableIncome: number | null // Gelir - Gider
    assessment: "Pozitif" | "Negatif" | "Dengede" | "Belirsiz"
    explanation: string // Nakit akış durumunun detaylı analizi
    suggestions: string[] // Nakit akışını iyileştirmek için öneriler
    // Grafik için veri (isteğe bağlı)
    // incomeSources?: Array<{ source: string; amount: number }>;
    // expenseCategories?: Array<{ category: string; amount: number }>;
  }

  assetLiabilityAnalysis?: {
    totalAssets: number | null
    totalLiabilities: number | null
    netWorth: number | null
    assessment: "Sağlıklı" | "İyileştirilmeli" | "Zayıf" | "Belirsiz"
    explanation: string
    assetBreakdown?: Array<{ category: string; value: number; percentage?: number }>
    liabilityBreakdown?: Array<{ category: string; value: number; percentage?: number }>
  }

  keyRiskFactors: Array<{
    factor: string // Risk faktörünün başlığı
    impact: string // Bu faktörün potansiyel etkisi
    severity: "Düşük" | "Orta" | "Yüksek"
    detailedExplanation: string // Faktörün neden önemli olduğunun detaylı açıklaması
    mitigationTips?: string[] // Riski azaltmak için ipuçları
  }>

  positiveFactors: Array<{
    factor: string // Pozitif faktörün başlığı
    benefit: string // Bu faktörün faydası
    detailedExplanation: string // Faktörün neden pozitif olduğunun detaylı açıklaması
    enhancementTips?: string[] // Bu pozitif durumu daha da güçlendirmek için ipuçları
  }>

  recommendations: Array<{
    recommendation: string // Spesifik, eyleme geçirilebilir tavsiye başlığı
    priority: "Yüksek" | "Orta" | "Düşük"
    details: string // Tavsiyenin detaylı açıklaması ve nedenleri
    actionSteps?: string[] // Tavsiyeyi uygulamak için adım adım rehber
    potentialImpact: string // Bu tavsiyenin uygulanmasının olası olumlu etkisi
  }>

  savingsAnalysis: {
    assessment: "Yeterli" | "İyileştirilmeli" | "Yetersiz" | "Belirsiz"
    emergencyFundStatus: string // örn: "3 aylık gideri karşılıyor"
    emergencyFundTarget?: string // örn: "6 aylık gider hedeflenmeli"
    suggestions: string // Tasarrufları ve acil durum fonunu iyileştirmek için detaylı öneriler
    // Grafik için veri (isteğe bağlı)
    // currentEmergencyFundAmount?: number;
    // targetEmergencyFundAmount?: number;
  }

  creditHealthSummary: string // Sağlanan kredi verilerine dayalı daha kapsamlı genel kredi sağlığı özeti

  creditUtilization?: {
    overallUtilizationRate: string | null // örn: "%30" veya "Hesaplanamadı"
    assessment: "İyi" | "Orta" | "Yüksek" | "Belirsiz"
    explanation: string
    // perCreditCard?: Array<{ cardName: string; limit: number; balance: number; utilization: number }>;
  }

  futureOutlook?: {
    shortTerm: string // Kısa vadeli finansal görünüm
    longTerm: string // Uzun vadeli finansal görünüm
    potentialChallenges: string[] // Olası zorluklar
    opportunities: string[] // Fırsatlar
  }

  // AI'ın üretebileceği basit grafik verileri için alanlar
  chartsData?: {
    debtBreakdown?: Array<{ name: string; amount: number; color?: string }> // Borçların dağılımı (örn: konut, taşıt, ihtiyaç)
    expenseCategories?: Array<{ name: string; amount: number; color?: string }> // Harcama kategorileri (eğer kullanıcı giderlerini detaylı girerse)
    assetAllocation?: Array<{ name: string; value: number; color?: string }> // Varlık dağılımı
  }
}

// Refinansman Analizi Veri Yapısı
export interface RefinancingAnalysisData {
  overallAssessment: {
    refinancingPotential: "Yüksek" | "Orta" | "Düşük"
    totalPotentialSavings: number
    recommendedStrategy: string
    urgencyLevel: "Acil" | "Yüksek" | "Orta" | "Düşük"
    summary: string
  }

  individualCreditAnalysis: Array<{
    creditId: string
    bankName: string
    creditType: string
    currentSituation: {
      remainingDebt: number
      currentRate: number
      monthlyPayment: number
      remainingMonths: number
      totalRemainingInterest: number
    }
    refinancingOptions: Array<{
      optionName: string
      newRate: number
      newMonthlyPayment: number
      totalSavings: number
      monthlySavings: number
      feasibility: "Yüksek" | "Orta" | "Düşük"
      requirements: string[]
      timeline: string
      pros: string[]
      cons: string[]
    }>
    earlyPayoffAnalysis: {
      requiredAmount: number
      interestSavings: number
      breakEvenPoint: string
      recommendation: string
      fundingSources: string[]
    }
    priority: "Yüksek" | "Orta" | "Düşük"
    actionPlan: string[]
  }>

  consolidationAnalysis: {
    feasibility: string
    benefits: string[]
    consolidatedLoanAmount: number
    suggestedRate: number
    newMonthlyPayment: number
    totalSavings: number
    requirements: string[]
    risks: string[]
  }

  marketOpportunities: Array<{
    opportunity: string
    description: string
    impact: string
    timeline: string
    actionRequired: string
  }>

  riskAssessment: {
    refinancingRisks: Array<{
      risk: string
      probability: string
      impact: string
      mitigation: string
    }>
    overallRiskLevel: string
    riskMitigationPlan: string[]
  }

  actionPlan: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
    timeline: string
    expectedOutcome: string
  }

  alternativeStrategies: Array<{
    strategy: string
    description: string
    requiredAmount?: number
    expectedSavings?: number
    newMonthlyPayment?: number
    additionalCost?: number
    suitability: string
  }>
}

// BankingCredential tipini ekle
export type BankingCredential = {
  id: string
  user_id: string
  bank_id: string
  credential_name: string
  username: string | null
  encrypted_password: string | null
  credential_type: "internet_banking" | "mobile_banking" | "phone_banking" | "other"
  notes: string | null
  last_used_date: string | null
  password_change_frequency_days: number | null
  last_password_change_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Join fields
  bank_name?: string
  bank_logo_url?: string | null
}
