// My listings management page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { listingsService } from './SERVICES_supabaseService';
import { formatCurrency, isFeatured, getConditionColor } from './LIB_utils';
import { Edit2, Trash2, Eye, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await listingsService.getUserListings(user.id);
      setListings(data || []);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSold = async (id) => {
    if (!window.confirm('Mark this listing as sold?')) return;

    try {
      await listingsService.markAsSold(id);
      toast.success('Listing marked as sold');
      loadListings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update listing');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;

    try {
      await listingsService.deleteListing(id);
      toast.success('Listing deleted');
      loadListings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete listing');
    }
  };

  const handleFeature = async (id) => {
    // In real app, this would process payment first
    try {
      await listingsService.featureListing(id, 7);
      toast.success('Listing featured for 7 days!');
      loadListings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to feature listing');
    }
  };

  const activeListing = listings.filter(l => l.status === 'active');
  const soldListings = listings.filter(l => l.status === 'sold');
  const displayListings = activeTab === 'active' ? activeListing : soldListings;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
            <h1 className="text-3xl font-bold mb-2">My Listings</h1>
            <p className="text-blue-100">{listings.length} total listings</p>
            <button
              onClick={() => navigate('/sell')}
              className="mt-4 bg-white text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg font-semibold"
            >
              Create New Listing
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 flex">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-4 px-6 font-semibold text-center transition ${
                activeTab === 'active'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active ({activeListing.length})
            </button>
            <button
              onClick={() => setActiveTab('sold')}
              className={`flex-1 py-4 px-6 font-semibold text-center transition ${
                activeTab === 'sold'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sold ({soldListings.length})
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : displayListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {activeTab === 'active'
                    ? 'No active listings yet'
                    : 'No sold listings yet'}
                </p>
                {activeTab === 'active' && (
                  <button
                    onClick={() => navigate('/sell')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                  >
                    Create First Listing
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {displayListings.map(listing => (
                  <div
                    key={listing.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Image */}
                      <div className="w-24 h-24 bg-gray-200 rounded flex-shrink-0">
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-1">
                              {listing.title}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {listing.area}, {listing.city}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600">
                              {formatCurrency(listing.price)}
                            </p>
                            <span className={`inline-block text-xs px-2 py-1 rounded mt-1 ${getConditionColor(listing.condition)}`}>
                              {listing.condition}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Eye size={14} />
                            <span>{listing.views} views</span>
                          </div>
                          {isFeatured(listing) && (
                            <div className="flex items-center gap-1 text-yellow-600 font-semibold">
                              <Star size={14} />
                              <span>Featured</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => navigate(`/listing/${listing.id}`)}
                          className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded text-sm font-semibold"
                        >
                          View
                        </button>

                        {listing.status === 'active' && !isFeatured(listing) && (
                          <button
                            onClick={() => handleFeature(listing.id)}
                            className="px-4 py-2 border border-yellow-300 hover:bg-yellow-50 rounded text-sm font-semibold text-yellow-700"
                          >
                            Feature ₹99
                          </button>
                        )}

                        {listing.status === 'active' && (
                          <button
                            onClick={() => handleMarkAsSold(listing.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold"
                          >
                            Mark Sold
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
