import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your authentication...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No authentication token provided. Please use the link sent to you via IRC.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify?token=${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting to dashboard...');
        
          navigate('/');
        } else {
          setStatus('error');
          setMessage(data.error || 'Authentication failed. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your authentication. Please try again.');
        console.error('Authentication error:', error);
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-6 py-12 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6">IRC Chatbot Dashboard</h1>
        
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="w-12 h-12 text-green-500 mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-semibold">{message}</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="w-12 h-12 text-red-500 mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600">{message}</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => navigate('/')}
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage; 