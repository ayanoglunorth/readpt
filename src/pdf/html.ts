import { PDFJS, PDFJS_WORKER } from './pdfjsSource';
import { PAGE_JS } from './pageScript';

// Page that loads pdf.js and its worker (the worker script on the main thread makes pdf.js use it as a "fake worker"),
// then runs `autorun` (a JS expression such as `__run({url: "..."})`) when given.
export const pdfHtml = (autorun?: string) =>
  `<!doctype html><html><head><meta charset="utf-8"></head><body><script>${PDFJS}</script><script>${PDFJS_WORKER}</script><script>${PAGE_JS}</script>${autorun ? `<script>${autorun}</script>` : ''}</body></html>`;
