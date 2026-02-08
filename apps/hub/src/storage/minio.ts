import { Client as MinioClient } from 'minio';
import { config } from '../config';

let minioClient: MinioClient;

export async function connectMinio(): Promise<void> {
  minioClient = new MinioClient({
    endPoint: config.minio.endPoint,
    port: config.minio.port,
    useSSL: config.minio.useSSL,
    accessKey: config.minio.accessKey,
    secretKey: config.minio.secretKey,
  });
  
  // Ensure bucket exists
  const bucketExists = await minioClient.bucketExists(config.minio.bucket);
  if (!bucketExists) {
    await minioClient.makeBucket(config.minio.bucket, 'us-east-1');
    console.log(`✓ Created MinIO bucket: ${config.minio.bucket}`);
  }
  
  console.log('✓ Connected to MinIO');
}

export function getMinioClient(): MinioClient {
  return minioClient;
}

export async function uploadFile(
  fileId: string,
  buffer: Buffer,
  metadata?: Record<string, string>
): Promise<void> {
  await minioClient.putObject(
    config.minio.bucket,
    fileId,
    buffer,
    buffer.length,
    metadata
  );
}

export async function downloadFile(fileId: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const stream = await minioClient.getObject(config.minio.bucket, fileId);
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export async function getFileMetadata(fileId: string): Promise<any> {
  return await minioClient.statObject(config.minio.bucket, fileId);
}
