import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally
(window as any).Pusher = Pusher;

// Get the base URL for the Laravel backend
const getBaseUrl = () => {
  // In development, use localhost:8000 (Laravel server)
  // In production, this should be your actual Laravel domain
  return process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:8000';
};

export const createEcho = (token?: string) => {
  const authToken = token || localStorage.getItem('token');
  if (!authToken) {
    console.warn('No auth token found for Echo!');
    return null;
  }
  return new Echo({
    broadcaster: 'pusher',
    key: 'a231b7d09d9824d968a5',
    cluster: 'eu',
    forceTLS: true,
    authEndpoint: `${getBaseUrl()}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    },
    enabledTransports: ['ws', 'wss'],
  });
};

export default createEcho; 