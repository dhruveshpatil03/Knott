// Utility functions for validation, formatting, and business logic
import { LEAKAGE_PATTERNS } from './CONFIG_constants';

// Format currency in Indian format
export const formatCurrency = (paise) => {
  if (!paise) return '₹0';
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

// Parse currency input to paise
export const parseCurrency = (rupees) => {
  return Math.round(parseFloat(rupees) * 100);
};

// Format date in IST
export const formatDateIST = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
};

// Validate Indian phone number
export const isValidPhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone);
};

// Format phone number for display
export const formatPhone = (phone) => {
  const clean = phone.replace(/\D/g, '');
  return `+91${clean}`;
};

// Mask phone number (show only last 4 digits)
export const maskPhone = (phone) => {
  const clean = phone.replace(/\D/g, '');
  return `+91 ****${clean.slice(-4)}`;
};

// Detect leakage patterns in text
export const detectLeakage = (text) => {
  const detections = [];
  
  if (LEAKAGE_PATTERNS.phone.test(text)) {
    detections.push('phone');
    LEAKAGE_PATTERNS.phone.lastIndex = 0;
  }
  if (LEAKAGE_PATTERNS.upi.test(text)) {
    detections.push('upi');
    LEAKAGE_PATTERNS.upi.lastIndex = 0;
  }
  if (LEAKAGE_PATTERNS.platforms.test(text)) {
    detections.push('platform');
    LEAKAGE_PATTERNS.platforms.lastIndex = 0;
  }
  if (LEAKAGE_PATTERNS.email.test(text)) {
    detections.push('email');
    LEAKAGE_PATTERNS.email.lastIndex = 0;
  }
  
  return detections;
};

// Validate listing creation
export const validateListing = (data) => {
  const errors = {};
  
  if (!data.title || data.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters';
  }
  if (!data.category) {
    errors.category = 'Please select a category';
  }
  if (!data.brand || data.brand.trim().length < 2) {
    errors.brand = 'Please enter brand name';
  }
  if (!data.model || data.model.trim().length < 1) {
    errors.model = 'Please enter model name';
  }
  if (!data.condition) {
    errors.condition = 'Please select condition';
  }
  
  const price = parseInt(data.price);
  if (!price || price < 500) {
    errors.price = 'Minimum listing price is ₹500';
  }
  if (price > 15000000) {
    errors.price = 'Price cannot exceed ₹15,00,000';
  }
  
  if (!data.images || data.images.length < 2) {
    errors.images = 'Minimum 2 photos required';
  }
  if (data.images && data.images.length > 5) {
    errors.images = 'Maximum 5 photos allowed';
  }
  
  if (!data.area) {
    errors.area = 'Please select area';
  }
  if (!data.full_address || data.full_address.trim().length < 10) {
    errors.full_address = 'Please enter complete address';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

// Calculate platform fee
export const calculatePlatformFee = (priceInPaise, percentage = 2.5) => {
  return Math.ceil((priceInPaise * percentage) / 100);
};

// Calculate total checkout amount
export const calculateCheckoutTotal = (priceInPaise, deliveryFee) => {
  const platformFee = calculatePlatformFee(priceInPaise);
  return priceInPaise + platformFee + deliveryFee;
};

// Escape HTML to prevent XSS
export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Generate order ID from UUID
export const getOrderNumber = (uuid) => {
  return uuid.slice(0, 8).toUpperCase();
};

// Check if listing is featured
export const isFeatured = (listing) => {
  if (!listing.is_featured) return false;
  if (!listing.featured_until) return false;
  return new Date(listing.featured_until) > new Date();
};

// Get condition badge color
export const getConditionColor = (condition) => {
  const colors = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-orange-100 text-orange-800',
  };
  return colors[condition] || 'bg-gray-100 text-gray-800';
};

// Get trust score color
export const getTrustScoreColor = (score) => {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

// Get trust color object with text and bg classes
export const getTrustColor = (score) => {
  if (score >= 70) return { text: 'text-green-600', bg: 'bg-green-500' };
  if (score >= 40) return { text: 'text-orange-600', bg: 'bg-orange-500' };
  return { text: 'text-red-600', bg: 'bg-red-500' };
};

// Calculate escrow release timestamp
export const calculateEscrowRelease = (deliveredAt, hoursToRelease = 48) => {
  const date = new Date(deliveredAt);
  date.setHours(date.getHours() + hoursToRelease);
  return date.toISOString();
};

// Time until escrow release in human-readable format
export const timeUntilEscrowRelease = (releaseAt) => {
  const now = new Date();
  const release = new Date(releaseAt);
  const diffMs = release - now;
  
  if (diffMs <= 0) return 'Released';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
};
