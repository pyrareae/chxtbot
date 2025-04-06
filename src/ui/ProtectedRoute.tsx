import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        setIsAuthenticated(data.authenticated);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated, redirect to home page
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-1 text-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-200">You are not authenticated. Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 