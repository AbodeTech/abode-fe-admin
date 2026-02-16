"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, RotateCw, FileText, ImageIcon, AlertCircle, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ViewTransactionEvidenceProps {
  image?: string;
  trigger: React.ReactNode;
}

export function ViewTransactionEvidence({ image, trigger }: ViewTransactionEvidenceProps) {
  const [isImage, setIsImage] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (image) {
      const isPdf = image.toLowerCase().endsWith(".pdf");
      setIsImage(!isPdf);
      setImageError(false);
      setImageLoading(true);
    }
  }, [image]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (image) {
      window.open(image, "_blank");
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // No image case
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
          <Card className="border border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Evidence Available</h3>
              <p className="text-gray-600 text-center">
                No transaction evidence has been uploaded for this transaction.
              </p>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              Transaction Evidence
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-4 min-h-0">
          <div className="h-full w-full overflow-auto flex items-center justify-center">
            <div className="p-4">
              {imageError ? (
                <Card className="border border-gray-200">
                  <CardContent className="flex flex-col items-center justify-center py-12 px-8">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Image</h3>
                    <p className="text-gray-600 text-center mb-4">
                      The image could not be loaded. Click below to open in a new tab.
                    </p>
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div
                  className="relative transition-transform duration-200 ease-in-out"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: "center",
                  }}
                >
                  {imageLoading && (
                    <div className="flex items-center justify-center bg-gray-100 rounded-lg p-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  )}
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt="Transaction Evidence"
                      className="max-w-full max-h-[60vh] h-auto rounded-lg shadow-lg border border-gray-200 object-contain"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                      style={{ display: imageLoading ? "none" : "block" }}
                    />
                  ) : (
                    <div className="w-[600px] h-[500px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      <iframe
                        src={image}
                        className="w-full h-full"
                        title="Transaction Evidence PDF"
                      />
                    </div>
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
