import { Home, ArrowLeftRight, MessageCircle, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { hapticLight } from '@/lib/haptics';
import { Capacitor } from '@capacitor/core';

const tabs = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: ArrowLeftRight, label: 'Transfer', path: '/transfer' },
  { icon: MessageCircle, label: 'Chat', path: '/chat' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname.startsWith('/chat/')) return null;

  // On native iOS, hide this web tab bar — replaced by native Liquid Glass tab bar
  if (Capacitor.getPlatform() === 'ios') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass safe-bottom">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => {
                hapticLight();
                navigate(tab.path);
              }}
              className="flex flex-col items-center gap-0.5 relative px-4 py-1"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 w-5 h-0.5 rounded-full bg-beige"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                size={20}
                className={isActive ? 'text-beige' : 'text-muted-foreground'}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-beige' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
