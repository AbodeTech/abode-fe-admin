"use client"

import { useState, useCallback } from "react"
import { useDropzone, FileRejection } from "react-dropzone"
import { Upload, X, FileText, Image as ImageIcon, AlertCircle } from "lucide-react"

interface FileUploadError {
  fileName: string
  message: string
}

export interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  maxSize?: number
  accept?: Record<string, string[]>
  label?: string
  maxFiles?: number
}

export function FileUpload({
  onFilesChange,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  },
  label = "Attachments (Optional)",
  maxFiles = 5
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<FileUploadError[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const availableSlots = maxFiles - files.length;
      const filesToAdd = acceptedFiles.slice(0, availableSlots);

      const newFiles = [...files, ...filesToAdd];
      setFiles(newFiles)
      onFilesChange(newFiles)

      // Clear previous errors
      setErrors([])

      // Handle rejected files with inline error messages
      if (fileRejections.length > 0) {
        const newErrors = fileRejections.map((rejection) => ({
          fileName: rejection.file.name,
          message: rejection.errors[0].code === 'file-too-large'
            ? `File is too large. Max size is ${maxSize / 1024 / 1024}MB.`
            : rejection.errors[0].code === 'file-invalid-type'
              ? 'File type not supported.'
              : rejection.errors[0].message
        }))
        setErrors(newErrors)
      }

      if (acceptedFiles.length > availableSlots) {
        setErrors(prev => [...prev, { fileName: "Limit Exceeded", message: `You can only upload a maximum of ${maxFiles} files.` }]);
      }
    },
    [files, onFilesChange, maxSize, maxFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    maxFiles: maxFiles - files.length
  })

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    onFilesChange(newFiles)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5" />
    }
    return <FileText className="h-5 w-5" />
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${isDragActive
            ? "border-cyan-500 bg-cyan-50"
            : "border-gray-300 hover:border-cyan-500 hover:bg-gray-50"
          }`}
      >
        <input {...getInputProps()} />
        <Upload className={`h-12 w-12 mx-auto mb-3 ${isDragActive ? 'text-cyan-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700 mb-1">
          {isDragActive ? "Drop the files here..." : label}
        </p>
        <p className="text-xs text-gray-500">
          {isDragActive ? "Release to drop" : "Drag 'n' drop files here, or click to select"}
        </p>
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{error.fileName}</p>
                <p className="text-xs text-red-600">{error.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Files to Upload ({files.length})</p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
