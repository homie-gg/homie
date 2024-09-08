import { config } from '@/config'
import { FileNotFoundException } from '@/lib/storage/exceptions/file-not-found-exception'
import { Storage } from '@/lib/storage/types'
import {
  S3Client,
  CopyObjectCommand,
  PutObjectCommand,
  ListObjectsCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'

const createS3Client = () =>
  new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: process.env.AWS_SECRET_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

export const s3: Storage = {
  getUrl: function (file: string): string {
    return `${config.storage.cdnUrl}/${file}`
  },
  getPath: function (file: string): string {
    return `s3://${config.storage.s3Bucket}/${file}`
  },
  move: async function (oldPath: string, newPath: string): Promise<void> {
    const client = createS3Client()

    await client.send(
      new CopyObjectCommand({
        Bucket: config.storage.s3Bucket,
        CopySource: `${config.storage.s3Bucket}/${oldPath}`,
        Key: newPath,
      }),
    )

    await this.delete(oldPath)
  },
  put: async function (file: string, contents: string | Buffer): Promise<void> {
    const client = createS3Client()

    const Body =
      typeof contents === 'string' ? Buffer.from(contents, 'binary') : contents

    await client.send(
      new PutObjectCommand({
        Bucket: config.storage.s3Bucket,
        Key: file,
        ContentType: 'binary',
        Body,
      }),
    )
  },
  deleteDirectory: async function (directory: string): Promise<boolean> {
    const client = createS3Client()

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
    const client = createS3Client()

    await client.send(
      new DeleteObjectCommand({
        Bucket: config.storage.s3Bucket,
        Key: `${file}`,
      }),
    )
  },
  read: async function (file: string): Promise<Buffer> {
    const client = createS3Client()

    const res = await client.send(
      new GetObjectCommand({
        Bucket: config.storage.s3Bucket,
        Key: file,
      }),
    )

    if (!res.Body) {
      throw new FileNotFoundException(file)
    }

    return Buffer.from(await res.Body.transformToByteArray())
  },
}
