import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import { WebSocket } from 'ws';
import { config } from './config';
import { connectMongo, closeMongo, getBeingsCollection } from './db/mongo';
import { connectRedis, closeRedis } from './db/redis';
import { connectMinio } from './storage/minio';
import { wsManager } from './ws/manager';
import { authenticateWebSocket } from './ws/auth';
import { handleIncomingMessage, handleError } from './ws/handlers';
import { startMessageConsumer, stopMessageConsumer } from './pubsub/consumer';
import { registerBeingsRoutes } from './api/beings';
import { registerMessagesRoutes } from './api/messages';
import { registerFilesRoutes } from './api/files';
import { registerHealthRoutes } from './api/health';
import { WSMessage } from '@veltria/shared';

const app = Fastify({
  logger: true,
});

// Register plugins
app.register(fastifyWebsocket);
app.register(fastifyMultipart);

// WebSocket route
app.register(async (fastify) => {
  fastify.get('/ws/:beingId', { websocket: true }, (socket, req) => {
    const beingId = (req.params as any).beingId;
    const token = (req.query as any).token;
    
    if (!beingId || !token) {
      socket.close(1008, 'Missing beingId or token');
      return;
    }
    
    // Authenticate and extract orgId from token
    authenticateWebSocket(beingId, token).then(async (authenticated) => {
      if (!authenticated) {
        socket.close(1008, 'Authentication failed');
        return;
      }
      
      // Get being to retrieve orgId
      const beings = getBeingsCollection();
      const being = await beings.findOne({ id: beingId });
      
      if (!being) {
        socket.close(1008, 'Being not found');
        return;
      }
      
      const orgId = being.orgId;
      
      // Add connection
      wsManager.addConnection(beingId, orgId, socket as any);
      
      // Update being status
      await beings.updateOne(
        { id: beingId },
        { $set: { status: 'online', lastSeen: new Date() } }
      );
      
      // Broadcast presence
      wsManager.broadcast(orgId, {
        type: 'presence',
        being: beingId,
        status: 'online',
      });
      
      // Handle messages
      socket.on('message', async (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          await handleIncomingMessage(beingId, orgId, message);
        } catch (err: any) {
          console.error('Error handling message:', err);
          handleError(beingId, orgId, err.message || 'Invalid message');
        }
      });
      
      // Handle disconnect
      socket.on('close', async () => {
        wsManager.removeConnection(beingId, orgId);
        
        // Update being status
        await beings.updateOne(
          { id: beingId },
          { $set: { status: 'offline', lastSeen: new Date() } }
        );
        
        // Broadcast presence
        wsManager.broadcast(orgId, {
          type: 'presence',
          being: beingId,
          status: 'offline',
        });
      });
      
      socket.on('error', (err) => {
        console.error('WebSocket error:', err);
      });
    }).catch((err) => {
      console.error('Auth error:', err);
      socket.close(1011, 'Internal error');
    });
  });
});

// Register API routes
registerBeingsRoutes(app);
registerMessagesRoutes(app);
registerFilesRoutes(app);
registerHealthRoutes(app);

// Root route
app.get('/', async (request, reply) => {
  return reply.send({
    service: 'Veltria Hub',
    version: '1.0.0',
    status: 'running',
  });
});

// Startup
async function start() {
  try {
    // Connect to services
    await connectMongo();
    await connectRedis();
    await connectMinio();
    
    // Start message consumer
    startMessageConsumer();
    
    // Start server
    await app.listen({
      port: config.port,
      host: config.host,
    });
    
    console.log(`\n✓ Veltria Hub running on http://${config.host}:${config.port}`);
    console.log(`✓ WebSocket endpoint: ws://${config.host}:${config.port}/ws/:beingId?token=xxx\n`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Shutdown
async function shutdown() {
  console.log('\nShutting down...');
  stopMessageConsumer();
  await app.close();
  await closeMongo();
  await closeRedis();
  console.log('✓ Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
start();
