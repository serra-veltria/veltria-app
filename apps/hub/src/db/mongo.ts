import { MongoClient, Collection, Db } from 'mongodb';
import { config } from '../config';
import { Being, Message } from '@veltria/shared';

let client: MongoClient;
let db: Db;
let beings: Collection<Being>;
let messages: Collection<Message>;

export async function connectMongo(): Promise<void> {
  client = new MongoClient(config.mongodb.uri);
  await client.connect();
  console.log('✓ Connected to MongoDB');
  
  db = client.db(config.mongodb.database);
  beings = db.collection<Being>('beings');
  messages = db.collection<Message>('messages');
  
  // Create indexes
  await beings.createIndex({ name: 1 }, { unique: true });
  await beings.createIndex({ tokenHash: 1 });
  await messages.createIndex({ from: 1, createdAt: -1 });
  await messages.createIndex({ to: 1, createdAt: -1 });
  await messages.createIndex({ status: 1 });
  await messages.createIndex({ createdAt: -1 });
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    console.log('✓ MongoDB connection closed');
  }
}

export function getBeingsCollection(): Collection<Being> {
  return beings;
}

export function getMessagesCollection(): Collection<Message> {
  return messages;
}

export { db };
