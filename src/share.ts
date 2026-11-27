// Hands a text file (CSV, Anki TSV) to the Android share sheet.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function shareText(name: string, text: string, mime: string) {
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(text);
  await Sharing.shareAsync(f.uri, { mimeType: mime, dialogTitle: name });
}
