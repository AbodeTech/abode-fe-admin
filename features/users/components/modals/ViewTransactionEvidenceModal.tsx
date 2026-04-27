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
  const isImage = useMemo(() => !image?.toLowerCase().endsWith(".pdf"), [image])

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
        <DialogContent className="max-w-md">
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              Transaction Evidence
            </div>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>

              {/* Rotate Control */}
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>

              {/* Download Control */}
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>

              {/* Reset Control */}
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 p-6 pt-4 overflow-hidden">
          <ScrollArea className="h-[60vh] w-full border rounded-md bg-muted/20">
            <div className="flex items-center justify-center min-h-full p-4">
              <div
                className="relative transition-transform duration-200 ease-in-out"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center",
                }}
              >
                {isImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image}
                    alt="Transaction Evidence"
                    className="max-w-full h-auto rounded-lg shadow-sm border border-border"
                    style={{ maxHeight: "100%" }}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image.replace(".pdf", ".webp")}
                    alt="PDF Preview"
                    className="w-[600px] h-[800px] object-contain rounded-lg shadow-sm border border-border"
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
