import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserIcon, LogOutIcon, BellIcon, HelpCircleIcon, MenuIcon } from "lucide-react";

const Header = () => {
  const [location] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // Function to get page title based on current location
  const getPageTitle = () => {
    switch(location) {
      case '/':
        return 'Dashboard';
      case '/gis-data':
        return 'GIS Data';
      case '/property-data':
        return 'Property Data';
      case '/scan-history':
        return 'Scan History';
      case '/settings':
        return 'Settings';
      case '/pricing':
        return 'Pricing';
      default:
        return 'Dashboard';
    }
  };
  
  // Toggle mobile sidebar
  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('-translate-x-full');
      sidebar.classList.toggle('translate-x-0');
    }
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center md:hidden">
            <button 
              id="mobile-menu-button" 
              type="button" 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={toggleSidebar}
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            
            <button type="button" className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <BellIcon className="h-5 w-5" />
            </button>
            
            <button type="button" className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <HelpCircleIcon className="h-5 w-5" />
            </button>
            
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2 relative group">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full object-cover cursor-pointer" 
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <div className="px-4 py-2 text-sm">
                    <div className="font-medium">{user.email}</div>
                  </div>
                  <div className="border-t border-gray-100"></div>
                  <a href="/api/logout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    Sign out
                  </a>
                </div>
              </div>
            ) : (
              <Button asChild size="sm">
                <a href="/api/login">Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
