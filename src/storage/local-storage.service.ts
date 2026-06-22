import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { promises as fs } from 'fs';

/**
 * Хранение медиафайлов на локальном диске сервера в каталоге ./uploads.
 * В БД сохраняются относительные пути (/uploads/...), наружу они отдаются
 * абсолютными через toAbsoluteMediaUrl (PUBLIC_APP_URL).
 */
@Injectable()
export class LocalStorageService {
  private readonly uploadsRoot = join(process.cwd(), 'uploads');

  buildKey(prefix: string, originalName: string): string {
    const ext = extname(originalName) || '.jpg';
    return `${prefix}/${randomUUID()}${ext}`;
  }

  /** Сохраняет буфер в ./uploads/<key> и возвращает относительный URL файла. */
  async upload(
    buffer: Buffer,
    key: string,
    _contentType: string,
  ): Promise<string> {
    const filePath = join(this.uploadsRoot, key);
    await fs.mkdir(join(this.uploadsRoot, key.split('/')[0]), {
      recursive: true,
    });
    await fs.writeFile(filePath, buffer);
    return `/uploads/${key}`;
  }

  /** Удаляет файл по его URL (абсолютному или относительному), если он лежит в /uploads. */
  async deleteByUrl(url: string | null | undefined): Promise<void> {
    if (!url) return;
    const match = String(url).match(/\/uploads\/(.+)$/);
    if (!match) return;
    const key = match[1];
    // Защита от выхода за пределы каталога uploads.
    if (key.includes('..')) return;
    try {
      await fs.unlink(join(this.uploadsRoot, key));
    } catch {
      // Удаление best-effort: отсутствие файла не должно ронять запрос.
    }
  }
}
