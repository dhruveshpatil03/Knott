// Enhanced UI utilities for consistent styling across all pages
import toast from 'react-hot-toast';

// Color palette constants
export const COLORS = {
  primary: '#2563EB', // Blue
  success: '#16a34a', // Green
  warning: '#ea580c', // Orange
  error: '#dc2626', // Red
  background: '#F8F8F8',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    light: '#F3F4F6',
  },
};

// Reusable Tailwind class sets
export const BUTTON_STYLES = {
  primary: 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition',
  secondary: 'bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-900 font-semibold py-3 rounded-lg transition',
  success: 'bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition',
  danger: 'bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition',
  outline: 'border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-semibold py-3 rounded-lg transition',
  ghost: 'text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50 transition',
};

export const INPUT_STYLES = {
  base: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
  error: 'w-full px-4 py-2 border-2 border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition',
  disabled: 'w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed',
};

export const CARD_STYLES = {
  base: 'bg-white rounded-lg shadow-md p-6 transition',
  hover: 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer',
  subtle: 'bg-gray-50 rounded-lg border border-gray-200 p-6 transition',
};

export const BADGE_STYLES = {
  success: 'px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold',
  warning: 'px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold',
  error: 'px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold',
  info: 'px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold',
  neutral: 'px-3 py-1 rounded-full bg-gray-200 text-gray-800 text-xs font-semibold',
};

export const LOADING_SPINNER = 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600';

// Error handling utilities
export const showError = (message) => {
  toast.error(message || 'Something went wrong. Please try again.');
};

export const showSuccess = (message) => {
  toast.success(message || 'Success!');
};

export const showInfo = (message) => {
  toast((t) => (
    <div className="flex items-center gap-2 text-sm">
      <span>{message}</span>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="text-gray-500 hover:text-gray-700 ml-2"
      >
        ✕
      </button>
    </div>
  ));
};

// Form validation helpers
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhone = (phone) => {
  const regex = /^[6-9]\d{9}$/; // Indian 10-digit
  return regex.test(phone);
};

export const validateUPI = (upi) => {
  const regex = /^[\w.-]+@[a-zA-Z]{3,}$/; // name@bankname
  return regex.test(upi);
};

// Skeleton loaders
export const SkeletonLoader = ({ count = 3, height = 'h-20' }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className={`${height} bg-gray-200 rounded-lg animate-pulse`}></div>
    ))}
  </div>
);

// Empty state component
export const EmptyState = ({ icon: Icon, title, description, action, actionLabel }) => (
  <div className="text-center py-12">
    {Icon && <Icon size={48} className="mx-auto text-gray-400 mb-4" />}
    <p className="text-gray-900 text-lg font-semibold">{title}</p>
    {description && <p className="text-gray-600 text-sm mt-2">{description}</p>}
    {action && (
      <button onClick={action} className="text-blue-600 hover:text-blue-700 font-semibold mt-4">
        {actionLabel || 'Take Action'} →
      </button>
    )}
  </div>
);

// Accessibility helpers
export const accessibleLabel = (id, label) => ({
  htmlFor: id,
  children: label,
  className: 'block text-sm font-medium text-gray-700 mb-2',
});

// Responsive breakpoints helper
export const mediaQuery = {
  mobile: '(max-width: 640px)',
  tablet: '(max-width: 768px)',
  desktop: '(min-width: 1024px)',
};

// Animation utilities
export const ANIMATION_DURATION = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

// Formatting utilities for monetary values
export const formatPrice = (paise) => {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Accessible focus management
export const manageFocus = {
  trap: (container) => {
    const focusableElements = container?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements?.length) {
      focusableElements[0].focus();
    }
  },
  restore: (previousActiveElement) => {
    previousActiveElement?.focus();
  },
};

// Toast with action button
export const toastWithAction = (message, actionLabel, onAction) => {
  toast.custom((t) => (
    <div className="bg-white rounded-lg shadow-lg p-4 flex items-center justify-between gap-4">
      <span className="text-sm text-gray-900">{message}</span>
      <button
        onClick={() => {
          onAction();
          toast.dismiss(t.id);
        }}
        className="text-blue-600 hover:text-blue-700 font-semibold whitespace-nowrap"
      >
        {actionLabel}
      </button>
    </div>
  ));
};
