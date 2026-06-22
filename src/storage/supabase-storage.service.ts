import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { StorageClient } from '@supabase/storage-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class SupabaseStorageService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private storage: StorageClient;
  private bucket: string = '';
  private publicUrlBase: string = '';

  onModuleInit() {
    const url = process.env.SUPABASE_URL?.replace(/\/$/, '') ?? '';
    const key = process.env.SUPABASE_SERVICE_KEY ?? '';
    this.bucket = process.env.SUPABASE_BUCKET ?? 'media';

    if (!url || !key) {
      this.logger.warn(
        'SUPABASE_URL / SUPABASE_SERVICE_KEY не заданы — загрузка файлов будет недоступна.',
      );
    }

    this.storage = new StorageClient(`${url}/storage/v1`, {
      apikey: key,
      Authorization: `Bearer ${key}`,
    });

    // Публичные URL: {url}/storage/v1/object/public/{bucket}/{key}
    this.publicUrlBase = `${url}/storage/v1/object/public/${this.bucket}`;
  }

  buildKey(prefix: string, originalName: string): string {
    const ext = extname(originalName) || '.jpg';
    return `${prefix}/${randomUUID()}${ext}`;
  }

  async upload(buffer: Buffer, key: string, contentType: string): Promise<string> {
    const { error } = await this.storage
      .from(this.bucket)
      .upload(key, buffer, { contentType, upsert: false });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    return `${this.publicUrlBase}/${key}`;
  }

  async deleteByUrl(url: string | null | undefined): Promise<void> {
    if (!url) return;
    const prefix = `${this.publicUrlBase}/`;
    if (!url.startsWith(prefix)) return;
    const key = url.slice(prefix.length);
    if (!key) return;
    try {
      await this.storage.from(this.bucket).remove([key]);
    } catch {
      // Удаление best-effort.
    }
  }
}
