import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per image
const MAX_IMAGES = 5;

export default function ReviewImageUploader({ images = [], onChange, maxImages = MAX_IMAGES }) {
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    setErrorMsg('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > maxImages) {
      setErrorMsg(`You can upload a maximum of ${maxImages} images per review.`);
      return;
    }

    const newImageUrls = [...images];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorMsg(`File '${file.name}' is not supported. Please select JPG, PNG, WEBP, or GIF.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMsg(`File '${file.name}' exceeds the maximum allowed size of 10MB.`);
        return;
      }

      // Convert file to Data URL for instant persistent rendering
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          onChange([...newImageUrls, reader.result]);
          newImageUrls.push(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setErrorMsg('');
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-typography-primary">
            Upload Product Photos <span className="text-typography-muted font-normal">(Optional, max {maxImages})</span>
          </label>
          <p className="text-[11px] text-typography-secondary">
            Show off your harvest or package condition! First photo becomes the main review image.
          </p>
        </div>

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-forest-700" />
            <span>Add Photos</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
          {images.map((imgUrl, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-surface-border bg-surface-white aspect-square">
              <img
                src={imgUrl}
                alt={`Customer review upload ${idx + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 bg-forest-900/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow-md"
                title="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-4 border-2 border-dashed border-surface-border rounded-xl bg-surface-cream/50 text-center cursor-pointer hover:border-forest-500 hover:bg-surface-cream transition-all flex flex-col items-center justify-center gap-1.5"
        >
          <ImageIcon className="w-6 h-6 text-typography-muted" />
          <span className="text-xs font-medium text-typography-secondary">
            Drag & drop or click to attach customer product photos
          </span>
          <span className="text-[10px] text-typography-muted">Supports JPG, PNG, WEBP up to 10MB</span>
        </div>
      )}
    </div>
  );
}
