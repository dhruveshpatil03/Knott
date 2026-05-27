// Home feed - Browse all active listings
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { listingsService } from './SERVICES_supabaseService';
import { formatCurrency, isFeatured, getConditionColor } from './LIB_utils';
import { Heart, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    area: '',
    search: '',
  });
  const [page, setPage] = useState(0);
  const { userProfile } = useAuthStore();
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 20;

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listingsService.getListings(filters);
      setListings(data || []);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadListings();
  }, [filters, loadListings]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleListingClick = (listingId) => {
    navigate(`/listing/${listingId}`);
  };

  const paginatedListings = listings.slice(0, (page + 1) * ITEMS_PER_PAGE);

  const conditions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
  ];

  const categories = [
    { value: 'phone', label: 'Phones' },
    { value: 'laptop', label: 'Laptops' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Knott</h1>
            <div className="text-sm text-gray-600">
              {userProfile?.name}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by title, brand, model..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <select
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">All Conditions</option>
              {conditions.map(cond => (
                <option key={cond.value} value={cond.value}>{cond.label}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Min price"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            />

            <input
              type="number"
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            />

            <input
              type="text"
              placeholder="Area"
              value={filters.area}
              onChange={(e) => handleFilterChange('area', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm col-span-2 md:col-span-1"
            />
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : paginatedListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No listings found</p>
            <button
              onClick={() => navigate('/sell')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Be the first to list!
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedListings.map(listing => (
                <div
                  key={listing.id}
                  onClick={() => handleListingClick(listing.id)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-gray-200">
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
                    {isFeatured(listing) && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                      {listing.title}
                    </h3>

                    <div className="mb-3">
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(listing.price)}
                      </p>
                    </div>

                    {/* Condition Badge */}
                    <div className="mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${getConditionColor(listing.condition)}`}>
                        {listing.condition?.charAt(0).toUpperCase() + listing.condition?.slice(1)}
                      </span>
                    </div>

                    {/* Area & Time */}
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{listing.area}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{Math.ceil((Date.now() - new Date(listing.created_at)) / (1000 * 60 * 60))}h ago</span>
                      </div>
                    </div>

                    {/* Seller Info */}
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs">
                      <p className="text-gray-700">
                        {listing.users?.name || 'Unknown seller'}
                        {listing.users?.is_verified && <span className="ml-1">✓</span>}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {paginatedListings.length < listings.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
