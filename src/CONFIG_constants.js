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

export const DELIVERY_TYPES = {
  same_day: { label: 'Same-day Delivery', price: 99, available: '9am–5pm' },
  express: { label: 'Express 2-hour', price: 149, available: '10am–4pm' },
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

export const PLATFORM_FEE_PERCENTAGE = 2.5;
export const MIN_LISTING_PRICE = 500;
export const MAX_PRICE_WITHOUT_VERIFICATION = 150000;
export const FEATURED_LISTING_PRICE = 99;
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
  'Erandwane', 'Ghole Road', 'Ghorpadi', 'Gyan Vihar',
  'Hadapsar', 'Hinjewadi', 'Holkar Colony', 'Hongarsuitragh', 'Hulimavu',
  'Kalyani Nagar', 'Katraj', 'Kondhwa', 'Korregaon Park', 'Kothrud',
  'Kumthekar Road', 'Lohegaon', 'Lonavala', 'Loriwalan',
  'Magarpatta', 'Manish Nagar', 'Maruti Nagar', 'Midc', 'Mishan Pune',
  'Model Colony', 'Mohammadwadi', 'Mohan Nagar', 'Mundhwa',
  'Nanded City', 'Narveer Tanaji Nagar', 'Narayan Peth', 'Navalur',
  'Navi Peth', 'Nigdi', 'Pashan', 'Parandwala', 'Paud Road',
  'Peth Pavan', 'Phursungi', 'Pimpri', 'Pimpri-Chinchwad', 'Prabhat Road',
  'Pradhikaran', 'Pune Station', 'Purandare', 'Pura',
  'Range Hills', 'Ravet', 'Rasta Peth', 'Ravi Nagar', 'Risod',
  'Sadashiv Peth', 'Sahakarnagar', 'Sangvi', 'Sant Tukaram Nagar', 'Saswad',
  'Satapur', 'Sinhagad Road', 'Somwar Peth', 'Sriram Nagar', 'Sutarwadi',
  'Talegaon', 'Taljai Hills', 'Tambe', 'Tanaji Nagar', 'Tathawade',
  'Tavas', 'Thergaon', 'Tingre Nagar', 'Tissawali', 'Tundikhel',
  'Uruli Kanchan', 'Vitthalwadi', 'Viman Nagar', 'Vimannagar', 'Vitthal Nagar',
  'Wadgaonsheri', 'Wagholi', 'Wahegaon', 'Wanorie', 'Warai', 'Wardi',
  'Warje', 'Warje Malwadi', 'Washerman Nagar', 'Watersons', 'Waze Yeowman',
  'Welkul Road', 'Western Ghats', 'Yavat',
  'Yerawada', 'Yerwada',
  'Zakharwadi', 'Zardad Ali', 'Zarephata', 'Zerda', 'Zirgaon', 'Zunjvada',
];
