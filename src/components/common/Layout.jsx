import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Dumbbell, 
  LayoutDashboard, 
  Zap, 
  User, 
  Menu, 
  X,
  LogOut,
  Calendar,
  Trophy
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useUser } from "../../contexts/UserContext";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Workout", path: "/workout", icon: Dumbbell },
  { label: "History", path: "/history", icon: Calendar },
  { label: "Records", path: "/records", icon: Trophy },
  { label: "Suggestions", path: "/suggestions", icon: Zap },
  { label: "Profile", path: "/onboarding", icon: User },
];

export default function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const { userData } = useUser();

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      {/* Sticky Header Navbar */}
      <header className="sticky top-0 z-50 glassmorphism h-20 flex items-center px-6 lg:px-12 justify-between border-b border-white/5">
        <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary/10 -rotate-3 group-hover:rotate-0 transition-all overflow-hidden border border-white/5">
                <img src="/logo.png" alt="FT" className="w-full h-full object-cover scale-110" />
            </div>
            <span className="font-display font-black text-2xl lg:text-3xl uppercase tracking-tighter italic">
                Fit<span className="text-primary italic">Trackr</span>
            </span>
            </Link>

            {userData?.photoURL && (
                <div className="hidden sm:flex items-center gap-3 pl-6 border-l border-white/10 animate-in fade-in slide-in-from-left-4">
                    <div className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden bg-surface-container-low p-0.5">
                        <img src={userData.photoURL} alt={userData.name} className="w-full h-full object-cover rounded-full transition-transform hover:scale-110" />
                    </div>
                    <span className="text-[10px] font-black italic uppercase tracking-widest text-surface-variant max-w-[100px] truncate">{userData.name}</span>
                </div>
            )}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-2 font-medium transition-all group
                  ${isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary scale-110" : "group-hover:scale-110"}`} />
                <span className="text-sm font-label uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
          <button 
            onClick={logout}
            className="ml-4 text-on-surface-variant hover:text-error transition-colors p-2"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </nav>

        {/* Mobile menu toggle & user info */}
        <div className="lg:hidden flex items-center gap-4">
          {userData?.photoURL && (
             <div className="w-8 h-8 rounded-full border border-primary/20 overflow-hidden">
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
             </div>
          )}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-on-surface-variant focus:outline-none"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden glassmorphism mt-16 animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="p-6 flex flex-col gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl transition-all
                    ${isActive ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-white/5"}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-label uppercase font-bold tracking-tight">{item.label}</span>
                </Link>
              );
            })}
            <button 
              onClick={() => {
                logout();
                setIsMenuOpen(false);
              }}
              className="mt-4 flex items-center gap-4 p-4 text-error rounded-xl hover:bg-error/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-label uppercase font-bold tracking-tight">Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-[2000px] mx-auto w-full px-6 lg:px-12 py-8 transition-all lg:mt-4">
        {children}
      </main>
    </div>
  );
}
