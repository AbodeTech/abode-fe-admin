"use client"

import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminLog } from "./AdminLogsTable"
import {
  User,
  DollarSign,
  FileText,
  Home,
  Calendar,
  Hash,
  AlertCircle,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  Info
} from "lucide-react"

interface AdminLogMetadataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: AdminLog | null
}

// Humanize field names for better readability
const humanizeFieldName = (fieldName: string): string => {
  const fieldMap: Record<string, string> = {
    // User fields
    userId: "User ID",
    user: "User ID",
    id: "ID",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    phoneNumber: "Phone Number",
    adminEmail: "Admin Email",
    adminId: "Admin ID",

    // Financial fields
    amount: "Amount",
    amount_paid: "Amount Paid",
    new_amount: "New Wallet Balance",
    balance: "Balance",
    commission_balance: "Commission Balance",
    initial_payment: "Initial Payment",
    monthly_installment: "Monthly Installment",
    development_fee: "Development Fee",
    fullownerhsip_documentprice: "Document Fee",
    document_amount_paid: "Document Amount Paid",
    document_balance: "Document Balance",

    // Asset fields
    assetId: "Property ID",
    asset: "Property ID",
    asset_name: "Property Name",
    asset_location: "Property Location",
    asset_type: "Property Type",
    asset_price: "Property Price",
    asset_status: "Property Status",
    asset_description: "Property Description",
    asset_option: "Property Options",
    name_of_property: "Property Name",
    size: "Size (sqm)",
    number_of_units: "Number of Units",

    // Transaction fields
    transactionId: "Transaction ID",
    transaction_type: "Transaction Type",
    transferReference: "Transfer Reference (Paystack)",
    transfer_reference: "Transfer Reference (Paystack)",
    paystack_reference: "Payment Reference",
    admin_status: "Admin Status",
    status: "Status",

    // Verification fields
    kyc_verified: "KYC Verified",
    kyc_status: "KYC Status",
    bvn_verified: "BVN Verified",
    bvn_status: "BVN Status",

    // Referral fields
    referral_code: "Referral Code",
    referral_status: "Referral Status",
    referred_by: "Referred By",

    // User status fields
    is_suspended: "Account Suspended",
    suspension_reason: "Suspension Reason",
    suspended_at: "Suspended At",

    // Payment plan fields
    uniqueId: "Property Reference",
    unique_id: "Property Reference",
    payment_plan_status: "Payment Plan Status",
    duration: "Duration (Months)",
    months: "Duration (Months)",
    next_payment_date: "Next Payment Date",
    final_payment_date: "Final Payment Date",

    // Other fields
    reason: "Reason",
    decline_reason: "Decline Reason",
    type: "Type",
    statementsSent: "Statements Sent",
    failures: "Failed Deliveries",
    images: "Images",
    permissions: "Permissions",
    description: "Description",
    name: "Name",

    // Commission/Receipt fields
    commission_processed: "Commission Processed",
    commission_amount: "Commission Amount",
    receipt_sent: "Receipt Sent",
    contract_sent: "Contract Sent",
    last_statement_sent: "Last Statement Sent",

    // Dates
    approved_at: "Approved At",
    declined_at: "Declined At",
    timestamp: "Timestamp"
  }

  return fieldMap[fieldName] || fieldName.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// Get relative time (e.g., "2 hours ago")
const getRelativeTime = (date: Date | string): string => {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount)
}

