# readpt

An Android-first app for learning English from a book you actually want to read. Import a PDF, choose a few pages, and take a short "do you know this word?" quiz on the words those pages contain. Then read with tap-to-translate and your phone's text-to-speech. Words you save go into a notebook with spaced-repetition practice and CSV or Anki export.

It is built with Expo and React Native. The interface is in Turkish, and the target language is English.

## The idea

Vocabulary apps teach words from a list somebody else chose. readpt starts from your book. The quiz covers the words on the pages you are about to read, ranked by word frequency, so you learn what the next ten pages will throw at you. A level test sets the starting point, and your answers decide which words come back.

## What it does

- Imports a PDF with selectable text. pdf.js runs inside a WebView and is bundled into the app, so reading works offline.
- Lets you pick a page range by typing two numbers, tapping a length preset, or touching a map of the whole book. The map shows what you have already read.
- Quizzes you on the words from those pages before you read them.
- Translates a tapped word on the device when it can (ML Kit on Android, Apple Translation on iOS 18 and later). Otherwise it asks a small translation service for that single word. Sentences are never sent.
- Reads the page aloud with the phone's text-to-speech.
- Saves words with their sentence, and schedules them for review at growing intervals. Exports to CSV and Anki.
- Three reading surfaces: paper, sepia and night.

The quiz, level test and review logic lives in `engine/`, plain JavaScript with no React, so it can be reused on iOS or elsewhere unchanged. It is a port of the engine in the [Looptions](https://github.com/ayanoglunorth/looptions) browser extension.

## Run it

You need Node.js and, for a phone build, the Android SDK or EAS Build.

```bash
npm install
npm test                   # 61 engine tests
npx tsc --noEmit           # type check
npx expo start --web       # browser preview
npx expo run:android       # build and run on a device or emulator
```

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_LOOKUP_URL` to your own translation worker (the code is in the [Looptions](https://github.com/ayanoglunorth/looptions) repository) if you want lookups beyond on-device translation.

In the browser preview, remote word lookups return 403 because the translation service only accepts requests from the app. `npx expo export -p android` bundles the Android app to Hermes bytecode.

## Layout

```text
engine/   quiz, placement test, spaced repetition, export (plain JS, tested)
src/app/  screens (Expo Router)
src/pdf/  pdf.js running in a WebView
scripts/  rebuilds the word-frequency list and the inlined pdf.js
docs/     design notes
```

The visual design is described in [`docs/DESIGN.md`](docs/DESIGN.md): cream paper, black ink, one orange, and hard offset shadows, drawn in code rather than with stock components.

## License

[MIT](LICENSE)
