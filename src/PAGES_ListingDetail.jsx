// Listing detail page
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { listingsService, messagesService } from './SERVICES_supabaseService';
import { formatCurrency, getConditionColor, maskPhone } from './LIB_utils';
import { MessageCircle, Share2, ChevronLeft, ChevronRight, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [recentMessages, setRecentMessages] = useState(0);
  const { user, userProfile } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const data = await listingsService.getListingById(id);
      setListing(data);

      // Increment view count
      await listingsService.incrementViews(id);

      // Get recent message count for this listing
      const messages = await messagesService.getMessages(id);
      setRecentMessages(messages?.length || 0);
    } catch (error) {
      console.error('Error loading listing:', error);
      toast.error('Failed to load listing');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Listing not found</p>
        <button onClick={() => navigate('/')} className="text-blue-600 mt-4">
          Back to listings
        </button>
      </div>
    );
  }

  const isOwner = user?.id === listing.seller_id;
  const images = listing.images || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="flex-1 font-semibold">Listing Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Photo Gallery */}
        {images.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="relative bg-gray-200 h-96">
              <img
                src={images[currentImageIndex]}
                alt={`${listing.title} - ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Gallery Controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 rounded overflow-hidden flex-shrink-0 ${
                      idx === currentImageIndex ? 'ring-2 ring-blue-600' : ''
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title & Price */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
              <p className="text-4xl font-bold text-blue-600 mb-4">
                {formatCurrency(listing.price)}
              </p>

              {/* Condition Badge */}
              <div className="flex gap-4 mb-4">
                <span className={`text-sm px-3 py-1 rounded font-semibold ${getConditionColor(listing.condition)}`}>
                  {listing.condition?.charAt(0).toUpperCase() + listing.condition?.slice(1)}
                </span>
              </div>

              {/* Location & Time */}
              <div className="space-y-2 text-gray-600 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{listing.area}, {listing.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Listed {Math.ceil((Date.now() - new Date(listing.created_at)) / (1000 * 60 * 60))}h ago</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* Brand & Model */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Brand</p>
                  <p className="font-semibold">{listing.brand || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Model</p>
                  <p className="font-semibold">{listing.model || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Seller Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-20">
              <h3 className="font-semibold text-lg mb-4">Seller Info</h3>

              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="font-semibold text-lg">{listing.users?.name}</p>
                <p className="text-sm text-gray-600">
                  Trust Score: {listing.users?.trust_score || 0}/100
                  {listing.users?.is_power_seller && <span className="ml-2 text-green-600 font-semibold">Power Seller</span>}
                </p>
              </div>

              {!isOwner && (
                <>
                  {/* Message Button */}
                  <button
                    onClick={() => navigate(`/chat/${listing.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 mb-3"
                  >
                    <MessageCircle size={18} />
                    Message Seller
                  </button>

                  {/* Buy Now Button */}
                  <button
                    onClick={() => navigate(`/checkout/${listing.id}`)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
                  >
                    Buy Now
                  </button>
                </>
              )}

              {isOwner && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800">
                  This is your listing
                </div>
              )}
            </div>

            {/* Share */}
            <button
              onClick={() => {
                navigator.share?.({
                  title: listing.title,
                  text: `Check out this ${listing.title}`,
                  url: window.location.href,
                }).catch(() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied!');
                });
              }}
              className="w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Share2 size={18} />
              Share Listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
