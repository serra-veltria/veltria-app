import { getRedisClient } from '../db/redis';
import { config } from '../config';
import { wsManager } from '../ws/manager';
import { Message } from '@veltria/shared';

let consumerRunning = false;

export async function startMessageConsumer(): Promise<void> {
  if (consumerRunning) return;
  
  consumerRunning = true;
  const redis = getRedisClient();
  const consumerGroup = 'veltria-hub-consumers';
  const consumerName = `consumer-${process.pid}`;
  
  // Create consumer group if it doesn't exist
  try {
    await redis.xgroup(
      'CREATE',
      config.redis.streamName,
      consumerGroup,
      '0',
      'MKSTREAM'
    );
  } catch (err: any) {
    // Group might already exist
    if (!err.message.includes('BUSYGROUP')) {
      console.error('Error creating consumer group:', err);
    }
  }
  
  console.log('✓ Message consumer started');
  
  // Consumer loop
  while (consumerRunning) {
    try {
      // Type assertion needed because ioredis types don't include BLOCK as valid argument
      const results = await (redis.xreadgroup as any)(
        'GROUP',
        consumerGroup,
        consumerName,
        'BLOCK',
        5000,
        'COUNT',
        10,
        'STREAMS',
        config.redis.streamName,
        '>'
      ) as [string, [string, string[]][]][] | null;
      
      if (results && results.length > 0) {
        for (const [_stream, messages] of results) {
          for (const [messageId, fields] of messages) {
            try {
              const dataIndex = fields.findIndex((f: string, i: number) => f === 'data' && i % 2 === 0);
              if (dataIndex !== -1 && dataIndex + 1 < fields.length) {
                const messageJson = fields[dataIndex + 1];
                const message: Message = JSON.parse(messageJson);
                
                // Deliver to connected being if online
                if (message.to !== '*' && wsManager.isOnline(message.to, message.orgId)) {
                  wsManager.sendToBeing(message.to, message.orgId, {
                    type: 'message',
                    body: message.body,
                    topic: message.topic,
                    attachments: message.attachments,
                    replyTo: message.replyTo,
                  });
                }
                
                // ACK the message
                await redis.xack(config.redis.streamName, consumerGroup, messageId);
              }
            } catch (err: unknown) {
              console.error('Error processing message:', err);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error('Consumer error:', err);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

export function stopMessageConsumer(): void {
  consumerRunning = false;
  console.log('✓ Message consumer stopped');
}
