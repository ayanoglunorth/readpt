export type RawItem = { str: string; x: number; y: number; h: number; w?: number };
export type RawPage = { items: RawItem[] };
export type ExtractProps = {
  /** native: file:// uri of the PDF; web: the bytes */
  source: { uri: string; data?: ArrayBuffer };
  /** Resume an interrupted import: `initial` are the pages already read, `startAt` the next page (1-based). */
  initial?: RawPage[];
  startAt?: number;
  /** Called every CHUNK pages with everything read so far, so the caller can keep a draft. */
  onChunk?: (pages: RawPage[]) => void;
  onProgress: (n: number, total: number) => void;
  onDone: (pages: RawPage[]) => void;
  onError: (message: string) => void;
};

export const CHUNK = 50;

// One message from pageScript.ts.
export type PdfMessage =
  | { type: 'ready' }
  | { type: 'start'; total: number }
  | { type: 'page'; n: number; items: RawItem[] }
  | { type: 'done' }
  | { type: 'error'; message: string };
