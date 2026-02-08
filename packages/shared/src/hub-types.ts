// Hub types - for Veltria messaging hub
export interface Being {
  id: string;
  orgId: string;
  name: string;
  tokenHash: string;
  createdAt: Date;
  lastSeen: Date;
  status: 'online' | 'offline' | 'away';
}

export interface Attachment {
  fileId: string;
  name: string;
  mimeType?: string;
  size?: number;
}

export interface Message {
  id: string;
  orgId: string;
  from: string;
  to: string;
  topic?: string;
  body?: string;
  attachments?: Attachment[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'delivered' | 'read' | 'failed';
  deliveredAt?: Date;
  createdAt: Date;
  replyTo?: string;
}

export interface WSMessage {
  type: 'message' | 'presence' | 'ack' | 'error';
  to?: string;
  body?: string;
  topic?: string;
  attachments?: Attachment[];
  replyTo?: string;
  being?: string;
  status?: string;
  error?: string;
  messageId?: string;
}

export interface BeingConnection {
  beingId: string;
  orgId: string;
  socket: any; // WebSocket
  lastActivity: Date;
}

export interface JwtPayload {
  userId: string;
  orgId: string;
  beingId?: string;
  role: 'admin' | 'member' | 'being';
  iat?: number;
  exp?: number;
}
