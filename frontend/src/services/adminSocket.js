import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

export const ADMIN_SOCKET_EVENTS = {
  CONNECTED: 'admin:connected',
  CAMPAIGN_UPDATE: 'admin:campaign:update',
  REVENUE_UPDATE: 'admin:revenue:update',
  ORDER_UPDATE: 'admin:order:update',
  METRICS_UPDATE: 'admin:metrics:update'
};

let adminSocket = null;

export function getAdminSocket() {
  if (!adminSocket) {
    adminSocket = io(`${API_BASE_URL}/admin`, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
  }
  return adminSocket;
}

