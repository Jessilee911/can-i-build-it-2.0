import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

const Sidebar = () => {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState(false);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Close sidebar on location change for mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [location]);

  return (
    <aside 
      id="sidebar" 
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-dark text-white transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-300 ease-in-out`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Can I Build It?</h1>
        <button 
          className="md:hidden text-white" 
          onClick={() => setIsOpen(false)}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          <Link 
            href="/" 
            className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              location === '/' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="material-icons mr-3 text-lg">dashboard</span>
            Dashboard
          </Link>
          
          <Link 
            href="/gis-data" 
            className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              location === '/gis-data' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="material-icons mr-3 text-lg">map</span>
            Zoning & Planning
          </Link>
          
          <Link 
            href="/property-data" 
            className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              location === '/property-data' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="material-icons mr-3 text-lg">home</span>
            Property Search
          </Link>
          
          <Link 
            href="/scan-history" 
            className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              location === '/scan-history' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="material-icons mr-3 text-lg">construction</span>
            Building Code
          </Link>
          
          <Link 
            href="/settings" 
            className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              location === '/settings' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="material-icons mr-3 text-lg">settings</span>
            Settings
          </Link>
        </div>
      </nav>
      
      <div className="absolute bottom-0 w-full border-t border-gray-700 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="material-icons">smart_toy</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Building Assistant</p>
            <div className="flex items-center">
              <div 
                id="status-indicator" 
                className={`h-2 w-2 rounded-full ${agentStatus ? 'bg-status-success' : 'bg-gray-300'} mr-1`}
              />
              <p className="text-xs text-gray-400" id="status-text">
                {agentStatus ? 'Ready to Analyze' : 'Inactive'}
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                value="" 
                className="sr-only peer" 
                checked={agentStatus}
                onChange={() => setAgentStatus(!agentStatus)} 
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
