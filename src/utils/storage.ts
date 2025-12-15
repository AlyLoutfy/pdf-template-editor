import { get, set, del } from 'idb-keyval';

/**
 * Saves a file blob to IndexedDB
 */
export async function saveFile(id: string, file: Blob): Promise<void> {
  await set(`file-${id}`, file);
}

/**
 * Retrieves a file blob from IndexedDB
 */
export async function getFile(id: string): Promise<Blob | undefined> {
  return await get(`file-${id}`);
}

/**
 * Deletes a file blob from IndexedDB
 */
export async function deleteFile(id: string): Promise<void> {
  await del(`file-${id}`);
}
