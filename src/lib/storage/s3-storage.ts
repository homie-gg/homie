import { config } from '@/config'
import { Storage } from '@/lib/storage/types'
import {
  S3Client,
  CopyObjectCommand,
  PutObjectCommand,
  ListObjectsCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'

export const s3: Storage = {
  getUrl: function (file: string): string {
    return `${config.storage.cdnUrl}/${file}`
  },
  getPath: function (file: string): string {
    return `s3://${config.storage.s3Bucket}/${file}`
  },
  move: async function (oldPath: string, newPath: string): Promise<void> {
    const client = new S3Client({ region: config.aws.region })

    await client.send(
      new CopyObjectCommand({
        Bucket: config.storage.s3Bucket,
        CopySource: `${config.storage.s3Bucket}/${oldPath}`,
        Key: newPath,
      }),
    )
  },
  put: async function (file: string, contents: string): Promise<void> {
    const client = new S3Client({ region: config.aws.region })

    await client.send(
      new PutObjectCommand({
        Bucket: config.storage.s3Bucket,
        Key: file,
        ACL: 'public-read',
        ContentType: 'binary',
        Body: Buffer.from(contents, 'binary'),
      }),
    )
  },
  deleteDirectory: async function (directory: string): Promise<boolean> {
    const client = new S3Client({ region: config.aws.region })

    const objects = await client.send(
      new ListObjectsCommand({
        Bucket: config.storage.s3Bucket,
        Prefix: directory,
      }),
    )

    if (!objects.Contents?.length) {
      return true
    }

    await client.send(
      new DeleteObjectsCommand({
        Bucket: config.storage.s3Bucket,
        Delete: {
          Objects: objects.Contents.filter((object) => !!object.Key).map(
            (object) => ({ Key: object.Key }),
          ),
        },
      }),
    )

    return true
  },
  delete: async function (file: string): Promise<void> {
    const client = new S3Client({ region: config.aws.region })

    await client.send(
      new DeleteObjectCommand({
        Bucket: config.storage.s3Bucket,
        Key: `${config.storage.s3Bucket}/${file}`,
      }),
    )
  },
}
