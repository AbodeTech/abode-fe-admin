"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, ZoomIn, ZoomOut, RotateCw, FileText, ImageIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ViewTransactionEvidenceModalProps {
  image?: string
  trigger: React.ReactNode
}

export function ViewTransactionEvidenceModal({ image, trigger }: ViewTransactionEvidenceModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [open, setOpen] = useState(false)
  const isImage = useMemo(() => !!image && !image.toLowerCase().endsWith(".pdf"), [image])

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
  }

  const handleDownload = () => {
    if (!image) return
    const link = document.createElement("a")
    link.href = image
    link.download = `transaction-evidence-${Date.now()}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setZoom(1)
      setRotation(0)
    }
    setOpen(nextOpen)
  }

  if (!image) {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transaction Evidence
            </DialogTitle>
          </DialogHeader>
          <Card className="border border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Evidence Available</h3>
              <p className="text-muted-foreground text-center">
                No transaction evidence has been uploaded for this transaction.
              </p>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[min(92dvh,900px)] w-[calc(100vw-1rem)] max-w-4xl min-w-0 flex-col gap-0 overflow-hidden p-0 sm:w-[min(100vw-2rem,56rem)]">
        <DialogHeader className="shrink-0 space-y-0 border-b px-3 py-3 sm:px-6 sm:pb-4 sm:pt-6">
          <div className="flex min-w-0 flex-col gap-3 pr-8 sm:flex-row sm:items-center sm:justify-between sm:pr-10">
            <DialogTitle className="flex min-w-0 items-center gap-2 text-left text-base leading-tight sm:text-lg">
              {isImage ? <ImageIcon className="h-5 w-5 shrink-0" /> : <FileText className="h-5 w-5 shrink-0" />}
              <span className="min-w-0 wrap-break-word">Transaction Evidence</span>
            </DialogTitle>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleZoomOut} disabled={zoom <= 0.5} aria-label="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="min-w-12 shrink-0 text-center text-xs font-medium tabular-nums sm:text-sm">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleZoomIn} disabled={zoom >= 3} aria-label="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleRotate} aria-label="Rotate">
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleDownload} aria-label="Download">
                <Download className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" className="h-9 shrink-0 px-2 text-xs sm:px-3 sm:text-sm" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden p-2 sm:p-6 sm:pt-4">
          <ScrollArea className="h-[min(70dvh,640px)] w-full min-w-0 rounded-md border bg-muted/20">
            <div className="flex min-h-[min(70dvh,640px)] min-w-0 items-center justify-center p-2 sm:p-4">
              <div
                className="relative max-w-full transition-transform duration-200 ease-in-out"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              >
                {isImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image}
                    alt="Transaction Evidence"
                    className="max-h-[min(65dvh,800px)] w-auto max-w-[min(100%,calc(100vw-3rem))] rounded-lg border border-border object-contain shadow-sm sm:max-w-full"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image.replace(".pdf", ".webp")}
                    alt="PDF Preview"
                    className="max-h-[min(75dvh,800px)] w-full max-w-[min(100%,calc(100vw-3rem))] rounded-lg border border-border object-contain shadow-sm sm:max-w-[min(100%,600px)]"
                  />
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
