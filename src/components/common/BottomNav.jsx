import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Dumbbell, 
    Trophy, 
    Calendar, 
    Zap 
} from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dash' },
    { path: '/workout', icon: Dumbbell, label: 'Log' },
    { path: '/records', icon: Trophy, label: 'PRs' },
    { path: '/history', icon: Calendar, label: 'History' },
    { path: '/suggestions', icon: Zap, label: 'Fit' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] glassmorphism border-t border-white/5 px-2 pb-safe-offset-2">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link 
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative group`}
            >
                {isActive && (
                    <div className="absolute top-0 w-8 h-1 bg-primary rounded-full animate-in fade-in slide-in-from-top-1" />
                )}
              <Icon className={`w-5 h-5 mb-1 transition-all duration-500 ${
                isActive 
                  ? 'text-primary scale-110' 
                  : 'text-surface-variant/60 group-hover:text-surface-variant group-hover:scale-105'
              }`} />
              <span className={`text-[8px] font-label uppercase tracking-widest font-black transition-all duration-300 ${
                isActive ? 'text-primary' : 'text-surface-variant/40'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;