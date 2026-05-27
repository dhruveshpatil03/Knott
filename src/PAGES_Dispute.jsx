// Dispute creation and management
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { ordersService } from './SERVICES_supabaseService';
import { supabase } from './CONFIG_supabase';
import { AlertTriangle, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DISPUTE_REASONS = [
  'Not as described',
  'Missing accessories',
  'Damaged on arrival',
  'Wrong item received',
  'Not delivered',
  'Other',
];

export default function PAGES_Dispute() {
  const { order_id } = useParams();
  const [formData, setFormData] = useState({ reason: '', description: '', evidence: [] });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // BUG FIX: was using URL.createObjectURL() which produces blob: URLs that are
  // temporary (cleared on page reload) and cannot be stored in Supabase DB.
  // Now uploads photos to Supabase storage and stores real public URLs.
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (formData.evidence.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    try {
      setUploading(true);
      const newUrls = [];

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `disputes/${user.id}/${Date.now()}-${safeName}`;

        const { error } = await supabase.storage
          .from('listing-images')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setFormData(prev => ({ ...prev, evidence: [...prev.evidence, ...newUrls] }));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (idx) => {
    setFormData(prev => ({ ...prev, evidence: prev.evidence.filter((_, i) => i !== idx) }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reason) newErrors.reason = 'Please select a reason';
    if (!formData.description?.trim()) newErrors.description = 'Please describe the issue';
    if (formData.evidence.length < 2) newErrors.evidence = 'Minimum 2 photos required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { toast.error('Please fill in all required fields'); return; }

    try {
      setSubmitting(true);
      await ordersService.createDispute({
        order_id,
        raised_by: user.id,
        reason: formData.reason,
        description: formData.description,
        evidence_urls: formData.evidence,
      });
      await ordersService.updateOrderStatus(order_id, 'disputed');
      toast.success('Dispute raised. Our team will review it within 24 hours.');
      navigate(`/order/${order_id}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to raise dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle size={24} className="text-red-600 flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-red-600">Raise a Dispute</h1>
              <p className="text-sm text-gray-700 mt-1">
                Our team will review this within 24 hours. Provide clear evidence to support your claim.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">What's the issue? *</label>
              <select
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select a reason</option>
                {DISPUTE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.reason && <p className="text-red-600 text-sm mt-1">{errors.reason}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Describe the issue *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide specific details about what went wrong..."
                rows="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              ></textarea>
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload evidence * <span className="text-gray-500 font-normal">(min 2, max 5 photos)</span>
              </label>
              <label className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-red-400 transition cursor-pointer text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Upload size={32} className="text-gray-400 mb-2" />
                <p className="text-gray-600 font-semibold">
                  {uploading ? 'Uploading...' : 'Click to upload photos'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Max 5MB per file</p>
              </label>

              {formData.evidence.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {formData.evidence.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <img src={photo} alt={`Evidence ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.evidence && <p className="text-red-600 text-sm mt-1">{errors.evidence}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
            >
              {submitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </form>

          <p className="text-xs text-gray-600 mt-6 text-center">
            Once submitted, you cannot edit this dispute. Funds will be held in escrow until our team reviews it.
          </p>
        </div>
      </div>
    </div>
  );
}
