/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { format as formatDateFn } from 'date-fns'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { downloadSalesData } from '../hooks/use-sales-export'
import { SalesFilters } from '@/features/sales'
// @ts-ignore
import { Parser } from 'json2csv'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Settings2,
  GripVertical,
  ChevronDown,
  X,
  RotateCcw,
  Save,
  FolderOpen,
  Trash2,
  Star,
  Clock,
  ArrowRight,
  LayoutTemplate,
  Search
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// --- Types & Constants ---

const STORAGE_KEYS = {
  TEMPLATES: 'sales_export_templates',
  LAST_USED: 'sales_export_last_used',
  DEFAULT_TEMPLATE: 'sales_export_default_template',
}

interface ExportTemplate {
  id: string
  name: string
  columnOrder: string[]
  format: ExportFormat
  createdAt: string
  updatedAt: string
}

const FIELD_CONFIG = {
  customer: {
    label: 'Customer Information',
    color: 'bg-blue-100 text-blue-700',
    fields: {
      id: { label: 'ID', default: true },
      name: { label: 'Customer Name', default: true },
      email: { label: 'Email', default: true },
      phone: { label: 'Phone', default: true },
    }
  },
  referrer: {
    label: 'Referrer Information',
    color: 'bg-indigo-100 text-indigo-700',
    fields: {
      referrer_name: { label: 'Referrer Name', default: false },
      referrer_email: { label: 'Referrer Email', default: false },
      referrer_phone: { label: 'Referrer Phone', default: false },
    }
  },
  asset: {
    label: 'Asset Details',
    color: 'bg-purple-100 text-purple-700',
    fields: {
      assetName: { label: 'Asset Name', default: true },
      assetType: { label: 'Asset Type', default: true },
      unitsBought: { label: 'Units Bought', default: true },
      size: { label: 'Size', default: true },
      total_size: { label: 'Total Size', default: false },
    }
  },
  pricing: {
    label: 'Pricing & Payments',
    color: 'bg-emerald-100 text-emerald-700',
    fields: {
      price: { label: 'Price', default: true },
      amountPaid: { label: 'Amount Paid', default: true },
      landBalance: { label: 'Land Balance', default: true },
    }
  },
  documents: {
    label: 'Document Fees',
    color: 'bg-teal-100 text-teal-700',
    fields: {
      documentPrice: { label: 'Document Price', default: false },
      documentAmountPaid: { label: 'Document Amount Paid', default: false },
      documentBalance: { label: 'Document Balance', default: false },
    }
  },
  totals: {
    label: 'Totals & Summary',
    color: 'bg-green-100 text-green-700',
    fields: {
      totalAssetValue: { label: 'Total Asset Value', default: false },
      totalPaid: { label: 'Total Paid', default: false },
      totalBalance: { label: 'Total Balance', default: true },
    }
  },
  dates: {
    label: 'Dates & Subscription',
    color: 'bg-orange-100 text-orange-700',
    fields: {
      month_subscription: { label: 'Subscription Month', default: false },
      startDate: { label: 'Start Date', default: true },
      endDate: { label: 'End Date', default: true },
    }
  },
  status: {
    label: 'Status',
    color: 'bg-rose-100 text-rose-700',
    fields: {
      defaulted: { label: 'Defaulted', default: true },
      terminated: { label: 'Terminated', default: true },
    }
  },
}

// Flatten fields for easy lookup
const ALL_FIELDS: Record<string, { label: string; category: string; color?: string }> = {}
Object.entries(FIELD_CONFIG).forEach(([categoryKey, category]) => {
  Object.entries(category.fields).forEach(([fieldKey, fieldConfig]) => {
    // @ts-ignore
    ALL_FIELDS[fieldKey] = {
      // @ts-ignore
      label: fieldConfig.label,
      category: category.label,
      color: category.color
    }
  })
})

const getDefaultFieldOrder = (): string[] => {
  const order: string[] = []
  Object.values(FIELD_CONFIG).forEach(category => {
    Object.entries(category.fields).forEach(([key, config]) => {
      // @ts-ignore
      if (config.default) order.push(key)
    })
  })
  return order
}

type ExportFormat = 'csv' | 'xlsx' | 'json' | 'tsv'

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
  { value: 'csv', label: 'CSV (.csv)', icon: <FileText className="h-4 w-4" /> },
  { value: 'xlsx', label: 'Excel (.xlsx)', icon: <FileSpreadsheet className="h-4 w-4" /> },
  { value: 'json', label: 'JSON (.json)', icon: <FileJson className="h-4 w-4" /> },
  { value: 'tsv', label: 'TSV (.tsv)', icon: <FileText className="h-4 w-4" /> },
]

