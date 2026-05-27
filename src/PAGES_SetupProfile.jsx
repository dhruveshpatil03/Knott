// Profile setup page after first signup
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { usersService } from './SERVICES_supabaseService';
import { PUNE_AREAS } from './CONFIG_constants';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_SetupProfile() {
  const [formData, setFormData] = useState({ name: '', city: 'Pune', upi_id: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { user, userProfile, setUserProfile } = useAuthStore();
  const navigate = useNavigate();

  // BUG FIX: if the user already has a profile, skip setup and go to home.
  useEffect(() => {
    if (userProfile?.name) {
      navigate('/', { replace: true });
    }
  }, [userProfile, navigate]);

  // BUG FIX: if there is no authenticated user at all, redirect to login.
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (formData.upi_id && !formData.upi_id.includes('@')) {
      newErrors.upi_id = 'Invalid UPI ID format (e.g., name@upi)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const profile = await usersService.createUserProfile({
        id: user.id,
        name: formData.name.trim(),
        phone: user.user_metadata?.phone,
        city: formData.city,
        upi_id: formData.upi_id || null,
        trust_score: 0,
        total_transactions: 0,
        is_verified: false,
        is_power_seller: false,
      });
      setUserProfile(profile);
      toast.success('Profile created! Welcome to Knott!');
      navigate('/');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  // Don't render the form while redirect effects are pending
  if (!user || userProfile?.name) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-block bg-white rounded-full p-4 mb-4">
            <UserPlus size={48} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Complete Your Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="John Doe"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                errors.name ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">City *</label>
            <select
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                errors.city ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
              }`}
            >
              <option value="Pune">Pune</option>
            </select>
            {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              UPI ID <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.upi_id}
              onChange={(e) => handleChange('upi_id', e.target.value)}
              placeholder="yourname@upi"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                errors.upi_id ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            {errors.upi_id && <p className="text-red-600 text-sm mt-1">{errors.upi_id}</p>}
            <p className="text-xs text-gray-600 mt-2">
              You can add or update your UPI ID later for receiving payments
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition mt-8"
          >
            {loading ? 'Creating Profile...' : 'Get Started'}
          </button>

          <p className="text-xs text-gray-600 text-center">
            We'll use this info for your seller profile and payments
          </p>
        </form>
      </div>
    </div>
  );
}
