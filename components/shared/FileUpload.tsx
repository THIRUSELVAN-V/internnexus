'use client';

import React, { useState } from 'react';
import { UploadCloud, File, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/formatters';

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  label?: string;
  description?: string;
}

export default function FileUpload({
  accept = '.pdf,.doc,.docx,.zip',
  maxSizeMB = 10,
  onFileSelect,
  label = 'Upload file',
  description = 'Drag & drop your file here, or browse',
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (file: File) => {
    setError('');
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds limit of ${maxSizeMB}MB`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-2">
      {selectedFile ? (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <File className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 font-mono">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for AI analysis
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
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
            'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer bg-white',
            dragActive
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
          )}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
            id="file-upload-input"
          />
          <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">{label}</p>
            <p className="text-xs text-slate-500 mb-4">{description}</p>
            <Button size="sm" variant="outline" type="button" asChild>
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