const formatDate = (dateString: string | Date | number) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const formatValue = (value: any, isCurrency = false): string => {
  if (value === null || value === undefined) return 'Not Set'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (isCurrency && typeof value === 'number') return formatCurrency(value)
  if (value instanceof Date) return formatDate(value)
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

// Check if a field contains a user ID
const isUserId = (key: string): boolean => {
  return key.toLowerCase().includes('userid') ||
    key.toLowerCase() === 'user' ||
    (key.toLowerCase() === 'id' && key !== 'assetId' && key !== 'transactionId')
}

const MetadataField = ({
  icon: Icon,
  label,
  value,
  isCurrency = false,
  isLink = false,
  linkHref = ""
}: {
  icon: any
  label: string
  value: any
  isCurrency?: boolean
  isLink?: boolean
  linkHref?: string
}) => (
  <div className="flex items-start gap-4 py-3">
    <div className="mt-0.5 p-2 bg-muted rounded-md shrink-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      {isLink && linkHref ? (
        <Link
          href={linkHref}
          target="_blank"
          className="text-sm font-medium text-primary hover:text-primary/80 hover:underline wrap-break-word inline-flex items-center gap-1 transition-colors"
        >
          {formatValue(value, isCurrency)}
          <ExternalLink className="h-3 w-3" />
        </Link>
      ) : (
        <p className="text-sm font-medium text-foreground wrap-break-word">
          {formatValue(value, isCurrency)}
        </p>
      )}
      {!isLink && String(value).length > 20 && (
        <p className="text-xs text-muted-foreground mt-1.5 font-mono bg-muted/30 p-1.5 rounded-sm line-clamp-2 hover:line-clamp-none transition-all">{String(value)}</p>
      )}
    </div>
  </div>
)

