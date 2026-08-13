"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, RotateCw, FileText, ImageIcon, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ViewTransactionEvidenceProps {
  image?: string;
  trigger: React.ReactNode;
}

export function ViewTransactionEvidence({ image, trigger }: ViewTransactionEvidenceProps) {
  const isImageFile = useMemo(
    () => !!image && !image.toLowerCase().endsWith(".pdf"),
    [image]
  );

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setZoom(1);
      setRotation(0);
      setImageError(false);
      setImageLoading(true);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image;
    link.download = `transaction-evidence-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const dialogShellClass =
    "flex max-h-[min(92dvh,900px)] w-[min(100vw-1rem,56rem)] max-w-[calc(100vw-1rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl";

  // No image case
  if (!image) {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 shrink-0" />
              Transaction Evidence
            </DialogTitle>
          </DialogHeader>
          <Card className="border border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No Evidence Available</h3>
              <p className="text-center text-gray-600">
                No transaction evidence has been uploaded for this transaction.
              </p>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={dialogShellClass}>
        <DialogHeader className="shrink-0 space-y-0 border-b px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex min-w-0 flex-col gap-3 pr-8 sm:flex-row sm:items-center sm:justify-between sm:pr-10">
            <DialogTitle className="flex min-w-0 items-center gap-2 text-left text-base leading-tight sm:text-lg">
              {isImageFile ? (
                <ImageIcon className="h-5 w-5 shrink-0" />
              ) : (
                <FileText className="h-5 w-5 shrink-0" />
              )}
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

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden p-2 sm:p-4">
          <div className="flex h-full max-h-[min(75dvh,720px)] min-h-48 w-full min-w-0 touch-pan-x touch-pan-y overflow-auto overscroll-contain">
            <div className="m-auto flex min-h-min min-w-0 items-center justify-center p-2 sm:p-4">
              {imageError ? (
                <Card className="max-w-md border border-gray-200">
                  <CardContent className="flex flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
                    <AlertCircle className="mb-4 h-12 w-12 text-yellow-500" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">Unable to Load</h3>
                    <p className="mb-4 text-center text-sm text-gray-600">
                      The file could not be displayed. Try opening or downloading it.
                    </p>
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Open / Download
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div
                  className="relative max-w-full transition-transform duration-200 ease-in-out"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                >
                  {imageLoading && (
                    <div className="flex min-h-[200px] min-w-[200px] items-center justify-center rounded-lg bg-gray-100 p-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
                    </div>
                  )}
                  {isImageFile ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt="Transaction Evidence"
                      className="max-h-[min(70dvh,800px)] w-auto max-w-[min(100%,calc(100vw-3rem))] rounded-lg border border-gray-200 object-contain shadow-lg sm:max-w-full"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                      style={{ display: imageLoading ? "none" : "block" }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.replace(".pdf", ".webp")}
                      alt="PDF Preview"
                      className="max-h-[min(75dvh,800px)] w-full max-w-[min(100%,calc(100vw-3rem))] rounded-lg border border-gray-200 object-contain shadow-lg sm:max-w-[min(100%,600px)]"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                      style={{ display: imageLoading ? "none" : "block" }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
