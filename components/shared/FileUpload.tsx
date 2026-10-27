"use client";

import React, { useState } from "react";
import { UploadCloud, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/formatters";

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export default function FileUpload({
  accept = ".pdf,.doc,.docx,.zip",
  maxSizeMB = 10,
  onFileSelect,
  label = "Upload file",
  description = "Drag & drop your file here, or browse",
  disabled = false,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (file: File) => {
    if (disabled) return;

    setError("");

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds limit of ${maxSizeMB}MB`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }

    // Allows selecting the same file again after clearing/retrying.
    e.target.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    if (disabled) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;

    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    if (disabled) return;

    setSelectedFile(null);
    setError("");
  };

  return (
    <div className="w-full space-y-2">
      {selectedFile ? (
        <div
          className={cn(
            "flex items-center justify-between rounded-xl border p-4",
            disabled
              ? "border-slate-200 bg-slate-50"
              : "border-blue-200 bg-blue-50/50",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                disabled
                  ? "bg-slate-100 text-slate-400"
                  : "bg-blue-100 text-blue-600",
              )}
            >
              <File className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedFile.name}
              </p>

              <p className="font-mono text-xs text-slate-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for
                AI analysis
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Remove selected file"
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              disabled
                ? "cursor-not-allowed text-slate-300"
                : "text-slate-400 hover:bg-white hover:text-slate-600",
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all",
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
              : "cursor-pointer bg-white",
            !disabled &&
              (dragActive
                ? "border-blue-500 bg-blue-50/50"
                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50/50"),
          )}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
            id="file-upload-input"
          />

          <label
            htmlFor="file-upload-input"
            className={cn(
              "flex flex-col items-center",
              disabled ? "cursor-not-allowed" : "cursor-pointer",
            )}
          >
            <div
              className={cn(
                "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl",
                disabled
                  ? "bg-slate-100 text-slate-400"
                  : "bg-blue-50 text-blue-600",
              )}
            >
              <UploadCloud className="h-6 w-6" />
            </div>

            <p className="mb-1 text-sm font-semibold text-slate-900">{label}</p>

            <p className="mb-4 text-xs text-slate-500">{description}</p>

            <Button
              size="sm"
              variant="outline"
              type="button"
              asChild
              disabled={disabled}
            >
              <span>Browse Files</span>
            </Button>

            <p className="mt-3 text-[11px] text-slate-400">
              Supports PDF, DOCX, ZIP up to {maxSizeMB}MB
            </p>
          </label>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
