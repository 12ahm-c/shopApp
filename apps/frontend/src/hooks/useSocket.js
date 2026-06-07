import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../stores/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/v1', '') || 'http://localhost:3001';

export function useSocket() {
  const token = useAuthStore(state => state.token);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return { socket: socketRef.current, isConnected };
}
