// Checkout page
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { listingsService, ordersService } from './SERVICES_supabaseService';
import { formatCurrency, calculateCheckoutTotal, calculatePlatformFee } from './LIB_utils';
import { DELIVERY_TYPES, PUNE_AREAS } from './CONFIG_constants';
import { ArrowLeft, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_Checkout() {
  const { listing_id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    deliveryType: 'standard',
    address: { line1: '', area: '', city: 'Pune', pincode: '' },
  });
  const [errors, setErrors] = useState({});
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { loadListing(); }, [listing_id]);

  const loadListing = async () => {
    try {
      const data = await listingsService.getListingById(listing_id);
      setListing(data);
    } catch (error) {
      console.error('Error loading listing:', error);
      toast.error('Failed to load listing');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.address.line1?.trim()) newErrors.line1 = 'Address is required';
    if (!formData.address.area) newErrors.area = 'Area is required';
    if (!formData.address.pincode?.trim()) newErrors.pincode = 'Pincode is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      // BUG FIX: DELIVERY_TYPES.price is now in paise (consistent with listing price).
      // Previously delivery fee was in rupees while listing.price was in paise — wrong totals.
      const deliveryFee = DELIVERY_TYPES[formData.deliveryType]?.price || 0;
      const platformFee = calculatePlatformFee(listing.price);
      const total = calculateCheckoutTotal(listing.price, deliveryFee);

      // Simulate payment success (replace with real Razorpay flow)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const order = await ordersService.createOrder({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount: listing.price,
        platform_fee: platformFee,
        delivery_fee: deliveryFee,
        delivery_type: formData.deliveryType,
        buyer_address: formData.address,
        status: 'paid',
        razorpay_order_id: `mock_${Date.now()}`,
        razorpay_payment_id: `mock_${Date.now()}`,
        escrow_release_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });

      toast.success('Order placed successfully!');
      navigate(`/order/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
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
        <button onClick={() => navigate('/')} className="text-blue-600 mt-4">Back to listings</button>
      </div>
    );
  }

  // BUG FIX: deliveryFee is now in paise, so all three values are in paise.
  const deliveryFee = DELIVERY_TYPES[formData.deliveryType]?.price || 0;
  const platformFee = calculatePlatformFee(listing.price);
  const total = calculateCheckoutTotal(listing.price, deliveryFee);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => navigate(`/listing/${listing.id}`)}
          className="flex items-center gap-2 text-blue-600 mb-6 hover:text-blue-700"
        >
          <ArrowLeft size={20} />Back to listing
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              <h1 className="text-2xl font-bold">Checkout</h1>

              <div>
                <h2 className="font-semibold text-lg mb-4">Delivery Options</h2>
                <div className="space-y-3">
                  {Object.entries(DELIVERY_TYPES).map(([key, value]) => (
                    <label
                      key={key}
                      className={`flex items-start border-2 p-4 rounded-lg cursor-pointer transition ${
                        formData.deliveryType === key
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value={key}
                        checked={formData.deliveryType === key}
                        onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                        className="mr-3 mt-1"
                      />
                      <div>
                        <span className="font-semibold">{value.label}</span>
                        <span className="text-gray-600 ml-4">
                          {/* BUG FIX: use formatCurrency since price is now in paise */}
                          {value.price > 0 ? formatCurrency(value.price) : 'Free'}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">{value.available}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="font-semibold text-lg mb-4">Delivery Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                    <input
                      type="text"
                      value={formData.address.line1}
                      onChange={(e) => handleAddressChange('line1', e.target.value)}
                      placeholder="House/Flat number and street"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.line1 && <p className="text-red-600 text-sm mt-1">{errors.line1}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                    <select
                      value={formData.address.area}
                      onChange={(e) => handleAddressChange('area', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select area</option>
                      {PUNE_AREAS.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                    {errors.area && <p className="text-red-600 text-sm mt-1">{errors.area}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={formData.address.city}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                      <input
                        type="text"
                        value={formData.address.pincode}
                        onChange={(e) => handleAddressChange('pincode', e.target.value)}
                        placeholder="411001"
                        maxLength="6"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.pincode && <p className="text-red-600 text-sm mt-1">{errors.pincode}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  ✓ Payment is secured in escrow until you confirm receipt
                </p>
                <button
                  onClick={handlePayment}
                  disabled={submitting}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader size={20} className="animate-spin" />Processing...</>
                  ) : (
                    `Pay ${formatCurrency(total)}`
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              <div className="mb-4 pb-4 border-b border-gray-200">
                {listing.images && listing.images.length > 0 && (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <p className="font-semibold line-clamp-2">{listing.title}</p>
                <p className="text-sm text-gray-600 mt-1">{listing.condition}</p>
              </div>
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Item Price</span>
                  <span className="font-semibold">{formatCurrency(listing.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee (2.5%)</span>
                  <span className="font-semibold">{formatCurrency(platformFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">
                    {deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-2xl text-blue-600">{formatCurrency(total)}</span>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Seller</p>
                <p className="font-semibold">{listing.users?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
