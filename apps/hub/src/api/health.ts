import { FastifyInstance } from 'fastify';
import { wsManager } from '../ws/manager';
import { getRedisClient } from '../db/redis';
import { db } from '../db/mongo';

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async (request, reply) => {
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      connections: wsManager.getOnlineCount(),
    };
    
    // Check MongoDB
    try {
      await db.admin().ping();
      health.mongodb = 'ok';
    } catch (err) {
      health.mongodb = 'error';
      health.status = 'degraded';
    }
    
    // Check Redis
    try {
      await getRedisClient().ping();
      health.redis = 'ok';
    } catch (err) {
      health.redis = 'error';
      health.status = 'degraded';
    }
    
    return reply.send(health);
  });
  
  app.get('/api/stats', async (request, reply) => {
    return reply.send({
      connections: wsManager.getOnlineCount(),
      onlineBeings: wsManager.getAllConnections().map(c => c.beingId),
    });
  });
}
