# @randajan/say

[![NPM](https://img.shields.io/npm/v/@randajan/say.svg)](https://www.npmjs.com/package/@randajan/say) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

A tiny, chainable phrase lookup helper for simple localization with fallbacks.

This project is a small toy for experimenting with callable objects and minimal translation tables.

## Installation

```bash
npm install @randajan/say
```

## Exports (CJS / ESM)

ESM:

```js
import Say, { Say as SayClass } from "@randajan/say";
```

CommonJS:

```js
const Say = require("@randajan/say");
const { Say: SayClass } = require("@randajan/say");
```

## API

### `new Say(options)`

Creates a callable instance that can be invoked like a function: `say("phraseId", "en")`.

Options:
- `langs` (`string[]`): Ordered list of language codes.
- `translations` (`Record<string, string[]>`): Phrase table, where each entry aligns with `langs`.
- `defaultLang` (`string`): Default language to use when none is provided. If omitted, `langs[0]` is used. Can be changed later via `setLang`.
- `parent` (`Say | null`): Optional parent instance for fallback lookups.

### `say(phraseId, lang?)`

Returns the translation for `phraseId` in `lang` or the current default language. Falls back to `parent` if not found.

### `bindLang(lang)`

Returns a new instance with `defaultLang` set to `lang`, keeping the same language list and parent chain.

### `setLang(lang)`

Mutates the current instance by setting `defaultLang` to `lang` and returns the same instance.

### `extend({ defaultLang, langs, translations } = {})`

Creates a new instance that can override `defaultLang`, `langs`, or `translations` and chains the current instance as `parent`.

### `append(brother)`

Appends another `Say` instance as a "brother" for fallback lookups. Returns the same instance. `brother` must be an instance of `Say`.

### `has(phraseId, lang?)`

Returns `true` if the phrase exists (including via fallback), otherwise `false`.

### `sayOr(phraseId, fallback, lang?)`

Returns the phrase if found; otherwise returns `fallback`.

## License

MIT
