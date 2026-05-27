// Global constants and configurations for Knott

export const COLORS = {
  primary: '#2563EB',
  success: '#16a34a',
  warning: '#ea580c',
  error: '#dc2626',
  bg: '#F8F8F8',
};

export const CATEGORIES = ['phone', 'laptop'];

export const CONDITIONS = {
  excellent: { label: 'Excellent', description: 'Like new, no scratches, original box' },
  good: { label: 'Good', description: 'Light wear, fully functional' },
  fair: { label: 'Fair', description: 'Visible wear, works perfectly' },
};

// BUG FIX: prices are now in PAISE (consistent with listing prices).
// 9900 = ₹99, 14900 = ₹149. formatCurrency() handles display.
export const DELIVERY_TYPES = {
  same_day: { label: 'Same-day Delivery', price: 9900, available: '9am–5pm' },
  express: { label: 'Express 2-hour', price: 14900, available: '10am–4pm' },
  standard: { label: 'Standard Courier', price: 0, available: '1-2 days' },
  self_pickup: { label: 'Self Pickup', price: 0, available: 'Anytime' },
};

export const ORDER_STATUS = {
  pending: 'Payment Pending',
  paid: 'Payment Confirmed',
  pickup_scheduled: 'Pickup Scheduled',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  confirmed: 'Confirmed',
  disputed: 'Disputed',
  refunded: 'Refunded',
  completed: 'Completed',
};

// Tailwind can't generate dynamic class names (e.g. `bg-${color}-600`) with JIT.
// Use this pre-computed map instead — all classes are statically present in source.
export const ORDER_STATUS_CLASS = {
  pending: 'bg-yellow-500',
  paid: 'bg-blue-600',
  pickup_scheduled: 'bg-blue-600',
  picked_up: 'bg-blue-600',
  in_transit: 'bg-blue-600',
  delivered: 'bg-green-600',
  confirmed: 'bg-green-600',
  disputed: 'bg-red-600',
  refunded: 'bg-red-600',
  completed: 'bg-green-600',
};

export const PLATFORM_FEE_PERCENTAGE = 2.5;

// BUG FIX: MIN_LISTING_PRICE is in RUPEES and used directly as a raw-input threshold.
// Previously 500 was shown as ₹500/100 = ₹5, which was wrong.
export const MIN_LISTING_PRICE = 500; // ₹500 minimum
export const MAX_PRICE_WITHOUT_VERIFICATION = 150000; // ₹1,50,000 in rupees
export const FEATURED_LISTING_PRICE = 9900; // ₹99 in paise
export const FEATURED_LISTING_DAYS = 7;

export const ESCROW_RELEASE_HOURS = 48;
export const DISPUTE_WINDOW_HOURS = 48;

export const LEAKAGE_PATTERNS = {
  phone: /[6-9]\d{9}/g,
  upi: /[\w.]+@(okicici|paytm|ybl|upi)/g,
  platforms: /whatsapp|telegram|instagram|snapchat|discord/gi,
  email: /[\w.+-]+@[\w-]+\.[a-z]{2,}/gi,
};

export const WARNING_THRESHOLDS = {
  hide_listings: 3,
  suspend: 5,
  suspension_days: 7,
};

export const TRUST_SCORE_CALCULATION = {
  completed_transaction: 5,
  average_rating_multiplier: 8,
  verification_bonus: 10,
  dispute_penalty: -5,
  max_score: 100,
};

export const POWER_SELLER_CRITERIA = {
  min_transactions: 10,
  min_rating: 4.5,
};

export const PUNE_AREAS = [
  'Aundh', 'Baner', 'Balewadi', 'Bavdhan', 'Bibvewadi', 'Budhwar Peth',
  'Camp', 'Chatushringi', 'Deccan', 'Dhankawadi', 'Dhanori',
  'Erandwane', 'Ghole Road', 'Ghorpadi',
  'Hadapsar', 'Hinjewadi',
  'Kalyani Nagar', 'Katraj', 'Kondhwa', 'Koregaon Park', 'Kothrud',
  'Lohegaon', 'Lonavala',
  'Magarpatta', 'Mundhwa',
  'Nanded City', 'Narayan Peth', 'Nigdi',
  'Pashan', 'Paud Road', 'Phursungi', 'Pimpri', 'Pimpri-Chinchwad', 'Prabhat Road',
  'Pune Station',
  'Range Hills', 'Ravet', 'Rasta Peth',
  'Sadashiv Peth', 'Sahakarnagar', 'Sangvi', 'Sinhagad Road', 'Somwar Peth',
  'Talegaon', 'Tathawade', 'Thergaon', 'Tingre Nagar',
  'Undri',
  'Viman Nagar', 'Vishrantwadi',
  'Wadgaonsheri', 'Wagholi', 'Wanowrie', 'Warje',
  'Yerawada',
];
