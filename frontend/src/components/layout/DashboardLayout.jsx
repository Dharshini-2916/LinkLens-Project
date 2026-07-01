import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu,
  X 
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Set initial sidebar state based on window width
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const isActive = (href) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/dashboard/links";
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Drawer (fixed overlay) */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            {/* Sidebar content */}
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 20 }}
              className="relative w-64 h-full bg-card border-r border-border flex flex-col z-50 p-4"
            >
              <div className="h-16 flex items-center px-2 justify-between border-b border-border mb-4">
                <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg" onClick={() => setSidebarOpen(false)}>
                  <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <span>LinkLens</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                  <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}>
                    <Button 
                      variant={isActive(item.href) ? "secondary" : "ghost"} 
                      className="w-full justify-start gap-3"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Button>
                  </Link>
                ))}
              </nav>

              <div className="pt-4 border-t border-border">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 80 }}
        className="hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 flex-shrink-0"
      >
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <LinkIcon className="w-5 h-5" />
            </div>
            {sidebarOpen && <span>LinkLens</span>}
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.name} to={item.href}>
              <Button 
                variant={isActive(item.href) ? "secondary" : "ghost"} 
                className={`w-full justify-start gap-3 ${!sidebarOpen && 'justify-center px-2'}`}
              >
                <item.icon className="w-4 h-4" />
                {sidebarOpen && item.name}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile / Top Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-4 md:px-8">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}