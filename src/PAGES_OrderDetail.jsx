// Order detail and tracking page
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { ordersService, listingsService } from './SERVICES_supabaseService';
import { formatCurrency, timeUntilEscrowRelease, formatDateIST } from './LIB_utils';
import { ORDER_STATUS, DELIVERY_TYPES } from './CONFIG_constants';
import { ChevronRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await ordersService.getOrderById(id);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!window.confirm('Confirm that you received the item and it matches the description?')) return;

    try {
      setConfirmingReceipt(true);
      await ordersService.updateOrderStatus(id, 'confirmed');
      toast.success('Receipt confirmed! Funds will be released soon.');
      loadOrder();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to confirm receipt');
    } finally {
      setConfirmingReceipt(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!window.confirm('This will pause the escrow release. Our team will review the dispute.')) return;

    // In real app, navigate to dispute creation page
    navigate(`/dispute/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Order not found</p>
        <button onClick={() => navigate('/orders')} className="text-blue-600 mt-4">
          Back to orders
        </button>
      </div>
    );
  }

  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;
  const statusColor = {
    pending: 'yellow',
    paid: 'blue',
    pickup_scheduled: 'blue',
    picked_up: 'blue',
    in_transit: 'blue',
    delivered: 'green',
    confirmed: 'green',
    disputed: 'red',
    refunded: 'red',
    completed: 'green',
  };

  const timelineSteps = [
    { status: 'paid', label: 'Payment Confirmed', icon: '✓' },
    { status: 'pickup_scheduled', label: 'Pickup Scheduled', icon: '📍' },
    { status: 'picked_up', label: 'Picked Up', icon: '📦' },
    { status: 'in_transit', label: 'In Transit', icon: '🚚' },
    { status: 'delivered', label: 'Delivered', icon: '✓' },
    { status: 'confirmed', label: 'Confirmed', icon: '✓' },
  ];

  const currentStepIndex = timelineSteps.findIndex(step => step.status === order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Order #{order.id?.slice(0, 8).toUpperCase()}</h1>
            <span className={`px-4 py-2 rounded-full font-semibold text-white bg-${statusColor[order.status] || 'gray'}-600`}>
              {ORDER_STATUS[order.status]}
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            Placed on {formatDateIST(order.created_at)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-lg mb-4">Item</h2>
              <div className="flex gap-4">
                {order.listings?.images && order.listings.images.length > 0 && (
                  <img
                    src={order.listings.images[0]}
                    alt={order.listings.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{order.listings?.title}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {formatCurrency(order.amount)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {order.listings?.condition} • {order.listings?.area}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-lg mb-6">Delivery Status</h2>

              <div className="space-y-4">
                {timelineSteps.map((step, idx) => (
                  <div key={step.status} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          idx <= currentStepIndex
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {step.icon}
                      </div>
                      {idx < timelineSteps.length - 1 && (
                        <div
                          className={`w-1 h-12 ${
                            idx < currentStepIndex ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        ></div>
                      )}
                    </div>

                    <div className="flex-1 pt-1">
                      <p className={`font-semibold ${idx <= currentStepIndex ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {order.status === step.status && (
                        <p className="text-sm text-blue-600 mt-1">Current status</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Tracking */}
              {order.delivery_tracking_url && order.status !== 'confirmed' && (
                <a
                  href={order.delivery_tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View Live Tracking →
                </a>
              )}
            </div>

            {/* Payment Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-lg mb-4">Payment Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Item Price</span>
                  <span className="font-semibold">{formatCurrency(order.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-semibold">{formatCurrency(order.platform_fee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">
                    {order.delivery_fee === 0 ? 'Free' : formatCurrency(order.delivery_fee)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(order.amount + (order.platform_fee || 0) + (order.delivery_fee || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Seller Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">
                {isBuyer ? 'Seller' : 'Buyer'}
              </h3>
              <p className="font-semibold text-lg">
                {isBuyer ? order.users?.name : 'Buyer'}
              </p>
            </div>

            {/* Escrow Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex gap-2 mb-3">
                <Clock size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <h3 className="font-semibold">Escrow Protection</h3>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Your payment is held in escrow until you confirm receipt of the item. Seller receives payment after that.
              </p>
              {order.status === 'delivered' && (
                <p className="text-sm font-semibold text-blue-600">
                  Release in: {timeUntilEscrowRelease(order.escrow_release_at)}
                </p>
              )}
            </div>

            {/* Buyer Actions */}
            {isBuyer && order.status === 'delivered' && (
              <div className="space-y-2">
                <button
                  onClick={handleConfirmReceipt}
                  disabled={confirmingReceipt}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
                >
                  {confirmingReceipt ? 'Confirming...' : 'Confirm Receipt'}
                </button>
                <button
                  onClick={handleRaiseDispute}
                  className="w-full border border-red-600 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-lg"
                >
                  Raise Dispute
                </button>
              </div>
            )}

            {/* Review Prompt */}
            {isBuyer && order.status === 'confirmed' && (
              <button
                onClick={() => navigate(`/review/${order.id}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
              >
                Leave Review ⭐
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
