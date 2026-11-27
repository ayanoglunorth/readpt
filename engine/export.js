// Word notebook export: CSV (Excel/Sheets) and Anki-importable TSV. Pure; runs in Node too.
// Columns: word, translation, sentence, language pair, date (YYYY-MM-DD).
import { DS } from './ds.js';

  const row = w => [w.word, w.translation || '', w.context || '', `${w.from}-${w.to}`, new Date(w.at).toISOString().slice(0, 10)];
  // A leading = + - @ (or tab/CR) would run as a spreadsheet formula (subtitle text is page-controlled), so it gets a ' prefix.
  const csvField = s => {
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };

  // BOM first so Excel reads the Turkish letters as UTF-8.
  DS.toCsv = words => '﻿' + [['Kelime', 'Çeviri', 'Cümle', 'Dil çifti', 'Tarih'], ...words.map(row)]
    .map(r => r.map(csvField).join(',')).join('\r\n') + '\r\n';

  // Anki's text import reads the "#" header lines; tabs and line breaks inside a field would break the row, so they become spaces.
  DS.toAnki = words => '#separator:tab\n#html:false\n' + words
    .map(w => row(w).map(s => s.replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n') + '\n';
export default DS;
