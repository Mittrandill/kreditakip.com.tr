import { type NextRequest, NextResponse } from "next/server"

interface RefinancingAnalysisRequest {
  currentMortgageRate: number
  currentLoanBalance: number
  newMortgageRate: number
  refinancingCosts: number
  yearsToRecoup: number
}

export async function POST(req: NextRequest) {
  try {
    const body: RefinancingAnalysisRequest = await req.json()

    const { currentMortgageRate, currentLoanBalance, newMortgageRate, refinancingCosts, yearsToRecoup } = body

    if (!currentMortgageRate || !currentLoanBalance || !newMortgageRate || !refinancingCosts || !yearsToRecoup) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Monthly interest rate calculation
    const currentMonthlyRate = currentMortgageRate / 100 / 12
    const newMonthlyRate = newMortgageRate / 100 / 12

    // Loan term in months (assuming 30 years = 360 months)
    const loanTermMonths = 360

    // Monthly payment calculation
    const currentMonthlyPayment =
      (currentLoanBalance * currentMonthlyRate) / (1 - Math.pow(1 + currentMonthlyRate, -loanTermMonths))

    const newMonthlyPayment =
      (currentLoanBalance * newMonthlyRate) / (1 - Math.pow(1 + newMonthlyRate, -loanTermMonths))

    // Monthly savings
    const monthlySavings = currentMonthlyPayment - newMonthlyPayment

    // Breakeven point calculation
    const breakevenPoint = refinancingCosts / monthlySavings

    const shouldRefinance = breakevenPoint <= yearsToRecoup * 12

    return NextResponse.json({
      monthlySavings,
      breakevenPoint,
      shouldRefinance,
    })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
