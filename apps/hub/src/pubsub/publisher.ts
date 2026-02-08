import { getRedisClient } from '../db/redis';
import { config } from '../config';
import { Message } from '@veltria/shared';

export async function publishMessage(message: Message): Promise<void> {
  const redis = getRedisClient();
  
  await redis.xadd(
    config.redis.streamName,
    '*',
    'messageId', message.id,
    'from', message.from,
    'to', message.to,
    'data', JSON.stringify(message)
  );
}
