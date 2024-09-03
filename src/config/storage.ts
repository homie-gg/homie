interface StorageConfig {
  driver: 'local' | 's3'
  cdnUrl: string | undefined
  s3Bucket: string | undefined
}

export const storage: StorageConfig = {
  driver: (process.env.STORAGE_DRIVER as any) ?? 'local',
  cdnUrl: process.env.STORAGE_CDN_URL,
  s3Bucket: process.env.STORAGE_S3_BUCKET,
}
