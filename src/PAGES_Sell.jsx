// Create listing page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { listingsService } from './SERVICES_supabaseService';
import { supabase } from './CONFIG_supabase';
import { validateListing, parseCurrency } from './LIB_utils';
import { CATEGORIES, CONDITIONS, PUNE_AREAS, MIN_LISTING_PRICE } from './CONFIG_constants';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_Sell() {
  const [formData, setFormData] = useState({
    category: '',
    brand: '',
    model: '',
    title: '',
    description: '',
    condition: '',
    price: '',
    area: '',
    full_address: '',
    images: [],
  });

  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { user, userProfile } = useAuthStore();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (formData.images.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    try {
      setUploading(true);
      const uploadedUrls = [];

      for (const file of files) {
        // BUG FIX: sanitise filename — spaces and special chars in filenames
        // cause Supabase storage upload failures.
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${user.id}/${Date.now()}-${safeName}`;

        const { error } = await supabase.storage
          .from('listing-images')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      toast.success(`${files.length} photo(s) uploaded`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateListing(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      toast.error('Please fix errors before publishing');
      return;
    }

    try {
      setLoading(true);
      await listingsService.createListing({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        brand: formData.brand,
        model: formData.model,
        condition: formData.condition,
        // BUG FIX: parseCurrency converts rupee input → paise for storage.
        // MIN_LISTING_PRICE in validateListing is in rupees; comparison is correct.
        price: parseCurrency(formData.price),
        images: formData.images,
        city: userProfile?.city || 'Pune',
        area: formData.area,
        full_address: formData.full_address,
      }, user.id);

      toast.success('Listing published!');
      navigate('/my-listings');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(error.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2">Sell Your Device</h1>
          <p className="text-gray-600 mb-8">Fill in the details and upload photos to get started</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What are you selling? *</label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleInputChange({ target: { name: 'category', value: cat } })}
                    className={`p-4 border rounded-lg font-semibold transition ${
                      formData.category === cat
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
              {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="e.g., Apple, Samsung"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.brand && <p className="text-red-600 text-sm mt-1">{errors.brand}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="e.g., iPhone 13 Pro"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.model && <p className="text-red-600 text-sm mt-1">{errors.model}</p>}
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition *</label>
              <div className="space-y-2">
                {Object.entries(CONDITIONS).map(([key, value]) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="condition"
                      value={key}
                      checked={formData.condition === key}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold">{value.label}</p>
                      <p className="text-sm text-gray-600">{value.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.condition && <p className="text-red-600 text-sm mt-1">{errors.condition}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., iPhone 13 Pro Max 256GB Silver"
                maxLength="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="12000"
                min={MIN_LISTING_PRICE}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
              {/* BUG FIX: was MIN_LISTING_PRICE/100 = ₹5. Now correctly shows ₹500 */}
              <p className="text-xs text-gray-500 mt-1">Minimum: ₹{MIN_LISTING_PRICE}</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the condition, any scratches, included accessories, etc."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area *</label>
              <select
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select area</option>
                {PUNE_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              {errors.area && <p className="text-red-600 text-sm mt-1">{errors.area}</p>}
              <p className="text-xs text-gray-500 mt-1">Shown to buyers before purchase</p>
            </div>

            {/* Full Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
              <textarea
                name="full_address"
                value={formData.full_address}
                onChange={handleInputChange}
                placeholder="123 Main Street, Pune 411001"
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.full_address && <p className="text-red-600 text-sm mt-1">{errors.full_address}</p>}
              <p className="text-xs text-gray-500 mt-1">Only revealed to buyer after payment</p>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={uploading || formData.images.length >= 5}
                  className="hidden"
                  id="photos"
                />
                <label htmlFor="photos" className="flex flex-col items-center gap-2 cursor-pointer">
                  <Upload size={32} className="text-gray-400" />
                  <p className="font-semibold text-gray-700">
                    {uploading ? 'Uploading...' : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-sm text-gray-500">{formData.images.length}/5 photos</p>
                </label>
              </div>
              {errors.images && <p className="text-red-600 text-sm mt-1">{errors.images}</p>}

              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Publishing...' : 'Publish Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
