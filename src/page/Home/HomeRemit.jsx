// src/page/Home/HomeRemit.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectIsInitialized,
  selectIsAuthenticated,
  selectCustomerId,
  selectIsLoading,
  syncLocalStorageState
} from '../../features/Auth/slices/authSlice';

function HomeRemit() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isInitialized = useSelector(selectIsInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const storedCustomerId = useSelector(selectCustomerId);
  const isLoading = useSelector(selectIsLoading);
  const [localLoading, setLocalLoading] = useState(true);

  // Sync auth state on mount
  useEffect(() => {
    dispatch(syncLocalStorageState());
  }, [dispatch]);

  // Check authentication and handle redirects
  useEffect(() => {
    const checkAuth = () => {
      if (isInitialized) {
        if (!isAuthenticated) {
          console.log('Not authenticated, redirecting to login');
          navigate('/', { replace: true });
          return;
        }

        // Validate customerId
        if (customerId && storedCustomerId && customerId !== storedCustomerId.toString()) {
          console.log('Customer ID mismatch, redirecting to correct page');
          navigate(`/home-remit/${storedCustomerId}`, { replace: true });
          return;
        }

        // All good
        setLocalLoading(false);
      }
    };

    checkAuth();
  }, [isInitialized, isAuthenticated, customerId, storedCustomerId, navigate]);

  // Show loading while checks are in progress
  if (!isInitialized || isLoading || localLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h1>
      <p className="text-gray-600 mb-4">Customer ID: {customerId}</p>
      {/* Your HomeRemit content */}
    </div>
  );
}

export default HomeRemit;
