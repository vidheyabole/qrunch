import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (restaurantId, { onNewOrder, onOrderUpdated } = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!restaurantId) return;

    socketRef.current = io({ path: '/socket.io', transports: ['websocket', 'polling'] });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      socketRef.current.emit('join_restaurant', restaurantId);
    });

    if (onNewOrder)     socketRef.current.on('new_order',     onNewOrder);
    if (onOrderUpdated) socketRef.current.on('order_updated', onOrderUpdated);

    socketRef.current.on('disconnect', () => console.log('Socket disconnected'));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [restaurantId]);

  return socketRef.current;
};