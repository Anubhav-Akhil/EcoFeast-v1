import { io } from 'socket.io-client';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// For local proxy (/api) we need to connect to the origin. 
// If VITE_API_BASE_URL is a full URL, we connect to it.
const socketUrl = VITE_API_BASE_URL.startsWith('http') 
  ? VITE_API_BASE_URL.replace(/\/api$/, '') 
  : window.location.origin;

export const socket = io(socketUrl, {
  autoConnect: true,
  withCredentials: true
});

socket.on('connect', () => {
  console.log('Socket connected successfully! ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});
