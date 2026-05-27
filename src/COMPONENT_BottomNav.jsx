// Bottom navigation bar for mobile
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, Package, MessageSquare, User, Bell } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/sell', label: 'Sell', icon: Plus },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:relative md:border-b md:border-t-0">
      <div className="flex justify-around h-16">
        {links.map(link => {
          const Icon = link.icon;
          const active = isActive(link.path);

          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition ${
                active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-semibold">{link.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
