// src/components/DefaultLayout/DefaultLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '../src/components/Dashboard/Footer/Footer';

const DefaultLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Main content area */}
      <div className="flex-1 w-full max-w-7xl mx-auto">
        <Outlet />
      </div>
      
      {/* Footer - will appear on all pages */}
      <Footer />
    </div>
  );
};

export default DefaultLayout;