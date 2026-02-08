import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { uploadFile, downloadFile, getFileMetadata } from '../storage/minio';

export async function registerFilesRoutes(app: FastifyInstance): Promise<void> {
  // Upload a file
  app.post('/api/files', async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file provided' });
    }
    
    const buffer = await data.toBuffer();
    const fileId = nanoid();
    const filename = data.filename;
    const mimeType = data.mimetype;
    
    await uploadFile(fileId, buffer, {
      'Content-Type': mimeType,
      'Original-Filename': filename,
    });
    
    return reply.code(201).send({
      fileId,
      name: filename,
      mimeType,
      size: buffer.length,
    });
  });
  
  // Download a file
  app.get('/api/files/:fileId', async (request, reply) => {
    const { fileId } = request.params as { fileId: string };
    
    try {
      const metadata = await getFileMetadata(fileId);
      const buffer = await downloadFile(fileId);
      
      reply.header('Content-Type', metadata.metaData['content-type'] || 'application/octet-stream');
      reply.header('Content-Length', metadata.size);
      
      if (metadata.metaData['original-filename']) {
        reply.header('Content-Disposition', `attachment; filename="${metadata.metaData['original-filename']}"`);
      }
      
      return reply.send(buffer);
    } catch (err: any) {
      if (err.code === 'NotFound') {
        return reply.code(404).send({ error: 'File not found' });
      }
      throw err;
    }
  });
  
  // Get file metadata
  app.get('/api/files/:fileId/metadata', async (request, reply) => {
    const { fileId } = request.params as { fileId: string };
    
    try {
      const metadata = await getFileMetadata(fileId);
      
      return reply.send({
        fileId,
        size: metadata.size,
        mimeType: metadata.metaData['content-type'],
        name: metadata.metaData['original-filename'],
        lastModified: metadata.lastModified,
      });
    } catch (err: any) {
      if (err.code === 'NotFound') {
        return reply.code(404).send({ error: 'File not found' });
      }
      throw err;
    }
  });
}