const PRESETS: Record<string, { label: string; fields: string[] }> = {
  basic: {
    label: 'Basic Info',
    fields: ['id', 'name', 'email', 'phone', 'assetName', 'price', 'amountPaid', 'totalBalance']
  },
  financial: {
    label: 'Financial Report',
    fields: ['id', 'name', 'assetName', 'price', 'amountPaid', 'landBalance', 'documentPrice', 'documentAmountPaid', 'documentBalance', 'totalAssetValue', 'totalPaid', 'totalBalance']
  },
  complete: {
    label: 'All Fields',
    fields: Object.values(FIELD_CONFIG).flatMap(cat => Object.keys(cat.fields))
  },
  referrals: {
    label: 'Referral Report',
    fields: ['id', 'name', 'email', 'referrer_name', 'referrer_email', 'referrer_phone', 'assetName', 'totalPaid']
  },
}

// --- Storage Helpers ---
const getStoredTemplates = (): ExportTemplate[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

const saveTemplatesToStorage = (templates: ExportTemplate[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates))
}

const getDefaultTemplateId = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.DEFAULT_TEMPLATE)
}

const setDefaultTemplateId = (id: string | null) => {
  if (typeof window === 'undefined') return
  if (id) localStorage.setItem(STORAGE_KEYS.DEFAULT_TEMPLATE, id)
  else localStorage.removeItem(STORAGE_KEYS.DEFAULT_TEMPLATE)
}

const saveLastUsedConfig = (columnOrder: string[], format: ExportFormat) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.LAST_USED, JSON.stringify({ columnOrder, format }))
}

const getLastUsedConfig = (): { columnOrder: string[]; format: ExportFormat } | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_USED)
    return stored ? JSON.parse(stored) : null
  } catch { return null }
}

// --- Sub-components ---

const SortableItem = ({ id, label, category, color, onRemove, index }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border rounded-lg mb-2 group transition-all",
        isDragging && "shadow-xl ring-2 ring-primary rotate-1"
      )}
    >
      <div
        className="cursor-grab hover:bg-muted p-1.5 rounded-md touch-none text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 rounded">{index + 1}</span>
          <span className="font-medium text-sm truncate">{label}</span>
        </div>
        <span className={cn("text-[10px] w-fit px-1.5 py-0.5 rounded mt-1 font-medium", color || 'bg-gray-100')}>
          {category}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(id)}
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

// --- Main Component ---

