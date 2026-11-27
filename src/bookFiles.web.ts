// Web preview twin of bookFiles.ts: pages live in AsyncStorage (localStorage).
import { storage } from './store';

export type Pages = string[][];

export const savePages = (id: string, pages: Pages) => storage.write('pages:' + id, pages);
export const loadPages = (id: string): Promise<Pages | null> => storage.read<Pages | null>('pages:' + id, null);
export const savePdf = async (_id: string, _uri: string) => {};
export const pdfUri = (_id: string): string | null => null;
export const deletePages = (id: string) => storage.remove('pages:' + id);

export const saveDraft = (id: string, raw: unknown[]) => storage.write('draft:' + id, raw);
export const loadDraft = (id: string): Promise<any[] | null> => storage.read<any[] | null>('draft:' + id, null);
export const deleteDraft = (id: string) => storage.remove('draft:' + id);

// On web the picked file is a blob: URL.
export const readBytes = async (uri: string) => new Uint8Array(await (await fetch(uri)).arrayBuffer());
