import { WebSocket } from 'ws';
import { BeingConnection, WSMessage } from '@veltria/shared';

class WebSocketManager {
  private connections: Map<string, BeingConnection> = new Map();
  
  private getConnectionKey(orgId: string, beingId: string): string {
    return `${orgId}:${beingId}`;
  }
  
  addConnection(beingId: string, orgId: string, socket: WebSocket): void {
    const key = this.getConnectionKey(orgId, beingId);
    this.connections.set(key, {
      beingId,
      orgId,
      socket,
      lastActivity: new Date(),
    });
    console.log(`✓ Being ${beingId} (org: ${orgId}) connected (${this.connections.size} total)`);
  }
  
  removeConnection(beingId: string, orgId: string): void {
    const key = this.getConnectionKey(orgId, beingId);
    this.connections.delete(key);
    console.log(`✓ Being ${beingId} (org: ${orgId}) disconnected (${this.connections.size} total)`);
  }
  
  getConnection(beingId: string, orgId: string): BeingConnection | undefined {
    const key = this.getConnectionKey(orgId, beingId);
    return this.connections.get(key);
  }
  
  getAllConnections(): BeingConnection[] {
    return Array.from(this.connections.values());
  }
  
  isOnline(beingId: string, orgId: string): boolean {
    const key = this.getConnectionKey(orgId, beingId);
    return this.connections.has(key);
  }
  
  sendToBeing(beingId: string, orgId: string, message: WSMessage): boolean {
    const conn = this.getConnection(beingId, orgId);
    if (conn && conn.socket.readyState === WebSocket.OPEN) {
      conn.socket.send(JSON.stringify(message));
      conn.lastActivity = new Date();
      return true;
    }
    return false;
  }
  
  broadcast(orgId: string, message: WSMessage, excludeBeingId?: string): void {
    for (const [_key, conn] of this.connections.entries()) {
      // Only broadcast to connections within the same organization
      if (conn.orgId === orgId && conn.beingId !== excludeBeingId && conn.socket.readyState === WebSocket.OPEN) {
        conn.socket.send(JSON.stringify(message));
        conn.lastActivity = new Date();
      }
    }
  }
  
  getOnlineCount(): number {
    return this.connections.size;
  }
}

export const wsManager = new WebSocketManager();
