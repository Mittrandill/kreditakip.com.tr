// lib/api/financials.ts

import { executeQuery } from "@/lib/db"

export async function getFinancialData(ticker: string) {
  try {
    const results = await executeQuery(
      `
      SELECT *
      FROM financials
      WHERE ticker = ?
    `,
      [ticker],
    )

    return results
  } catch (error) {
    throw new Error(`Failed to fetch financial data for ${ticker}`)
  }
}

export async function createFinancialData(
  ticker: string,
  year: number,
  revenue: number,
  netIncome: number,
  eps: number,
) {
  try {
    const results = await executeQuery(
      `
      INSERT INTO financials (ticker, year, revenue, net_income, eps)
      VALUES (?, ?, ?, ?, ?)
    `,
      [ticker, year, revenue, netIncome, eps],
    )

    return results
  } catch (error) {
    throw new Error(`Failed to create financial data for ${ticker}`)
  }
}

export async function updateFinancialData(
  ticker: string,
  year: number,
  revenue: number,
  netIncome: number,
  eps: number,
) {
  try {
    const results = await executeQuery(
      `
      UPDATE financials
      SET revenue = ?, net_income = ?, eps = ?
      WHERE ticker = ? AND year = ?
    `,
      [revenue, netIncome, eps, ticker, year],
    )

    return results
  } catch (error) {
    throw new Error(`Failed to update financial data for ${ticker}`)
  }
}

export async function deleteFinancialData(ticker: string, year: number) {
  try {
    const results = await executeQuery(
      `
      DELETE FROM financials
      WHERE ticker = ? AND year = ?
    `,
      [ticker, year],
    )

    return results
  } catch (error) {
    throw new Error(`Failed to delete financial data for ${ticker}`)
  }
}
