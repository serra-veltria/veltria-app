import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { getBeingsCollection } from '../db/mongo';
import { Being } from '@veltria/shared';
import { generateToken, hashToken } from '../ws/auth';

export async function registerBeingsRoutes(app: FastifyInstance): Promise<void> {
  // Create a new being
  app.post('/api/beings', async (request, reply) => {
    const { name } = request.body as { name: string };
    
    if (!name || typeof name !== 'string') {
      return reply.code(400).send({ error: 'Name is required' });
    }
    
    // TODO: Extract orgId from JWT once auth middleware is in place
    // For now, use "default" as fallback
    const orgId = 'default';
    
    const beings = getBeingsCollection();
    
    // Check if being already exists in this org
    const existing = await beings.findOne({ name, orgId });
    if (existing) {
      return reply.code(409).send({ error: 'Being with this name already exists in this organization' });
    }
    
    // Generate token
    const beingId = nanoid();
    const token = generateToken(beingId, orgId);
    const tokenHash = hashToken(token);
    
    const being: Being = {
      id: beingId,
      orgId,
      name,
      tokenHash,
      createdAt: new Date(),
      lastSeen: new Date(),
      status: 'offline',
    };
    
    await beings.insertOne(being);
    
    return reply.code(201).send({
      being: {
        id: being.id,
        orgId: being.orgId,
        name: being.name,
        createdAt: being.createdAt,
        status: being.status,
      },
      token,
    });
  });
  
  // Get all beings
  app.get('/api/beings', async (request, reply) => {
    const beings = getBeingsCollection();
    const allBeings = await beings.find({}, {
      projection: { tokenHash: 0 },
    }).toArray();
    
    return reply.send({ beings: allBeings });
  });
  
  // Get a specific being
  app.get('/api/beings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const beings = getBeingsCollection();
    
    const being = await beings.findOne({ id }, {
      projection: { tokenHash: 0 },
    });
    
    if (!being) {
      return reply.code(404).send({ error: 'Being not found' });
    }
    
    return reply.send({ being });
  });
  
  // Delete a being
  app.delete('/api/beings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const beings = getBeingsCollection();
    
    const result = await beings.deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return reply.code(404).send({ error: 'Being not found' });
    }
    
    return reply.send({ success: true });
  });
  
  // Regenerate token
  app.post('/api/beings/:id/token', async (request, reply) => {
    const { id } = request.params as { id: string };
    const beings = getBeingsCollection();
    
    const being = await beings.findOne({ id });
    if (!being) {
      return reply.code(404).send({ error: 'Being not found' });
    }
    
    const newToken = generateToken(id, being.orgId);
    const newTokenHash = hashToken(newToken);
    
    await beings.updateOne(
      { id },
      { $set: { tokenHash: newTokenHash } }
    );
    
    return reply.send({ token: newToken });
  });
}
