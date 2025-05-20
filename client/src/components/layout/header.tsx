import { useState } from "react";
import { useLocation } from "wouter";

const Header = () => {
  const [location] = useLocation();
  
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
              <span className="material-icons">menu</span>
            </button>
          </div>
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button type="button" className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <span className="material-icons">notifications</span>
            </button>
            <button type="button" className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <span className="material-icons">help_outline</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
