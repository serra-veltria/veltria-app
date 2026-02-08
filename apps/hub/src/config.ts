export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'veltria-hub-secret-change-in-production',
  },
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://veltria:veltria-hub-2026@mongodb:27017/veltria?authSource=admin',
    database: process.env.MONGODB_DATABASE || 'veltria',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    streamName: process.env.REDIS_STREAM || 'veltria:messages',
  },
  
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'veltria',
    secretKey: process.env.MINIO_SECRET_KEY || 'veltria-minio-2026',
    bucket: process.env.MINIO_BUCKET || 'veltria-files',
  },
};
