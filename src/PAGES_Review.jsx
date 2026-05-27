// Review page after order confirmed
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { ordersService, reviewsService } from './SERVICES_supabaseService';
import { Star, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PAGES_Review() {
  const { order_id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrder();
  }, [order_id]);

  const loadOrder = async () => {
    try {
      const data = await ordersService.getOrderById(order_id);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!rating) {
      newErrors.rating = 'Please select a rating';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please complete the review');
      return;
    }

    try {
      setSubmitting(true);

      // Determine who is being reviewed
      const isBuyer = user.id === order.buyer_id;
      const revieweeId = isBuyer ? order.seller_id : order.buyer_id;

      await reviewsService.createReview({
        order_id,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || null,
      });

      toast.success('Review submitted! Thank you for your feedback.');
      navigate(`/order/${order_id}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to submit review');
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

  const reviewee = user.id === order.buyer_id ? order.users : 'Buyer';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => navigate(`/order/${order_id}`)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Back to order
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2">Review</h1>
          <p className="text-gray-600 mb-8">
            Share your experience with {typeof reviewee === 'string' ? reviewee : reviewee.name}
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Item Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-2">Item</p>
              <h3 className="font-semibold text-lg">{order.listings?.title}</h3>
              <p className="text-gray-600 text-sm mt-2">
                {order.listings?.condition} • {order.listings?.area}
              </p>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                How would you rate this transaction? *
              </label>

              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition transform hover:scale-110"
                  >
                    <Star
                      size={40}
                      className={`${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      } transition`}
                    />
                  </button>
                ))}
              </div>

              {errors.rating && <p className="text-red-600 text-sm mt-2">{errors.rating}</p>}

              {/* Rating Label */}
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {rating === 5 && '⭐ Excellent!'}
                  {rating === 4 && '😊 Very Good'}
                  {rating === 3 && '😐 Good'}
                  {rating === 2 && '😕 Poor'}
                  {rating === 1 && '😞 Very Poor'}
                </p>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Share details of your experience (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Was the item as described? How was the delivery? Would you buy from this seller again?"
                rows="6"
                maxLength="500"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              ></textarea>
              <p className="text-xs text-gray-500 mt-2">
                {comment.length}/500 characters
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>

          <p className="text-xs text-gray-600 mt-6 text-center">
            Your review helps other buyers make informed decisions. All reviews are verified and genuine.
          </p>
        </div>
      </div>
    </div>
  );
}