const ComparisonField = ({
  icon: Icon,
  label,
  oldValue,
  newValue,
  isCurrency = false,
  isLink = false,
  linkHref = ""
}: {
  icon: any
  label: string
  oldValue: any
  newValue: any
  isCurrency?: boolean
  isLink?: boolean
  linkHref?: string
}) => {
  const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue)

  return (
    <div className="flex items-start gap-4 py-4 border-b border-border/50 last:border-0 relative">
      <div className="mt-0.5 p-2 bg-muted rounded-md flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">{label}</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-muted/20 p-3 rounded-lg border border-border/30">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 opacity-80">Before</p>
            <p className={`text-sm font-medium break-words ${hasChanged ? 'text-destructive/80 line-through decoration-destructive/30' : 'text-foreground/80'}`}>
              {formatValue(oldValue, isCurrency)}
            </p>
          </div>

          <div className="flex items-center justify-center bg-muted h-6 w-6 rounded-full mx-2 flex-shrink-0 text-muted-foreground">
            <ArrowRight className="h-3 w-3" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 opacity-80">After</p>
            {isLink && linkHref ? (
              <Link
                href={linkHref}
                target="_blank"
                className={`text-sm font-medium break-words inline-flex items-center gap-1 hover:underline transition-colors ${hasChanged ? 'text-green-600 hover:text-green-700 font-semibold' : 'text-foreground'}`}
              >
                {formatValue(newValue, isCurrency)}
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <p className={`text-sm font-medium break-words ${hasChanged ? 'text-green-600 font-semibold bg-green-500/10 inline-block px-1 -mx-1 rounded' : 'text-foreground'}`}>
                {formatValue(newValue, isCurrency)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Check if field should be highlighted (reason fields)
const isReasonField = (key: string): boolean => {
  return key.toLowerCase().includes('reason') || key.toLowerCase().includes('note')
}

const renderDataContent = (action: string, data: any) => {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <AlertCircle className="h-12 w-12 mb-3" />
        <p className="text-sm">No data available</p>
      </div>
    )
  }

  if (typeof data === 'object' && !Array.isArray(data)) {
    const entries = Object.entries(data)

    if (entries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mb-3" />
          <p className="text-sm">No data available</p>
        </div>
      )
    }

    // Group fields by category
    const reasonFields: [string, any][] = []
    const financialFields: [string, any][] = []
    const userFields: [string, any][] = []
    const statusFields: [string, any][] = []
    const otherFields: [string, any][] = []
    const idFields: [string, any][] = []

    entries.forEach(([key, value]) => {
      if (isReasonField(key)) {
        reasonFields.push([key, value])
      } else if (key.toLowerCase().includes('amount') ||
        key.toLowerCase().includes('balance') ||
        key.toLowerCase().includes('price') ||
        key.toLowerCase().includes('payment') ||
        key.toLowerCase().includes('fee')) {
        financialFields.push([key, value])
      } else if (key.toLowerCase().includes('user') ||
        key.toLowerCase().includes('email') ||
        key.toLowerCase().includes('phone') ||
        key.toLowerCase().includes('name') && !key.toLowerCase().includes('property')) {
        userFields.push([key, value])
      } else if (key.toLowerCase().includes('status') ||
        key.toLowerCase().includes('verified')) {
        statusFields.push([key, value])
      } else if (key.toLowerCase().includes('id') ||
        key.toLowerCase().includes('reference') ||
        key.toLowerCase() === '_id') {
        idFields.push([key, value])
      } else {
        otherFields.push([key, value])
      }
    })

    const renderFieldGroup = (fields: [string, any][], title: string) => {
      if (fields.length === 0) return null

      return (
        <div className="mb-6 last:mb-0">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">{title}</h4>
          <div className="space-y-3">
            {fields.map(([key, value]) => {
              const isCurrency = key.toLowerCase().includes('amount') ||
                key.toLowerCase().includes('balance') ||
                key.toLowerCase().includes('price') ||
                key.toLowerCase().includes('payment') ||
                key.toLowerCase().includes('fee')

              let Icon = FileText
              if (key.toLowerCase().includes('user') || key.toLowerCase().includes('admin')) Icon = User
              if (isCurrency) Icon = DollarSign
              if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) Icon = Calendar
              if (key.toLowerCase().includes('email')) Icon = Mail
              if (key.toLowerCase().includes('phone')) Icon = Phone
              if (key.toLowerCase().includes('asset') || key.toLowerCase().includes('property')) Icon = Home
              if (key.toLowerCase().includes('id') || key.toLowerCase().includes('reference')) Icon = Hash
              if (key.toLowerCase().includes('status') && value === 'approved') Icon = CheckCircle
              if (key.toLowerCase().includes('status') && (value === 'declined' || value === 'rejected')) Icon = XCircle

              // Check if this is a user ID field
              const userIdLink = isUserId(key) && typeof value === 'string' && value.length > 10
                ? `/admin/dashboard/user/${value}`
                : ""

              // Handle arrays specially
              if (Array.isArray(value)) {
                return (
                  <div key={key} className="border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{humanizeFieldName(key)}</p>
                    </div>
                    {value.length === 0 ? (
                      <p className="text-sm text-gray-500 ml-6">None</p>
                    ) : (
                      <div className="ml-6 space-y-2">
                        {value.map((item: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded text-xs">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <MetadataField
                  key={key}
                  icon={Icon}
                  label={humanizeFieldName(key)}
                  value={value}
                  isCurrency={isCurrency}
                  isLink={!!userIdLink}
                  linkHref={userIdLink}
                />
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Show reason fields prominently at the top if they exist */}
        {reasonFields.length > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong className="font-semibold">Admin Note:</strong>
              <div className="mt-1 space-y-1">
                {reasonFields.map(([key, value]) => (
                  <p key={key}>&quot;{value}&quot;</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {renderFieldGroup(financialFields, "💰 Financial Information")}
        {renderFieldGroup(userFields, "👤 User Information")}
        {renderFieldGroup(statusFields, "📊 Status Information")}
        {renderFieldGroup(otherFields, "📋 Other Details")}
      </div>
    )
  }

  // Fallback for non-object data
  return (
    <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-auto max-h-96 whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

const renderComparisonContent = (action: string, oldState: any, metadata: any) => {
  if (!oldState && !metadata) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <AlertCircle className="h-12 w-12 mb-3" />
        <p className="text-sm">No comparison data available</p>
      </div>
    )
  }

  // Get all unique keys from both objects
  const allKeys = new Set([
    ...Object.keys(oldState || {}),
    ...Object.keys(metadata || {})
  ])

  if (allKeys.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <AlertCircle className="h-12 w-12 mb-3" />
        <p className="text-sm">No fields to compare</p>
      </div>
    )
  }

  // Group fields
  const reasonFields: string[] = []
  const financialFields: string[] = []
  const userFields: string[] = []
  const statusFields: string[] = []
  const otherFields: string[] = []

  Array.from(allKeys).forEach((key) => {
    if (isReasonField(key)) {
      reasonFields.push(key)
    } else if (key.toLowerCase().includes('amount') ||
      key.toLowerCase().includes('balance') ||
      key.toLowerCase().includes('price')) {
      financialFields.push(key)
    } else if (isUserId(key) ||
      key.toLowerCase().includes('email') ||
      key.toLowerCase().includes('phone')) {
      userFields.push(key)
    } else if (key.toLowerCase().includes('status') ||
      key.toLowerCase().includes('verified')) {
      statusFields.push(key)
    } else {
      otherFields.push(key)
    }
  })

  const renderComparisonGroup = (fields: string[], title: string) => {
    if (fields.length === 0) return null

    return (
      <div className="mb-6 last:mb-0">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">{title}</h4>
        <div className="space-y-1">
          {fields.map((key) => {
            const oldValue = oldState?.[key]
            const newValue = metadata?.[key]

            // Skip complex objects and arrays for comparison
            if (typeof oldValue === 'object' && oldValue !== null && !Array.isArray(oldValue)) return null
            if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) return null

            const isCurrency = key.toLowerCase().includes('amount') ||
              key.toLowerCase().includes('balance') ||
              key.toLowerCase().includes('price') ||
              key.toLowerCase().includes('payment')

            let icon = FileText
            if (key.toLowerCase().includes('user') || key.toLowerCase().includes('admin')) icon = User
            if (isCurrency) icon = DollarSign
            if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) icon = Calendar
            if (key.toLowerCase().includes('email')) icon = Mail
            if (key.toLowerCase().includes('phone')) icon = Phone
            if (key.toLowerCase().includes('asset') || key.toLowerCase().includes('property')) icon = Home
            if (key.toLowerCase().includes('id') || key.toLowerCase().includes('reference')) icon = Hash
            if (key.toLowerCase().includes('status')) icon = CheckCircle

            const userIdLink = isUserId(key) && typeof newValue === 'string' && newValue.length > 10
              ? `/admin/dashboard/user/${newValue}`
              : ""

            return (
              <ComparisonField
                key={key}
                icon={icon}
                label={humanizeFieldName(key)}
                oldValue={oldValue}
                newValue={newValue}
                isCurrency={isCurrency}
                isLink={!!userIdLink}
                linkHref={userIdLink}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Show reason fields prominently */}
      {reasonFields.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900">
            <strong className="font-semibold">Admin Note:</strong>
            <div className="mt-1">
              {reasonFields.map((key) => (
                <p key={key}>&quot;{metadata?.[key] || oldState?.[key]}&quot;</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {renderComparisonGroup(financialFields, "💰 Financial Changes")}
      {renderComparisonGroup(userFields, "👤 User Changes")}
      {renderComparisonGroup(statusFields, "📊 Status Changes")}
      {renderComparisonGroup(otherFields, "📋 Other Changes")}
    </div>
  )
}

export function AdminLogMetadataModal({ open, onOpenChange, log }: AdminLogMetadataModalProps) {
  if (!log) return null

  const getActionBadgeStyle = (action: string) => {
    const actionLower = action.toLowerCase()

    if (actionLower.includes("create") || actionLower.includes("approve") || actionLower.includes("add")) {
      return "bg-black text-white border-black"
    } else if (actionLower.includes("delete") || actionLower.includes("decline") || actionLower.includes("remove")) {
      return "bg-gray-800 text-white border-gray-800"
    } else if (actionLower.includes("update") || actionLower.includes("edit") || actionLower.includes("modify")) {
      return "bg-gray-600 text-white border-gray-600"
    } else {
      return "bg-gray-200 text-black border-gray-300"
    }
  }

  const hasOldState = log.oldState && Object.keys(log.oldState).length > 0
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0
  const showComparison = hasOldState && hasMetadata

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/40 backdrop-blur-sm transition-all duration-300">
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden border-border bg-card shadow-2xl rounded-xl">
          <DialogHeader className="p-6 border-b border-border/50 bg-muted/20">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Activity Details</DialogTitle>
                <DialogDescription className="text-[15px] font-medium text-muted-foreground leading-relaxed max-w-[90%]">
                  {log.description}
                </DialogDescription>
              </div>
              <Badge className={`${getActionBadgeStyle(log.action || "")} text-xs px-3 py-1 font-semibold uppercase tracking-wider`}>
                {log.action}
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-140px)] p-6">
            <div className="space-y-8 pb-4">
              {/* Log Information */}
              <div className="bg-muted/40 border border-border/60 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-foreground tracking-wide mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Operator Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <MetadataField icon={Mail} label="Admin Account" value={log.adminEmail} />
                  <MetadataField icon={Hash} label="Admin ID" value={log.adminId} />
                </div>
                <div className="mt-2 border-t border-border/50 pt-2">
                  <MetadataField icon={Calendar} label="Timestamp" value={`${formatDate(log.timestamp)} (${getRelativeTime(log.timestamp)})`} />
                </div>
              </div>

              {/* Tabs for Metadata and Old State */}
              {showComparison ? (
                <Tabs defaultValue="comparison" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
                    <TabsTrigger value="comparison" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Changes Made</TabsTrigger>
                    <TabsTrigger value="new" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">After Action</TabsTrigger>
                    <TabsTrigger value="old" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Before Action</TabsTrigger>
                  </TabsList>

                  <TabsContent value="comparison" className="mt-6 focus-visible:outline-none">
                    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3">
                        <div className="p-1.5 bg-muted rounded">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-[15px] font-bold text-foreground">Changes Summary</h3>
                      </div>
                      <div className="pl-1">
                        {renderComparisonContent(log.action || "", log.oldState, log.metadata)}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="new" className="mt-6 focus-visible:outline-none">
                    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3">
                        <div className="p-1.5 bg-muted rounded">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-[15px] font-bold text-foreground">New State (After Action)</h3>
                      </div>
                      <div className="pl-1">
                        {renderDataContent(log.action || "", log.metadata)}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="old" className="mt-6 focus-visible:outline-none">
                    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3">
                        <div className="p-1.5 bg-muted rounded">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-[15px] font-bold text-foreground">Previous State (Before Action)</h3>
                      </div>
                      <div className="pl-1">
                        {renderDataContent(log.action || "", log.oldState)}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <>
                  {/* Just Metadata */}
                  {hasMetadata && (
                    <div className="mt-6">
                      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3">
                          <div className="p-1.5 bg-muted rounded">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <h3 className="text-[15px] font-bold text-foreground">Action Details</h3>
                        </div>
                        <div className="pl-1">
                          {renderDataContent(log.action || "", log.metadata)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Just Old State */}
                  {hasOldState && !hasMetadata && (
                    <div className="mt-6">
                      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-3">
                          <div className="p-1.5 bg-muted rounded">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <h3 className="text-[15px] font-bold text-foreground">Previous State</h3>
                        </div>
                        <div className="pl-1">
                          {renderDataContent(log.action || "", log.oldState)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No data at all */}
                  {!hasMetadata && !hasOldState && (
                    <div className="bg-card border border-border/60 rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
                      <div className="p-3 bg-muted/50 rounded-full mb-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No additional payload attached.</p>
                      <p className="text-xs text-muted-foreground mt-1">This action was performed without tracking any specific state transition data.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  )
}
