// User profile view and edit
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { usersService, reviewsService } from './SERVICES_supabaseService';
import { formatDateIST, getTrustColor } from './LIB_utils';
import { Shield, Star, MessageSquare, Edit, LogOut, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_Profile() {
  const { user_id } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const { user, logout, userProfile } = useAuthStore();
  const navigate = useNavigate();
  const isOwnProfile = !user_id || user_id === user?.id;

  useEffect(() => {
    loadProfile();
  }, [user_id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const targetUserId = user_id || user.id;
      const data = await usersService.getUserProfile(targetUserId);
      setProfile(data);
      setFormData({
        name: data.name,
        city: data.city,
        upi_id: data.upi_id,
      });

      // Load reviews
      const reviewsData = await reviewsService.getProfileReviews(targetUserId);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await usersService.updateUserProfile(user.id, formData);
      toast.success('Profile updated!');
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
        <button onClick={() => navigate('/')} className="text-blue-600 mt-4">
          Back to home
        </button>
      </div>
    );
  }

  const trustColor = getTrustColor(profile.trust_score);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {!isOwnProfile && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          )}

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <p className="text-gray-600 mt-1">
                Joined {formatDateIST(profile.created_at)}
              </p>
            </div>

            {isOwnProfile && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit size={18} />
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trust Score & Badges */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Trust Score */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Trust Score</p>
                <div className={`text-5xl font-bold ${trustColor.text}`}>
                  {profile.trust_score}
                </div>
                <div className={`w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden`}>
                  <div
                    className={`h-full ${trustColor.bg}`}
                    style={{ width: `${Math.min(profile.trust_score, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Badges */}
              <div className="space-y-3">
                {profile.is_verified && (
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <Shield size={18} />
                    Verified
                  </div>
                )}
                {profile.is_power_seller && (
                  <div className="flex items-center gap-2 text-amber-600 font-semibold">
                    <Star size={18} />
                    Power Seller
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-lg mb-4">Stats</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {profile.total_transactions}
                  </p>
                  <p className="text-sm text-gray-600">Transactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {avgRating || '-'}
                  </p>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {reviews.length}
                  </p>
                  <p className="text-sm text-gray-600">Reviews</p>
                </div>
              </div>
            </div>

            {/* Edit Profile Form */}
            {isEditing && isOwnProfile && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="font-semibold text-lg mb-4">Edit Profile</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={formData.upi_id || ''}
                      onChange={(e) => handleInputChange('upi_id', e.target.value)}
                      placeholder="e.g., name@upi"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Star size={20} />
                Reviews ({reviews.length})
              </h2>

              {reviews.length === 0 ? (
                <p className="text-gray-600 text-sm">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-t pt-4 first:border-0 first:pt-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{review.users?.name}</p>
                        <div className="flex text-yellow-400">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} size={16} fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDateIST(review.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
