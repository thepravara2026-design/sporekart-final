import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, Plus, Edit2, Trash2, Eye, EyeOff, Upload, Link as LinkIcon, 
  CheckCircle2, AlertCircle, Loader2, Sparkles, RefreshCw, X, ArrowUp, ArrowDown,
  GraduationCap, MapPin, Users, Calendar, Move
} from 'lucide-react';
import { trainingApi } from '../api';

const DEFAULT_LOCATION = "Basapura village, Behind Taralabalu school, Davangere-577001";

export default function AdminTrainingGalleryManager() {
  const [glimpses, setGlimpses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form & Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadTab, setUploadTab] = useState('local'); // 'local' | 'url'

  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    imageUrl: '',
    courseTitle: '',
    eventDate: '',
    location: DEFAULT_LOCATION,
    attendeeCount: 30,
    displayOrder: 1,
    active: true
  });

  const fileInputRef = useRef(null);

  const fetchGlimpses = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await trainingApi.getAdminGlimpses();
      if (res?.data?.data) {
        setGlimpses(res.data.data);
      } else if (Array.isArray(res?.data)) {
        setGlimpses(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch glimpses:', err);
      setErrorMsg('Failed to load training glimpses from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlimpses();
  }, []);

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      caption: '',
      imageUrl: '',
      courseTitle: '',
      eventDate: '',
      location: DEFAULT_LOCATION,
      attendeeCount: 30,
      displayOrder: glimpses.length + 1,
      active: true
    });
    setUploadTab('local');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      title: item.title || '',
      caption: item.caption || '',
      imageUrl: item.imageUrl || '',
      courseTitle: item.courseTitle || '',
      eventDate: item.eventDate || '',
      location: item.location || DEFAULT_LOCATION,
      attendeeCount: item.attendeeCount || 30,
      displayOrder: item.displayOrder || 1,
      active: item.active !== false
    });
    setUploadTab(item.imageUrl?.startsWith('data:') ? 'local' : 'url');
    setShowModal(true);
  };

  const handleLocalFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10 MB limit
      setErrorMsg('Image file size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
        setSuccessMsg(`Selected file "${file.name}" ready for upload.`);
        setErrorMsg('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('Please enter a title for the glimpse.');
      return;
    }
    if (!formData.imageUrl.trim()) {
      setErrorMsg('Please select an image file or provide an image URL.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        ...formData,
        attendeeCount: Number(formData.attendeeCount) || 0,
        displayOrder: Number(formData.displayOrder) || 1
      };

      const res = await trainingApi.saveGlimpse(payload);
      if (res?.data?.success) {
        setSuccessMsg(editingItem ? 'Glimpse updated successfully!' : 'New glimpse added successfully!');
        setTimeout(() => {
          setShowModal(false);
          fetchGlimpses();
        }, 600);
      } else {
        throw new Error(res?.data?.message || 'Failed to save glimpse');
      }
    } catch (err) {
      console.error('Failed to save glimpse:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Error saving training glimpse.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const updated = { ...item, active: !item.active };
      const res = await trainingApi.saveGlimpse(updated);
      if (res?.data?.success) {
        setGlimpses(prev => prev.map(g => g.id === item.id ? { ...g, active: !item.active } : g));
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to change glimpse status.');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete training glimpse "${title}"?`)) {
      return;
    }

    try {
      const res = await trainingApi.deleteGlimpse(id);
      if (res?.data?.success) {
        setGlimpses(prev => prev.filter(g => g.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete glimpse:', err);
      alert('Failed to delete glimpse.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-forest-950 p-6 sm:p-8 rounded-hero text-white shadow-level-2 border border-forest-700/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700/40 text-forest-200 text-xs font-semibold border border-forest-600/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Landing Page Training Glimpse Gallery
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">Workshop & Training Glimpse Manager</h2>
            <p className="text-forest-200 text-xs sm:text-sm max-w-2xl">
              Upload photos from local storage or URLs, manage captions, batch titles, and auto-sliding order for workshop highlights displayed live on the landing page.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchGlimpses}
              disabled={loading}
              className="p-2.5 rounded-xl bg-forest-800/80 hover:bg-forest-700 text-white transition border border-forest-600/50"
              title="Refresh Gallery"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-forest-950 font-bold text-sm shadow-md transition transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Add New Glimpse
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="w-10 h-10 text-forest-700 animate-spin" />
          <p className="text-sm font-medium text-typography-secondary">Loading workshop glimpses...</p>
        </div>
      ) : glimpses.length === 0 ? (
        <div className="bg-surface-white rounded-2xl p-12 text-center border border-surface-border space-y-4">
          <div className="w-16 h-16 rounded-full bg-forest-50 flex items-center justify-center mx-auto text-forest-700">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-typography-primary">No Training Glimpses Found</h3>
            <p className="text-xs text-typography-secondary max-w-md mx-auto">
              Add your first glimpse photo from local storage to display live auto-sliding workshop photos on your landing page.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-700 text-white font-semibold text-sm hover:bg-forest-800 transition"
          >
            <Plus className="w-4 h-4" /> Upload First Glimpse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {glimpses.map((item) => (
            <div
              key={item.id}
              className={`bg-surface-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-level-1 hover:shadow-level-2 ${
                item.active ? 'border-surface-border' : 'border-amber-200 bg-amber-50/20 opacity-75'
              }`}
            >
              {/* Image Preview Box */}
              <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden group">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-amber-300 text-xs font-mono font-bold">
                    #{item.displayOrder || 1}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold backdrop-blur-md flex items-center gap-1 ${
                      item.active
                        ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-900/80 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {item.active ? 'Active' : 'Hidden'}
                  </span>
                </div>

                {item.attendeeCount > 0 && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1">
                    <Users className="w-3 h-3 text-amber-400" /> {item.attendeeCount} Trainees
                  </div>
                )}
              </div>

              {/* Body Info */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-forest-700">
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.courseTitle || 'Mushroom Cultivation Masterclass'}</span>
                  </div>
                  <h3 className="font-bold text-base text-typography-primary leading-snug line-clamp-1">
                    {item.title}
                  </h3>
                  {item.caption && (
                    <p className="text-xs text-typography-secondary line-clamp-2 leading-relaxed">
                      {item.caption}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-surface-border text-xs text-typography-muted space-y-1">
                  {item.location && (
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-forest-600 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}
                  {item.eventDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{item.eventDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-surface-border flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(item)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition border flex items-center gap-1.5 ${
                    item.active
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-200'
                      : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border-emerald-200'
                  }`}
                >
                  {item.active ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hide Glimpse
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Publish Glimpse
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 rounded-lg bg-surface-white border border-surface-border text-typography-secondary hover:text-forest-700 hover:border-forest-300 transition"
                    title="Edit Glimpse"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 rounded-lg bg-surface-white border border-surface-border text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                    title="Delete Glimpse"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-surface-white rounded-3xl max-w-2xl w-full shadow-2xl border border-surface-border overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-forest-900 to-forest-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-700/60 flex items-center justify-center text-amber-300 border border-forest-600/40">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-display">
                    {editingItem ? 'Edit Training Glimpse' : 'Add New Training Glimpse'}
                  </h3>
                  <p className="text-xs text-forest-200">
                    Upload image from local storage or URL for auto-sliding gallery
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-forest-200 hover:text-white hover:bg-forest-700/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Image Source Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-typography-primary uppercase tracking-wider">
                  Select Image Source <span className="text-red-500">*</span>
                </label>

                <div className="flex rounded-xl bg-slate-100 p-1 border border-surface-border">
                  <button
                    type="button"
                    onClick={() => setUploadTab('local')}
                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                      uploadTab === 'local'
                        ? 'bg-surface-white text-forest-900 shadow-sm'
                        : 'text-typography-secondary hover:text-typography-primary'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-forest-700" /> Upload Local Image File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadTab('url')}
                    className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                      uploadTab === 'url'
                        ? 'bg-surface-white text-forest-900 shadow-sm'
                        : 'text-typography-secondary hover:text-typography-primary'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 text-forest-700" /> Image Web URL
                  </button>
                </div>

                {/* Local Upload Tab */}
                {uploadTab === 'local' ? (
                  <div className="space-y-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-forest-300 hover:border-forest-600 rounded-2xl p-6 text-center bg-forest-50/30 hover:bg-forest-50 transition cursor-pointer space-y-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-forest-900">
                        Click or drag image file here from your local computer
                      </div>
                      <p className="text-[11px] text-typography-muted">
                        Supports JPG, PNG, WEBP, GIF up to 10MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleLocalFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  /* URL Input Tab */
                  <div className="space-y-1">
                    <input
                      type="url"
                      placeholder="https://example.com/workshop-photo.jpg"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>
                )}

                {/* Preview Box */}
                {formData.imageUrl && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-2xl border border-surface-border space-y-2">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Image Live Preview
                    </div>
                    <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-950">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Course Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-typography-primary">
                    Glimpse Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Practical Substrate Sterilization & Inoculation"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-typography-primary">
                    Associated Workshop / Course
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oyster & Milky Mushroom Masterclass"
                    value={formData.courseTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, courseTitle: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-typography-primary">
                  Caption / Highlights Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the workshop session, hands-on activities, or key takeaways..."
                  value={formData.caption}
                  onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
                />
              </div>

              {/* Location & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-typography-primary">
                    Venue Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-typography-primary">
                    Batch / Session Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oct 2026 Batch"
                    value={formData.eventDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>
              </div>

              {/* Attendees, Display Order & Active */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-typography-primary">
                    Attendee Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.attendeeCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, attendeeCount: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-typography-primary">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 font-bold"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end pb-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                      className="w-4 h-4 rounded text-forest-700 focus:ring-forest-500 border-surface-border"
                    />
                    <span className="text-xs font-bold text-typography-primary">Publish Live</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-surface-border font-bold text-xs text-typography-secondary hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? 'Update Glimpse' : 'Save & Publish Glimpse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
