import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  TrendingUp, 
  MessageCircle,
  Bookmark,
  Settings,
  LogOut,
  Menu,
  X,
  Activity
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Keywords', href: '/dashboard/keywords', icon: Search },
    { name: 'Content', href: '/dashboard/content', icon: FileText },
    { name: 'Competitors', href: '/dashboard/competitors', icon: TrendingUp },
    { name: 'AI Assistant', href: '/dashboard/chatbot', icon: MessageCircle },
    { name: 'SEO Audit', href: '/dashboard/seo-audit', icon: Activity },
    { name: 'Saved', href: '/dashboard/saved', icon: Bookmark },
    { name: 'Settings', href: '/dashboard/profile', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r bg-card transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-primary">
                <Search className="h-4 w-4 text-white" />
              </div>
              <span>SEOgenious</span>
            </Link>
            <button 
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
              data-testid="button-close-sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || location.startsWith(item.href + '/');
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  className={`
                    flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="mb-3 flex items-center gap-3 rounded-md bg-muted p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {user?.name?.substring(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-open-sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
