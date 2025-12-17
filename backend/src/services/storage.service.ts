import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { v4 as uuid } from 'uuid';
import { logger } from '../utils/logger';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export const storageService = {
  /**
   * Generate a presigned URL for direct client upload
   */
  async getPresignedUploadUrl(
    userId: string,
    folder: 'memories' | 'voice' | 'avatars',
    filename: string,
    contentType: string
  ): Promise<PresignedUploadResult> {
    const ext = filename.split('.').pop() || '';
    const key = `${folder}/${userId}/${uuid()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `https://${env.S3_BUCKET_NAME}.s3.${env.S3_BUCKET_REGION}.amazonaws.com/${key}`;

    logger.info(`Generated presigned upload URL for ${key}`);

    return { uploadUrl, key, publicUrl };
  },

  /**
   * Generate a presigned URL for secure file download
   */
  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  },

  /**
   * Upload a buffer directly (for server-side processing)
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const url = `https://${env.S3_BUCKET_NAME}.s3.${env.S3_BUCKET_REGION}.amazonaws.com/${key}`;

    logger.info(`Uploaded file to ${key}`);

    return { key, url, size: buffer.length };
  },

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    logger.info(`Deleted file ${key}`);
  },

  /**
   * Delete multiple files
   */
  async deleteFiles(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.deleteFile(key)));
  },

  /**
   * Generate storage key for different content types
   */
  generateKey(userId: string, type: 'memory' | 'voice' | 'avatar', extension: string): string {
    const folder = type === 'memory' ? 'memories' : type === 'voice' ? 'voice' : 'avatars';
    return `${folder}/${userId}/${uuid()}.${extension}`;
  },
};
