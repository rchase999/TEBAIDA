import React, { useState, useRef, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { Upload, FileText, Image, Film, Music, Archive, File, X, AlertCircle } from 'lucide-react';

export interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  error?: string;
}

export interface FileUploadProps {
  accept?: string;
  maxSize?: number; // bytes
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

let fileIdCounter = 0;

function getFileIcon(type: string): React.FC<{ className?: string }> {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('gz')) return Archive;
  if (type.includes('pdf') || type.includes('doc') || type.includes('text')) return FileText;
  return File;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  maxSize,
  multiple = false,
  onFiles,
  children,
  className,
  disabled = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const simulateProgress = useCallback((fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
      );
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const validFiles: File[] = [];
      const newUploadedFiles: UploadedFile[] = [];

      for (const file of files) {
        const id = `upload-${++fileIdCounter}`;
        let error: string | undefined;

        if (maxSize && file.size > maxSize) {
          error = `File exceeds ${formatSize(maxSize)} limit`;
        }

        if (accept) {
          const accepted = accept.split(',').map((a) => a.trim());
          const matches = accepted.some((a) => {
            if (a.startsWith('.')) {
              return file.name.toLowerCase().endsWith(a.toLowerCase());
            }
            if (a.endsWith('/*')) {
              return file.type.startsWith(a.replace('/*', '/'));
            }
            return file.type === a;
          });
          if (!matches) {
            error = `File type not accepted`;
          }
        }

        const entry: UploadedFile = { file, id, progress: error ? 0 : 0, error };
        newUploadedFiles.push(entry);

        if (!error) {
          validFiles.push(file);
        }
      }

      setUploadedFiles((prev) => {
        const next = multiple ? [...prev, ...newUploadedFiles] : newUploadedFiles;
        return next;
      });

      // Simulate progress for valid files
      newUploadedFiles.forEach((uf) => {
        if (!uf.error) {
          simulateProgress(uf.id);
        }
      });

      if (validFiles.length > 0) {
        onFiles(validFiles);
      }
    },
    [accept, maxSize, multiple, onFiles, simulateProgress],
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    dragCounterRef.current = 0;

    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label="Upload files"
        aria-disabled={disabled}
        className={clsx(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8',
          'transition-all duration-200 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
          disabled && 'opacity-50 cursor-not-allowed',
          dragOver
            ? 'border-forge-400 bg-forge-50/50 dark:border-forge-600 dark:bg-forge-900/10 scale-[1.01]'
            : 'border-gray-300 dark:border-surface-dark-4 hover:border-gray-400 dark:hover:border-surface-dark-4',
          !disabled && !dragOver && 'bg-white dark:bg-surface-dark-1',
          'motion-safe:transition-transform',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
        />

        {children || (
          <>
            <div
              className={clsx(
                'mb-3 rounded-full p-3',
                dragOver
                  ? 'bg-forge-100 dark:bg-forge-900/30'
                  : 'bg-gray-100 dark:bg-surface-dark-2',
                'transition-colors duration-200',
              )}
            >
              <Upload
                className={clsx(
                  'h-6 w-6',
                  dragOver
                    ? 'text-forge-500'
                    : 'text-gray-400 dark:text-gray-500',
                  'transition-colors duration-200',
                )}
              />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {dragOver ? 'Drop files here' : 'Click or drag files to upload'}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {accept && `Accepted: ${accept}`}
              {accept && maxSize && ' \u00B7 '}
              {maxSize && `Max size: ${formatSize(maxSize)}`}
            </p>
          </>
        )}
      </div>

      {/* File list */}
      {uploadedFiles.length > 0 && (
        <ul className="space-y-2" aria-label="Uploaded files">
          {uploadedFiles.map((uf) => {
            const Icon = getFileIcon(uf.file.type);
            const hasError = !!uf.error;
            const isComplete = uf.progress >= 100;

            return (
              <li
                key={uf.id}
                className={clsx(
                  'flex items-center gap-3 rounded-lg border p-3',
                  'motion-safe:animate-fade-in',
                  hasError
                    ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10'
                    : 'border-gray-200 bg-white dark:border-surface-dark-3 dark:bg-surface-dark-1',
                )}
              >
                <div
                  className={clsx(
                    'shrink-0 rounded-lg p-2',
                    hasError
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-gray-100 dark:bg-surface-dark-2',
                  )}
                >
                  {hasError ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {uf.file.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatSize(uf.file.size)}
                    </span>
                    {hasError && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {uf.error}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {!hasError && !isComplete && (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-surface-dark-3">
                      <div
                        className="h-full rounded-full bg-forge-500 transition-all duration-300 ease-out"
                        style={{ width: `${uf.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(uf.id);
                  }}
                  className={clsx(
                    'shrink-0 rounded-md p-1 text-gray-400 transition-colors',
                    'hover:bg-gray-100 hover:text-gray-600',
                    'dark:hover:bg-surface-dark-3 dark:hover:text-gray-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500',
                  )}
                  aria-label={`Remove ${uf.file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FileUpload;
