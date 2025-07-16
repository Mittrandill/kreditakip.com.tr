import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Define the schema for the risk analysis input
const riskAnalysisSchema = z.object({
  loanAmount: z.number().positive(),
  interestRate: z.number().positive(),
  loanTerm: z.number().positive(),
  creditScore: z.number().positive(),
  debtToIncomeRatio: z.number().positive(),
})

type RiskAnalysisInput = z.infer<typeof riskAnalysisSchema>

// Function to perform risk analysis (replace with your actual logic)
function performRiskAnalysis(data: RiskAnalysisInput): { riskScore: number; riskLevel: string } {
  // Placeholder risk analysis logic
  let riskScore =
    data.loanAmount * (data.interestRate / 100) * data.loanTerm +
    (1000 - data.creditScore) +
    data.debtToIncomeRatio * 100

  // Normalize the risk score
  riskScore = Math.max(0, riskScore / 10000) // Ensure riskScore is not negative
  riskScore = Math.min(1, riskScore) // Ensure riskScore is not greater than 1

  let riskLevel: string
  if (riskScore < 0.3) {
    riskLevel = "Low"
  } else if (riskScore < 0.6) {
    riskLevel = "Medium"
  } else {
    riskLevel = "High"
  }

  return { riskScore, riskLevel }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsedData: RiskAnalysisInput = riskAnalysisSchema.parse(body)

    const analysisResult = performRiskAnalysis(parsedData)

    return NextResponse.json({ result: analysisResult }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
