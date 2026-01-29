import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';
import type { RecordChangeEvent } from '@toolforge/shared';

let socket: Socket | null = null;

export function connectSocket(): Socket | null {
  if (socket?.connected) {
    return socket;
  }

  const token = getAccessToken();
  if (!token) {
    console.warn('No access token available for socket connection');
    return null;
  }

  socket = io({
    path: '/socket.io',
    auth: { token },
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function subscribeToTool(toolId: string): void {
  if (socket?.connected) {
    socket.emit('subscribe:tool', toolId);
  }
}

export function unsubscribeFromTool(toolId: string): void {
  if (socket?.connected) {
    socket.emit('unsubscribe:tool', toolId);
  }
}

export function onRecordChange(
  callback: (event: RecordChangeEvent) => void
): () => void {
  if (!socket) {
    return () => {};
  }

  socket.on('records:updated', callback);
  return () => {
    socket?.off('records:updated', callback);
  };
}
