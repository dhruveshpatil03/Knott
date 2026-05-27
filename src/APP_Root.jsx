// Main app with routing
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './STORE_useAuthStore';
import { supabaseConfigured } from './CONFIG_supabase';
import ProtectedRoute from './COMPONENT_ProtectedRoute';
import BottomNav from './COMPONENT_BottomNav';
import SetupScreen from './COMPONENT_SetupScreen';

// Auth pages
import PAGES_Login from './PAGES_Login';
import PAGES_Verify from './PAGES_Verify';
import PAGES_SetupProfile from './PAGES_SetupProfile';

// Browse pages
import PAGES_Home from './PAGES_Home';
import PAGES_ListingDetail from './PAGES_ListingDetail';
import PAGES_Sell from './PAGES_Sell';
import PAGES_MyListings from './PAGES_MyListings';

// Transaction pages
import PAGES_Checkout from './PAGES_Checkout';
import PAGES_Orders from './PAGES_Orders';
import PAGES_OrderDetail from './PAGES_OrderDetail';
import PAGES_Dispute from './PAGES_Dispute';

// Chat & Notifications
import PAGES_Chat from './PAGES_Chat';
import PAGES_Notifications from './PAGES_Notifications';

// Profile & Reviews
import PAGES_Profile from './PAGES_Profile';
import PAGES_Review from './PAGES_Review';

// Redirects already-authenticated users away from login/verify
function AuthRoute({ children }) {
  const { user, userProfile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user && userProfile?.name) return <Navigate to="/" replace />;
  if (user && !userProfile?.name) return <Navigate to="/setup-profile" replace />;

  return children;
}

export default function App() {
  const { loading, initAuth } = useAuthStore();

  // Show setup instructions if Supabase env vars are missing.
  // This MUST be before any Supabase calls so we never hit the broken client.
  if (!supabaseConfigured) {
    return <SetupScreen />;
  }

  useEffect(() => {
    initAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" />

      <Routes>
        {/* Auth */}
        <Route path="/login" element={<AuthRoute><PAGES_Login /></AuthRoute>} />
        <Route path="/verify" element={<AuthRoute><PAGES_Verify /></AuthRoute>} />
        <Route path="/setup-profile" element={<PAGES_SetupProfile />} />

        {/* Main */}
        <Route path="/" element={<ProtectedRoute><><PAGES_Home /><BottomNav /></></ProtectedRoute>} />
        <Route path="/listing/:id" element={<ProtectedRoute><><PAGES_ListingDetail /><BottomNav /></></ProtectedRoute>} />
        <Route path="/sell" element={<ProtectedRoute><><PAGES_Sell /><BottomNav /></></ProtectedRoute>} />
        <Route path="/my-listings" element={<ProtectedRoute><><PAGES_MyListings /><BottomNav /></></ProtectedRoute>} />
        <Route path="/checkout/:listing_id" element={<ProtectedRoute><><PAGES_Checkout /><BottomNav /></></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><><PAGES_Orders /><BottomNav /></></ProtectedRoute>} />
        <Route path="/order/:id" element={<ProtectedRoute><><PAGES_OrderDetail /><BottomNav /></></ProtectedRoute>} />
        <Route path="/dispute/:order_id" element={<ProtectedRoute><><PAGES_Dispute /><BottomNav /></></ProtectedRoute>} />
        <Route path="/chat/:listing_id" element={<ProtectedRoute><PAGES_Chat /></ProtectedRoute>} />
        <Route path="/chat/order/:order_id" element={<ProtectedRoute><PAGES_Chat /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><><PAGES_Notifications /><BottomNav /></></ProtectedRoute>} />
        <Route path="/profile/:user_id" element={<ProtectedRoute><><PAGES_Profile /><BottomNav /></></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><><PAGES_Profile /><BottomNav /></></ProtectedRoute>} />
        <Route path="/review/:order_id" element={<ProtectedRoute><><PAGES_Review /><BottomNav /></></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
