// Orders list for buyer and seller
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { ordersService } from './SERVICES_supabaseService';
import { formatCurrency, formatDateIST } from './LIB_utils';
import { ORDER_STATUS } from './CONFIG_constants';
import { Package, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_Orders() {
  const [tab, setTab] = useState('buying');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [tab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let data;
      if (tab === 'buying') {
        data = await ordersService.getBuyerOrders(user.id);
      } else {
        data = await ordersService.getSellerOrders(user.id);
      }
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Orders</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setTab('buying')}
            className={`pb-4 font-semibold transition ${
              tab === 'buying'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Buying
          </button>
          <button
            onClick={() => setTab('selling')}
            className={`pb-4 font-semibold transition ${
              tab === 'selling'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Selling
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">
              {tab === 'buying'
                ? "No purchases yet. Start by browsing listings!"
                : "No sales yet. Create your first listing!"}
            </p>
            <button
              onClick={() => navigate(tab === 'buying' ? '/' : '/sell')}
              className="mt-4 text-blue-600 font-semibold hover:text-blue-700"
            >
              {tab === 'buying' ? 'Browse listings' : 'Create listing'} →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order.id}
                onClick={() => navigate(`/order/${order.id}`)}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex gap-4">
                  {/* Item Image */}
                  {order.listings?.images && order.listings.images.length > 0 && (
                    <img
                      src={order.listings.images[0]}
                      alt={order.listings.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}

                  {/* Item Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {order.listings?.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {formatDateIST(order.created_at)}
                    </p>

                    {/* Order Meta */}
                    <div className="flex gap-4 mt-2 flex-wrap">
                      <span className="text-sm font-semibold">
                        {formatCurrency(order.amount)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold text-white bg-${
                          statusColor[order.status] || 'gray'
                        }-600`}
                      >
                        {ORDER_STATUS[order.status]}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center">
                    <Clock size={20} className="text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
