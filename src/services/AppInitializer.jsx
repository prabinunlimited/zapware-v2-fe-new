// src/components/AppInitializer.jsx
import React, { useEffect, useState } from 'react';
import { initializeAppWithPartnerData } from '../services/authService';

const AppInitializer = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('🚀 AppInitializer: Starting initialization...');
        
        // Get current hostname for debugging
        const hostname = window.location.hostname;
        console.log('🔍 Current hostname:', hostname);
        
        // Initialize partner data
        await initializeAppWithPartnerData();
        
        // Check partner status after initialization
        const partnerId = localStorage.getItem('whitelabelledpartnerid');
        const isWhiteLabelled = localStorage.getItem('iswhitelabelledpartner') === 'Y';
        
        console.log('🔍 Partner fetch check:', {
          partnerId,
          isWhiteLabelled,
          hasAuthServiceData: !!localStorage.getItem('bearertoken'),
          hostname
        });
        
        setIsInitialized(true);
        console.log('✅ AppInitializer: Initialization complete');
      } catch (error) {
        console.error('❌ AppInitializer: Initialization failed:', error);
        setInitError(error.message);
        // Still set initialized to true to let the app render
        setIsInitialized(true);
      }
    };

    initApp();
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Initializing app...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Loading partner configuration
          </p>
        </div>
      </div>
    );
  }

  // Show error state if needed
  if (initError && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Initialization warning:', initError);
  }

  // Render children once initialized
  return children;
};

export default AppInitializer;