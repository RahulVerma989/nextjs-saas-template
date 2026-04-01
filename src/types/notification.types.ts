import type { NotificationType } from './db.types';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}
