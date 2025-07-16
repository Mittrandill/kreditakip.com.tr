import { executeGraphql } from "@/lib/graphql"
import {
  RefinancingAnalysisCreateDocument,
  RefinancingAnalysisGetByIdDocument,
  RefinancingAnalysisUpdateDocument,
  RefinancingAnalysesGetListDocument,
  RefinancingAnalysisDeleteDocument,
} from "@/graphql/generated"

export const getRefinancingAnalyses = async () => {
  try {
    const graphqlResponse = await executeGraphql({
      query: RefinancingAnalysesGetListDocument,
      variables: {},
    })

    if (!graphqlResponse.data) {
      throw new Error("Failed to fetch refinancing analyses")
    }

    return graphqlResponse.data.refinancingAnalyses
  } catch (error) {
    throw new Error(`Failed to fetch refinancing analyses: ${error}`)
  }
}

export const getRefinancingAnalysis = async (id: string) => {
  try {
    const graphqlResponse = await executeGraphql({
      query: RefinancingAnalysisGetByIdDocument,
      variables: { id },
    })

    if (!graphqlResponse.data) {
      throw new Error(`Failed to fetch refinancing analysis with id ${id}`)
    }

    return graphqlResponse.data.refinancingAnalysis
  } catch (error) {
    throw new Error(`Failed to fetch refinancing analysis with id ${id}: ${error}`)
  }
}

export const createRefinancingAnalysis = async (payload: {
  userId: string
  currentLoanBalance: number
  currentInterestRate: number
  newInterestRate: number
  loanTerm: number
}) => {
  try {
    const graphqlResponse = await executeGraphql({
      query: RefinancingAnalysisCreateDocument,
      variables: {
        ...payload,
      },
    })

    if (!graphqlResponse.data) {
      throw new Error("Failed to create refinancing analysis")
    }

    return graphqlResponse.data.refinancingAnalysisCreate
  } catch (error) {
    throw new Error(`Failed to create refinancing analysis: ${error}`)
  }
}

export const updateRefinancingAnalysis = async (
  id: string,
  payload: {
    userId?: string
    currentLoanBalance?: number
    currentInterestRate?: number
    newInterestRate?: number
    loanTerm?: number
  },
) => {
  try {
    const graphqlResponse = await executeGraphql({
      query: RefinancingAnalysisUpdateDocument,
      variables: {
        id,
        ...payload,
      },
    })

    if (!graphqlResponse.data) {
      throw new Error(`Failed to update refinancing analysis with id ${id}`)
    }

    return graphqlResponse.data.refinancingAnalysisUpdate
  } catch (error) {
    throw new Error(`Failed to update refinancing analysis with id ${id}: ${error}`)
  }
}

export const deleteRefinancingAnalysis = async (id: string) => {
  try {
    const graphqlResponse = await executeGraphql({
      query: RefinancingAnalysisDeleteDocument,
      variables: { id },
    })

    if (!graphqlResponse.data) {
      throw new Error(`Failed to delete refinancing analysis with id ${id}`)
    }

    return graphqlResponse.data.refinancingAnalysisDelete
  } catch (error) {
    throw new Error(`Failed to delete refinancing analysis with id ${id}: ${error}`)
  }
}
