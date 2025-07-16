import type { AxiosInstance } from "axios"

interface RiskAnalysis {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  // Add other properties as needed
}

export const getRiskAnalyses = async (
  axiosInstance: AxiosInstance,
  page = 1,
  limit = 10,
  searchTerm = "",
): Promise<{ data: RiskAnalysis[]; total: number }> => {
  try {
    const response = await axiosInstance.get("/risk-analyses", {
      params: {
        page,
        limit,
        searchTerm,
      },
    })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch risk analyses")
  }
}

export const getRiskAnalysisById = async (axiosInstance: AxiosInstance, id: string): Promise<RiskAnalysis> => {
  try {
    const response = await axiosInstance.get(`/risk-analyses/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch risk analysis")
  }
}

export const createRiskAnalysis = async (
  axiosInstance: AxiosInstance,
  data: Omit<RiskAnalysis, "id" | "createdAt" | "updatedAt">,
): Promise<RiskAnalysis> => {
  try {
    const response = await axiosInstance.post("/risk-analyses", data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to create risk analysis")
  }
}

export const updateRiskAnalysis = async (
  axiosInstance: AxiosInstance,
  id: string,
  data: Partial<Omit<RiskAnalysis, "id" | "createdAt" | "updatedAt">>,
): Promise<RiskAnalysis> => {
  try {
    const response = await axiosInstance.put(`/risk-analyses/${id}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update risk analysis")
  }
}

export const deleteRiskAnalysis = async (axiosInstance: AxiosInstance, id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/risk-analyses/${id}`)
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to delete risk analysis")
  }
}