export function SalesExport({ filters }: { filters: SalesFilters }) {
  const { user } = useAuthStore()
  const role = user?.role

  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [columnOrder, setColumnOrder] = useState<string[]>(getDefaultFieldOrder())
  const [activeTab, setActiveTab] = useState('select')
  const [fieldSearch, setFieldSearch] = useState('')

  // Template state
  const [templates, setTemplates] = useState<ExportTemplate[]>([])
  const [defaultTemplateId, setDefaultTemplateIdState] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<ExportTemplate | null>(null)
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null)

  const currentTemplate = useMemo(() =>
    templates.find(t => t.id === currentTemplateId),
    [templates, currentTemplateId]
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const storedTemplates = getStoredTemplates()
    setTemplates(storedTemplates)
    const defaultId = getDefaultTemplateId()
    setDefaultTemplateIdState(defaultId)

    if (defaultId) {
      const defaultTemplate = storedTemplates.find(t => t.id === defaultId)
      if (defaultTemplate) {
        setColumnOrder(defaultTemplate.columnOrder)
        setFormat(defaultTemplate.format)
        setCurrentTemplateId(defaultTemplate.id)
        return
      }
    }
    const lastUsed = getLastUsedConfig()
    if (lastUsed) {
      setColumnOrder(lastUsed.columnOrder)
      setFormat(lastUsed.format)
    }
  }, [])

  const matchingTemplate = useMemo(() => {
    return templates.find(t =>
      t.format === format &&
      JSON.stringify(t.columnOrder) === JSON.stringify(columnOrder)
    )
  }, [templates, format, columnOrder])

  // --- Logic Helpers (Formatting/Processing) ---
  const formatDate = (dateString: any) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return formatDateFn(date, 'yyyy/MM/dd')
  }

  const processRecord = (record: any, index: number) => {
    // ... [Same logic as original code for processing fields] ...
    // Keeping logic identical to preserve business rules
    const unitsBought = Number(record.no_of_units) || 0
    const size = Number(record.size) || 0
    const price = Number(record.price) || 0
    const amountPaid = Number(record.amount_paid) || 0
    const documentPrice = Number(record.fullownerhsip_documentprice) || 0
    const documentAmountPaid = Number(record.document_amount_paid) || 0
    const landPrice = Number(record.fullownerhsip_landprice ?? record.price) || 0

    const fullRecord: Record<string, any> = {
      id: index + 1,
      name: `${record.user_firstName} ${record.user_lastName}` || 'No Name',
      email: record.email || 'No Email',
      phone: record.user_phone || 'No Phone',
      referrer_name: record.referrer_name || 'No Referrer',
      referrer_email: record.referrer_email || 'No Referrer Email',
      referrer_phone: record.referrer_phone || 'No Referrer Phone',
      assetName: record.asset_name || 'No Asset',
      assetType: record.asset_type || 'No Asset Type',
      unitsBought,
      size,
      total_size: size * unitsBought,
      price,
      amountPaid,
      landBalance: price - amountPaid,
      documentPrice,
      documentAmountPaid,
      documentBalance: documentPrice - documentAmountPaid,
      totalAssetValue: landPrice + documentPrice,
      totalPaid: amountPaid + documentAmountPaid,
      totalBalance: (price - amountPaid) + (documentPrice - documentAmountPaid),
      month_subscription: record.month_subscription || '',
      startDate: formatDate(record.start_date),
      endDate: formatDate(record.next_date),
      defaulted: Number(record.default_amount) > 0 ? 'Yes' : 'No',
      terminated: record.is_suspended ? 'Yes' : 'No',
    }

    const orderedRecord: Record<string, any> = {}
    columnOrder.forEach(field => {
      if (field in fullRecord) orderedRecord[field] = fullRecord[field]
    })
    return orderedRecord
  }

  // --- Download Logic ---
  const downloadFile = (data: any[], filename: string) => {
    const timestamp = new Date().toISOString().split('T')[0]
    const baseFilename = `${filename}_${timestamp}`

    switch (format) {
      case 'csv': {
        const parser = new Parser({ fields: columnOrder })
        const csv = parser.parse(data)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        saveAs(blob, `${baseFilename}.csv`)
        break
      }
      case 'xlsx': {
        const worksheet = XLSX.utils.json_to_sheet(data, { header: columnOrder })
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report')
        const colWidths = columnOrder.map(field => ({
          wch: Math.max(ALL_FIELDS[field]?.label.length || field.length, 12)
        }))
        worksheet['!cols'] = colWidths
        XLSX.writeFile(workbook, `${baseFilename}.xlsx`)
        break
      }
      case 'json': {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' })
        saveAs(blob, `${baseFilename}.json`)
        break
      }
      case 'tsv': {
        const parser = new Parser({ fields: columnOrder, delimiter: '\t' })
        const tsv = parser.parse(data)
        const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8;' })
        saveAs(blob, `${baseFilename}.tsv`)
        break
      }
    }
    saveLastUsedConfig(columnOrder, format)
  }

  const mutation = useMutation({
    mutationFn: downloadSalesData,
    onSuccess: (response: any) => {
      const data = response?.getSalesRecord?.data
      if (!data || data.length === 0) {
        toast.error('No data available for download')
        return
      }
      const processedData = data.map((record: any, index: number) => processRecord(record, index))
      downloadFile(processedData, 'salesReport')
      toast.success('Download Successful')
      setOpen(false)
    },
    onError: () => { toast.error('Download failed. Please try again.') }
  })

  // --- Template Management ---
  const generateId = () => `template_${Date.now()}`

  const saveTemplate = (name: string, isUpdate = false) => {
    const now = new Date().toISOString()
    if (isUpdate && editingTemplate) {
      const updated = templates.map(t => t.id === editingTemplate.id ? { ...t, name, columnOrder, format, updatedAt: now } : t)
      setTemplates(updated)
      saveTemplatesToStorage(updated)
      setCurrentTemplateId(editingTemplate.id)
      toast.success('Template updated')
    } else {
      const newT = { id: generateId(), name, columnOrder, format, createdAt: now, updatedAt: now }
      const updated = [...templates, newT]
      setTemplates(updated)
      saveTemplatesToStorage(updated)
      setCurrentTemplateId(newT.id)
      toast.success('Template saved')
    }
    setSaveDialogOpen(false)
    setTemplateName('')
    setEditingTemplate(null)
  }

  const deleteTemplate = (template: ExportTemplate) => {
    const updated = templates.filter(t => t.id !== template.id)
    setTemplates(updated)
    saveTemplatesToStorage(updated)
    if (defaultTemplateId === template.id) setDefaultTemplateId(null)
    if (currentTemplateId === template.id) setCurrentTemplateId(null)
    toast.success('Template deleted')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
      setCurrentTemplateId(null)
    }
  }

  // --- Field Toggles ---
  const toggleField = (field: string) => {
    setColumnOrder(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field])
    setCurrentTemplateId(null)
  }

  const toggleCategory = (categoryKey: string) => {
    const category = FIELD_CONFIG[categoryKey as keyof typeof FIELD_CONFIG]
    const catFields = Object.keys(category.fields)
    const allSelected = catFields.every(f => columnOrder.includes(f))
    setColumnOrder(prev => allSelected ? prev.filter(f => !catFields.includes(f)) : [...prev, ...catFields.filter(f => !prev.includes(f))])
    setCurrentTemplateId(null)
  }

  const handleDownload = () => {
    if (columnOrder.length === 0) {
      toast.error('Select at least one field')
      return
    }
    mutation.mutate({
      payload: filters
    })
  }

  if (role !== 'admin') return null

  return (
    <div className="flex justify-end mb-3 mt-5 gap-2">
      <Button
        variant="outline"
        onClick={handleDownload}
        disabled={mutation.isPending}
      >
        <Download className="mr-2 h-4 w-4" />
        Quick Download
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="default">
            <Settings2 className="mr-2 h-4 w-4" />
            Custom Export
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-7xl! h-[85vh] flex flex-col p-0 gap-0 w-[800px]!">

          {/* Header */}
          <div className="px-6 py-4 border-b bg-muted/20">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold flex items-center gap-3">
                  Export Data
                  {currentTemplate && (
                    <Badge variant="secondary" className="font-normal text-xs gap-1">
                      <LayoutTemplate className="h-3 w-3" />
                      {currentTemplate.name}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Customize your report columns and formatting.
                </DialogDescription>
              </div>

              {/* Template Toolbar */}
              <div className="flex items-center gap-2 bg-background border rounded-lg p-1 shadow-sm">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Templates</span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Saved Reports</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {templates.length === 0 ? (
                      <div className="p-3 text-sm text-center text-muted-foreground">No templates saved yet</div>
                    ) : (
                      templates.map(t => (
                        <div key={t.id} className="flex items-center group">
                          <DropdownMenuItem className="flex-1 gap-2 cursor-pointer" onClick={() => {
                            setColumnOrder(t.columnOrder)
                            setFormat(t.format)
                            setCurrentTemplateId(t.id)
                            toast.success(`Loaded ${t.name}`)
                          }}>
                            {defaultTemplateId === t.id && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                            <span className="truncate">{t.name}</span>
                          </DropdownMenuItem>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 mr-1 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTemplate(t);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-4 w-px bg-border mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setEditingTemplate(currentTemplate || null);
                    setTemplateName(currentTemplate?.name || '');
                    setSaveDialogOpen(true);
                  }}
                >
                  <Save className="h-3.5 w-3.5 mr-2" />
                  {currentTemplate ? 'Update' : 'Save As'}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-2 border-b flex items-center justify-between bg-background">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="select">1. Select Fields ({columnOrder.length})</TabsTrigger>
                <TabsTrigger value="arrange">2. Arrange Order</TabsTrigger>
              </TabsList>

              {/* Format Selector */}
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground">Format:</Label>
                <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2 text-sm">{opt.icon} {opt.label}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tab 1: Select Fields */}
            <TabsContent value="select" className="flex-1 overflow-hidden flex-col m-0 p-0 data-[state=active]:flex">
              <div className="p-4 border-b bg-muted/10 space-y-3">
                {/* Search & Presets */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search fields..."
                      className="pl-8 h-9"
                      value={fieldSearch}
                      onChange={(e) => setFieldSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 items-center overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Quick Sets:</span>
                    {Object.entries(PRESETS).map(([key, preset]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs whitespace-nowrap"
                        onClick={() => {
                          setColumnOrder([...preset.fields])
                          setCurrentTemplateId(null)
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-6 pb-10">
                  {Object.entries(FIELD_CONFIG).map(([catKey, category]) => {
                    // @ts-ignore
                    const fields = category.fields as Record<string, { label: string }>;
                    const matchingFields = Object.keys(fields).filter(key =>
                      fields[key].label.toLowerCase().includes(fieldSearch.toLowerCase())
                    );

                    if (matchingFields.length === 0 && fieldSearch) return null;

                    const allSelected = matchingFields.every(f => columnOrder.includes(f));

                    return (
                      <div key={catKey} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={catKey}
                            checked={allSelected}
                            onCheckedChange={() => toggleCategory(catKey)}
                          />
                          <Label htmlFor={catKey} className="font-semibold text-sm flex items-center gap-2 cursor-pointer">
                            {category.label}
                            <Badge variant="secondary" className={cn("text-[10px] h-5 px-1.5 font-normal pointer-events-none", category.color)}>
                              {matchingFields.length} fields
                            </Badge>
                          </Label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-6">
                          {matchingFields.map(fieldKey => (
                            <div
                              key={fieldKey}
                              className={cn(
                                "flex items-center space-x-2 p-2 rounded-md border transition-colors cursor-pointer hover:bg-muted/50",
                                columnOrder.includes(fieldKey) ? "border-primary/50 bg-primary/5" : "border-transparent bg-muted/20"
                              )}
                              onClick={() => toggleField(fieldKey)}
                            >
                              <Checkbox
                                id={fieldKey}
                                checked={columnOrder.includes(fieldKey)}
                                className="pointer-events-none" // let div handle click
                              />
                              <Label htmlFor={fieldKey} className="text-sm cursor-pointer pointer-events-none">
                                {fields[fieldKey].label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Arrange */}
            <TabsContent value="arrange" className="flex-1 overflow-hidden flex-col m-0 p-0 data-[state=active]:flex">
              <div className="flex-1 flex flex-col md:flex-row h-full">
                {/* List Area */}
                <div className="flex-1 flex flex-col border-r bg-muted/10 min-h-0">
                  <div className="p-3 border-b flex justify-between items-center bg-background/50 backdrop-blur">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Drag to Reorder</span>
                    <Button variant="ghost" size="sm" onClick={() => setColumnOrder(getDefaultFieldOrder())} className="h-7 text-xs">
                      <RotateCcw className="mr-1 h-3 w-3" /> Reset
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 h-full min-h-0 p-3">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
                        {columnOrder.map((field, index) => (
                          <SortableItem
                            key={field}
                            id={field}
                            index={index}
                            label={ALL_FIELDS[field]?.label || field}
                            category={ALL_FIELDS[field]?.category}
                            color={ALL_FIELDS[field]?.color}
                            onRemove={toggleField}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </ScrollArea>
                </div>

                {/* Preview Area (Visual Spreadsheet) */}
                <div className="hidden md:flex md:w-1/2 flex-col bg-slate-50">
                  <div className="p-4 border-b bg-white">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      File Preview
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">This is how your columns will appear in the final file.</p>
                  </div>
                  <div className="flex-1 p-6 overflow-auto">
                    {columnOrder.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <LayoutTemplate className="h-10 w-10 mb-2 opacity-20" />
                        <p>No columns selected</p>
                      </div>
                    ) : (
                      <div className="bg-white border rounded-md shadow-sm overflow-hidden">
                        {/* Mock Header */}
                        <div className="flex border-b bg-slate-100 divide-x">
                          <div className="w-10 p-2 text-xs font-bold text-center text-slate-400">#</div>
                          <div className="flex-1 flex overflow-x-auto divide-x no-scrollbar">
                            {columnOrder.map((col) => (
                              <div key={col} className="px-4 py-2 text-xs font-bold text-slate-700 whitespace-nowrap min-w-[100px] bg-slate-50">
                                {ALL_FIELDS[col]?.label}
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Mock Rows */}
                        {[1, 2, 3].map(row => (
                          <div key={row} className="flex border-b last:border-0 divide-x hover:bg-slate-50">
                            <div className="w-10 p-2 text-xs text-center text-slate-400">{row}</div>
                            <div className="flex-1 flex overflow-x-auto divide-x no-scrollbar">
                              {columnOrder.map((col) => (
                                <div key={col} className="px-4 py-2 text-xs text-slate-400 whitespace-nowrap min-w-[100px]">
                                  ---
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="px-6 py-4 border-t bg-background z-10">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDownload}
              disabled={columnOrder.length === 0 || mutation.isPending}
              className="w-32"
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2"><Clock className="animate-spin h-4 w-4" /> Processing</span>
              ) : (
                <span className="flex items-center gap-2">Export <ArrowRight className="h-4 w-4" /></span>
              )}
            </Button>
          </DialogFooter>

          {/* Save Template Nested Dialog */}
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Update Template' : 'Save New Template'}</DialogTitle>
                <DialogDescription>Save your current column configuration for future use.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Monthly Finance Report"
                    autoFocus
                  />
                </div>
                <div className="bg-muted p-3 rounded-md text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fields selected:</span>
                    <span className="font-medium">{columnOrder.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format:</span>
                    <span className="font-medium uppercase">{format}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => saveTemplate(templateName, !!editingTemplate)} disabled={!templateName.trim()}>Save Template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </DialogContent>
      </Dialog>
    </div>
  )
}