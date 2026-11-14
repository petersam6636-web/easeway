
"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, RefreshCw, LoaderCircle } from "lucide-react";

interface SchoolLogoUploadProps {
  value: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading: boolean;
  uploadError: string;
}

export default function SchoolLogoUpload({
  value,
  onUpload,
  onRemove,
  isUploading,
  uploadError,
}: SchoolLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file?: File) => {
    if (!file || isUploading) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must not exceed 5MB.");
      return;
    }

    onUpload(file);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);

    handleFile(event.dataTransfer.files?.[0]);
  };

  const removeImage = () => {
    onRemove();
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">
          School Logo
          <span className="ml-1 font-normal text-slate-400">
            (Optional)
          </span>
        </label>

        {value && (
          <button
            type="button"
            onClick={removeImage}
            disabled={isUploading}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-red-500 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={14} />
            Remove
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleInputChange}
        disabled={isUploading}
        className="hidden"
      />

      {value ? (
        <div className="group relative flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-blue-300 hover:shadow-md">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-slate-50">
            <img
              src={value}
              alt="School logo preview"
              className="h-full w-full rounded-full object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">
              School logo
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Your logo is ready to use.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-blue-700 transition-colors hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={13} />
              Change image
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();

            if (
              !event.currentTarget.contains(
                event.relatedTarget as Node
              )
            ) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading) {
              fileInputRef.current?.click();
            }
          }}
          onKeyDown={(event) => {
            if (
              !isUploading &&
              (event.key === "Enter" || event.key === " ")
            ) {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={isUploading ? -1 : 0}
          aria-label="Upload school logo by clicking or dragging an image here"
          className={`group flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center outline-none transition-all duration-300 ease-out ${
            isUploading
              ? "cursor-wait border-blue-300 bg-blue-50/50"
              : isDragging
                ? "scale-[1.01] cursor-pointer border-blue-500 bg-blue-50 shadow-md"
                : "cursor-pointer border-slate-200 bg-slate-50/50 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-sm focus-visible:border-blue-500"
          }`}
        >
          <div
            className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
              isUploading || isDragging
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-700 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white"
            }`}
          >
            {isUploading ? (
              <LoaderCircle size={23} className="animate-spin" />
            ) : (
              <ImagePlus size={23} strokeWidth={1.8} />
            )}
          </div>

          <p className="text-sm font-semibold text-slate-800">
            {isUploading
              ? "Uploading your school logo..."
              : isDragging
                ? "Drop your logo here"
                : "Drag and drop your logo"}
          </p>

          <p className="mt-1.5 text-xs text-slate-500">
            {isUploading
              ? "Please wait while we upload your image."
              : isDragging
                ? "Release to upload your image"
                : "or click anywhere here to browse"}
          </p>

          {!isUploading && (
            <p className="mt-3 text-[11px] text-slate-400">
              PNG, JPG, JPEG or WEBP · Maximum 5MB
            </p>
          )}
        </div>
      )}

      {(error || uploadError) && (
        <p className="text-xs font-medium text-red-500">
          {error || uploadError}
        </p>
      )}
    </div>
  );
}
