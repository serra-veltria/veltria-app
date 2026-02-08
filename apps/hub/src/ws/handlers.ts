import { nanoid } from 'nanoid';
import { WSMessage, Message } from '@veltria/shared';
import { wsManager } from './manager';
import { getMessagesCollection } from '../db/mongo';
import { publishMessage } from '../pubsub/publisher';

export async function handleIncomingMessage(
  fromBeingId: string,
  orgId: string,
  wsMessage: WSMessage
): Promise<void> {
  if (wsMessage.type === 'message') {
    const to = wsMessage.to || '';
    
    // Create message record
    const message: Message = {
      id: nanoid(),
      orgId,
      from: fromBeingId,
      to,
      topic: wsMessage.topic,
      body: wsMessage.body,
      attachments: wsMessage.attachments,
      priority: 'normal',
      status: 'pending',
      createdAt: new Date(),
      replyTo: wsMessage.replyTo,
    };
    
    // Save to database
    const messages = getMessagesCollection();
    await messages.insertOne(message);
    
    // Publish to Redis Stream for async processing
    await publishMessage(message);
    
    // Send ACK back to sender
    wsManager.sendToBeing(fromBeingId, orgId, {
      type: 'ack',
      messageId: message.id,
    });
    
    // Handle broadcast
    if (to === '*') {
      wsManager.broadcast(orgId, {
        type: 'message',
        to: wsMessage.to,
        body: wsMessage.body,
        topic: wsMessage.topic,
        attachments: wsMessage.attachments,
        replyTo: wsMessage.replyTo,
      }, fromBeingId);
      
      // Update status
      await messages.updateOne(
        { id: message.id },
        { $set: { status: 'delivered', deliveredAt: new Date() } }
      );
    } else {
      // Direct message
      const sent = wsManager.sendToBeing(to, orgId, {
        type: 'message',
        to: wsMessage.to,
        body: wsMessage.body,
        topic: wsMessage.topic,
        attachments: wsMessage.attachments,
        replyTo: wsMessage.replyTo,
      });
      
      if (sent) {
        await messages.updateOne(
          { id: message.id },
          { $set: { status: 'delivered', deliveredAt: new Date() } }
        );
      }
    }
  } else if (wsMessage.type === 'presence') {
    // Broadcast presence update
    wsManager.broadcast(orgId, {
      type: 'presence',
      being: fromBeingId,
      status: wsMessage.status,
    });
  }
}

export function handleError(beingId: string, orgId: string, error: string): void {
  wsManager.sendToBeing(beingId, orgId, {
    type: 'error',
    error,
  });
}
