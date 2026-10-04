import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { adminApi } from '../api';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

export default function LocalImageUploader({ productId, onUploadSuccess, onImageSelected }) {
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of { file, previewUrl, id }
  const [errorMsg, setErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    setErrorMsg('');
    setSuccessMsg('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newFileEntries = [];
    let error = '';

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        error = `File format '${file.name}' is not supported. Please select JPG, PNG, WEBP, or GIF.`;
        break;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        error = `File '${file.name}' exceeds maximum allowed size of 10MB.`;
        break;
      }

      const previewUrl = URL.createObjectURL(file);
      newFileEntries.push({
        id: 'file_' + Math.random().toString(36).substring(2, 9),
        file,
        previewUrl,
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
      });

      // Immediately convert first file to Data URL for onImageSelected callback
      if (onImageSelected && file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            onImageSelected(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    if (error) {
      setErrorMsg(error);
      return;
    }

    setSelectedFiles((prev) => [...prev, ...newFileEntries]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (idToRemove) => {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  const handleUploadAll = async () => {
    if (!selectedFiles.length || isUploading) return;

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setUploadProgress(10);

    try {
      const uploadedMediaItems = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const item = selectedFiles[i];
        
        // Convert file to Data URL for persistent rendering
        const dataUrl = await new Promise((resolve) => {
          if (item.file) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(item.file);
          } else {
            resolve(item.previewUrl);
          }
        });

        const formData = {
          productId: productId || null,
          mediaUrl: dataUrl,
          mediaType: 'IMAGE',
          role: 'GALLERY',
          isPrimary: i === 0,
          displayOrder: i,
        };

        if (productId) {
          try {
            const res = await adminApi.addMedia(formData);
            uploadedMediaItems.push(res?.data?.data || formData);
          } catch (apiErr) {
            uploadedMediaItems.push(formData);
          }
        } else {
          uploadedMediaItems.push(formData);
        }
        
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      setSuccessMsg(`Successfully added ${selectedFiles.length} image(s) to product gallery.`);
      
      // Clean up object URLs
      selectedFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setSelectedFiles([]);
      setUploadProgress(0);

      if (onUploadSuccess) {
        onUploadSuccess(uploadedMediaItems);
      }
      if (onImageSelected && uploadedMediaItems.length > 0) {
        onImageSelected(uploadedMediaItems[0].mediaUrl);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload selected images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-5 bg-surface-cream rounded-2xl border border-surface-border space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm text-typography-primary flex items-center gap-2">
            <Upload className="w-4 h-4 text-forest-700" /> Local Image Upload with Pre-Upload Preview
          </h4>
          <p className="text-xs text-typography-secondary">
            Select high-resolution JPG, PNG, WEBP, or GIF images from your device.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-2"
        >
          <ImageIcon className="w-4 h-4" /> Select Images
        </button>
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
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pre-Upload Image Previews */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-typography-primary flex items-center justify-between">
            <span>Selected Images ({selectedFiles.length})</span>
            <span className="text-typography-muted text-[11px]">Previewing locally before server upload</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {selectedFiles.map((item) => (
              <div key={item.id} className="relative group rounded-xl overflow-hidden border border-surface-border bg-surface-white p-2 space-y-1">
                <div className="h-28 rounded-lg overflow-hidden bg-forest-900/5 relative flex items-center justify-center">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(item.id)}
                    disabled={isUploading}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow-md"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[11px] truncate font-medium text-typography-primary">{item.name}</div>
                <div className="text-[10px] text-typography-muted font-mono">{item.sizeKb} KB</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                setSelectedFiles([]);
              }}
              disabled={isUploading}
              className="btn-secondary text-xs font-bold px-4 py-2"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={handleUploadAll}
              disabled={isUploading}
              className="btn-primary text-xs font-bold px-5 py-2 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading ({uploadProgress}%)
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Confirm & Upload {selectedFiles.length} Image(s)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
