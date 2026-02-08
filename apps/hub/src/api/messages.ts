import { FastifyInstance } from 'fastify';
import { getMessagesCollection } from '../db/mongo';

export async function registerMessagesRoutes(app: FastifyInstance): Promise<void> {
  // Query messages
  app.get('/api/messages', async (request, reply) => {
    const { from, to, topic, status, limit = 100, skip = 0 } = request.query as {
      from?: string;
      to?: string;
      topic?: string;
      status?: string;
      limit?: number;
      skip?: number;
    };
    
    const messages = getMessagesCollection();
    const query: any = {};
    
    if (from) query.from = from;
    if (to) query.to = to;
    if (topic) query.topic = topic;
    if (status) query.status = status;
    
    const results = await messages
      .find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 1000))
      .toArray();
    
    return reply.send({ messages: results, count: results.length });
  });
  
  // Get a specific message
  app.get('/api/messages/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const messages = getMessagesCollection();
    
    const message = await messages.findOne({ id });
    
    if (!message) {
      return reply.code(404).send({ error: 'Message not found' });
    }
    
    return reply.send({ message });
  });
  
  // Get conversation between two beings
  app.get('/api/messages/conversation/:being1/:being2', async (request, reply) => {
    const { being1, being2 } = request.params as { being1: string; being2: string };
    const { limit = 100 } = request.query as { limit?: number };
    
    const messages = getMessagesCollection();
    
    const results = await messages
      .find({
        $or: [
          { from: being1, to: being2 },
          { from: being2, to: being1 },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 1000))
      .toArray();
    
    return reply.send({ messages: results, count: results.length });
  });
}
