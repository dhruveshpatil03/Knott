// Protected route component
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';

export default function ProtectedRoute({ children }) {
  const { session, userProfile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no session, redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If user not fully set up, redirect to profile setup
  if (!userProfile?.name) {
    return <Navigate to="/setup-profile" replace />;
  }

  return children;
}
