import fs from 'fs/promises';
import path from 'path';

/**
 * Penyimpanan JSON lokal (mode development tanpa Supabase).
 * Dipakai HANYA bila isSupabaseConfigured() === false — bukan fallback diam-diam.
 */

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

export async function readLocalJson<T>(fileName: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, fileName), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // File belum ada = data kosong; error lain (JSON rusak, izin) harus terlihat.
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

export async function writeLocalJson<T>(fileName: string, data: T[]): Promise<void> {
  await fs.writeFile(path.join(DATA_DIR, fileName), JSON.stringify(data, null, 2), 'utf-8');
}
