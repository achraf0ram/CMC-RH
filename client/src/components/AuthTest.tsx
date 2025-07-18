import React, { useEffect, useState } from 'react';
import { axiosInstance } from './Api/axios';

export const AuthTest: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<string>('Testing...');
  const [broadcastStatus, setBroadcastStatus] = useState<string>('Testing...');
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const testAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        setToken(storedToken || 'No token found');
        
        // Test regular authentication
        const response = await axiosInstance.get('/test-auth');
        setAuthStatus(`Authenticated: ${JSON.stringify(response.data)}`);
        
        // Test broadcasting authentication
        const broadcastResponse = await axiosInstance.post('/broadcasting/auth', {
          socket_id: 'test_socket_id',
          channel_name: 'chat.1'
        });
        setBroadcastStatus(`Broadcast Auth: ${JSON.stringify(broadcastResponse.data)}`);
      } catch (error: any) {
        setAuthStatus(`Auth failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        setBroadcastStatus(`Broadcast Auth failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    };

    testAuth();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Authentication Test</h3>
      <div className="space-y-2">
        <p><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'No token'}</p>
        <p><strong>Regular Auth:</strong> {authStatus}</p>
        <p><strong>Broadcast Auth:</strong> {broadcastStatus}</p>
      </div>
    </div>
  );
}; 