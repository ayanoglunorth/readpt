// Writes a small text PDF for trying the importer: node scripts/make-sample-pdf.mjs out.pdf
import fs from 'node:fs';
const pages = [
  ['The Lantern Keeper', '', 'Harry walked along the cobblestone road. The gloomy night was cold, and he scowled at the dagger in his hand.', 'He was determined to reach the village before dawn, but the reluctantly sleeping guard blocked the gate.', '', 'A second paragraph begins here and talks about a harbor, a merchant, and a vanishing lantern.'],
  ['The Lantern Keeper', '', 'Harry whispered a warning to the merchant. The lantern flickered and vanished into the fog.', 'Nobody dared to follow the stranger through the narrow alley.'],
  ['The Lantern Keeper', '', 'At dawn the harbor woke slowly. Gulls circled above the abandoned ships while Harry counted his coins.', 'He had never felt so exhausted and yet so alive.'],
  ['The Lantern Keeper', '', 'The captain greeted him with suspicion. A treacherous voyage awaited them across the stormy sea.'],
];
let out = '%PDF-1.4\n';
const off = [];
const obj = s => { off.push(out.length); out += `${off.length} 0 obj\n${s}\nendobj\n`; };
obj('<< /Type /Catalog /Pages 2 0 R >>');
const kids = pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ');
obj(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
pages.forEach((lines, i) => {
  let c = 'BT /F1 12 Tf 14 TL 60 740 Td\n';
  lines.forEach(l => { c += `(${l}) Tj T*\n`; });
  c += 'ET\nBT /F1 10 Tf 300 30 Td (' + (i + 1) + ') Tj ET';
  obj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${5 + i * 2} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`);
  obj(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`);
});
const x = out.length;
out += `xref\n0 ${off.length + 1}\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${off.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
fs.writeFileSync(process.argv[2], out, 'latin1');
