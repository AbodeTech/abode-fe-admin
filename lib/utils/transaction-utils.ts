import { format } from "date-fns"

// Format date
export const formatDate = (date: string | number | Date | null | undefined): string => {
  if (!date) return "N/A"

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date"
  }

  // Matching legacy format: "21 Jan 2026, 10:30 PM"
  return format(parsedDate, "dd MMM yyyy, hh:mm a")
}

// Format amount
export const formatAmount = (amount: string | number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(amount))
}

// Parse commission description
export const parseCommissionDescription = (description: string | null | undefined) => {
  if (!description) {
    return { isCommission: false, description: "", assetType: null, clientName: null, vatAmount: null, balance: null }
  }

  try {
    // Check if it's a commission description format
    if (!description.startsWith("Commission:")) {
      return { isCommission: false, description }
    }

    // Remove "Commission: " prefix
    const cleanDescription = description.substring("Commission: ".length)

    // Initialize variables with default values
    let assetType = "flex" // Default asset type is "flex"
    let clientName: string | null = null
    let vatAmount: string | null = null
    let balance: string | null = null

    // Check if description contains "by" to extract client name
    if (cleanDescription.includes(" by ")) {
      // Extract asset type and client name
      assetType = cleanDescription.split(" by ")[0].trim()

      // Extract client name
      if (cleanDescription.includes(" with VAT: ") || cleanDescription.includes(" with WHT:")) {
        // Format: "asset type by client name with VAT: amount & Balance at Transaction: amount"
        clientName = cleanDescription.split(" by ")[1].split(" with ")[0].trim()

        // Extract VAT amount if available
        const vatMatch = description.match(/VAT: (\d+\.?\d*)/)
        const whtMatch = description.match(/WHT: (\d+\.?\d*)/)
        vatAmount = vatMatch ? vatMatch[1] : whtMatch ? whtMatch[1] : null

        // Extract balance if available
        const balanceMatch = description.match(/Balance at Transaction: (\d+\.?\d*)/)
        balance = balanceMatch ? balanceMatch[1] : null
      } else {
        // Format: "asset type by client name" (without VAT and Balance)
        clientName = cleanDescription.split(" by ")[1].trim()
      }
    }

    return {
      isCommission: true,
      description,
      assetType,
      clientName,
      vatAmount,
      balance,
    }
  } catch (error) {
    console.error("Error parsing commission description:", error)
    // Return default values if parsing fails
    return {
      isCommission: true,
      description,
      assetType: "flex",
      clientName: null,
      vatAmount: null,
      balance: null,
    }
  }
}

// Get status badge color
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "success":
      return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200"
    case "failed":
    case "declined":
      return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
  }
}

// Get type badge color
export const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "admin":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200"
    case "commission":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200"
    case "debit":
      return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
    case "credit":
      return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
    case "asset":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
  }
}

// Get transaction type badge color
export const getTransactionTypeColor = (transactionType: string) => {
  switch (transactionType.toLowerCase()) {
    case "transfer":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200"
    case "wallet":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200"
    case "paystack":
      return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
  }
}
