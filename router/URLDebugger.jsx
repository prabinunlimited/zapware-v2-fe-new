// src/components/URLDebugger/URLDebugger.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCustomerId, selectIsAuthenticated } from '../src/features/Auth/slices/authSlice';

const URLDebugger = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const customerId = useSelector(selectCustomerId);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    const pathname = location.pathname;
    
    // Only validate if authenticated
    if (!isAuthenticated) return;

    console.log("🔍 URLDebugger checking:", pathname);
    
    // Check for undefined in any part of the URL
    if (pathname.includes('/undefined/')) {
      console.error('❌ URLDebugger: Found undefined in URL');
      
      if (customerId && customerId !== "undefined") {
        // Replace ALL undefined occurrences with actual customerId
        const correctedPath = pathname.replace(/\/undefined\//g, `/${customerId}/`);
        console.log('🔄 URLDebugger: Redirecting to:', correctedPath);
        navigate(correctedPath, { replace: true });
        return;
      }
      
      // If no valid customerId, redirect to login
      console.log('🚫 URLDebugger: No valid customerId, redirecting to login');
      navigate('/', { replace: true });
    }
  }, [location.pathname, customerId, isAuthenticated, navigate]);

  return null;
};

export default URLDebugger;