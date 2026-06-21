# @randajan/say

Tiny i18n dictionary with callable sugar, number inflection, and shared date/time formatting.

`say("hello")`  
`say.num("hours", 3)`  
`say.dateTime(Date.now())`  
Done.

## Install

```bash
npm install @randajan/say
```

## Quick Start

```js
import Lexicon from "@randajan/say";
import en from "@randajan/say/defaults/locales/en";
import cs from "@randajan/say/defaults/locales/cs";

const lexicon = new Lexicon({
    locales: [en, cs],
    translations: {
        hello: ["Hello", "Ahoj"],
        hours: ["{#} hour[s]", "{#} hodin[|a|y|]"]
    },
    dateOptions: {
        timeZone: "UTC",
        style: "2-digit",
        second: "none"
    }
});

const sayEn = lexicon.select("en");
const sayCs = lexicon.select("cs");

sayEn("hello");        // "Hello"
sayEn.num("hours", 1); // "1 hour"
sayEn.num("hours", 3); // "3 hours"

sayCs("hello");        // "Ahoj"
sayCs.num("hours", 1); // "1 hodina"
sayCs.num("hours", 3); // "3 hodiny"
sayCs.num("hours", 5); // "5 hodin"

sayEn.dateTime("2024-01-02T03:04:05.678Z", { weekday: "short" }); // shared defaults + call override
sayCs.time("bad-input"); // "Neplatné datum" (from locale.invalidDate)
```

## Exports

### Main package

```js
import Lexicon, { Lexicon as LexiconClass, Locale, Say } from "@randajan/say";
```

`default` export is `Lexicon`.

### Locale defaults

```js
import en from "@randajan/say/defaults/locales/en";
import de from "@randajan/say/defaults/locales/de";
import cs from "@randajan/say/defaults/locales/cs";
import sk from "@randajan/say/defaults/locales/sk";
import pl from "@randajan/say/defaults/locales/pl";
```

## Mental Model

- `Lexicon`: translations + fallback graph.
- `Locale`: number + date/time formatting + inflection selector.
- `Say`: callable view bound to one locale.

`select(localeId)` gives you a `say` function:

```js
const say = lexicon.select("en");
say("hello");
say.or("missing", "<fallback>");
say.num("hours", 2);
say.date(new Date());
say.time(Date.now());
say.dateTime("2024-01-02T03:04:05.678Z");
```

## API

### `new Lexicon({ locales, translations, parent, dateOptions } = {})`

- `locales`: array of `Locale | string | object`.
- `translations`: `Record<string, string[]>` aligned by `locales` index.
- `parent`: optional parent `Lexicon`.
- `dateOptions`: shared defaults for `say.date`, `say.time`, and `say.dateTime`.

Locale IDs are matched exactly (`"en"` is not `"en-GB"`).

### `lexicon.lookup(localeId, phraseId, throwError = true)`

Lookup order:

1. self
2. siblings
3. parent

If nothing is found and `throwError === true`, throws.

### `lexicon.resolveLocale(localeId, throwError = true)`

Resolve order:

1. self
2. parent
3. siblings

If not found and `throwError === true`, throws.

### `lexicon.select(localeId)`

Returns a callable `Say` instance bound to resolved `Locale`.

### `lexicon.extend({ locales, translations, dateOptions } = {})`

Creates a child `Lexicon` with `parent = this`.

If `dateOptions` is omitted, the child keeps the parent's date/time defaults.

### `lexicon.addSibling(lexicon)`

Adds sibling lexicon for lookup fallback.

### `say(phraseId)`

Returns phrase or fallback `"{phraseId}"`.

### `say.has(phraseId)`

Returns boolean.

### `say.or(phraseId, fallback)`

Returns phrase or custom fallback.

### `say.num(phraseId, num, opt = {})`

Uses locale inflection on phrase template.

If phrase is missing, fallback template is used: `{{#} phraseId}`.

### `say.date(value = Date.now(), opt = {})`

Returns localized date string (`toLocaleDateString`) using shared date/time options.

### `say.time(value = Date.now(), opt = {})`

Returns localized time string (`toLocaleTimeString`) using shared date/time options.

### `say.dateTime(value = Date.now(), opt = {})`

Returns localized date-time string (`toLocaleString`) using shared date/time options.

`value` can be `Date`, timestamp, or date-like string.

If value is invalid date, output is:

- `opt.invalidDate` (if provided)
- otherwise `locale.invalidDate`

### `say.all(text)`

Replaces all letter words in `text` using `say`.

### `new Locale({ ... })`

Main options:

- `id`: locale ID for `toLocaleString`.
- `inflectSelector(number, patternArray)`.
- `numberPlaceholder` (default `"{#}"`).
- `nanSymbol` (default `"?"`), `nanSelect`.
- `infinitySymbol` (default `"\\u221E"`), `infinitySelect`.
- `invalidDate` (default `"?"`): fallback for invalid date input in `say.date*`.

## Phrase Patterns

Use `"{#}"` for number and one bracket pattern for inflection.

Examples:

```js
"{#} hour[s]"         // en default: 1 hour, 2 hours
"{#} hodin[|a|y|]"    // cs default: 1 hodina, 2 hodiny, 5 hodin
"{#} [is|are] open"   // custom selector can pick a full word
```

Pattern content goes to `inflectSelector(number, patternArray)`.

## `say.num` options

- `decimal`: `number` or `[min, max]` for fraction digits.
- `noZero`: hide output when rounded number is zero.
- `noNaN`: hide output for `NaN`.
- `noInfinity`: hide output for `Infinity`.
- `noBS`: hide all non-finite and zero shortcuts.
- `nanSymbol`: override locale NaN symbol.
- `infinitySymbol`: override locale infinity symbol.

## `say.date`, `say.time`, `say.dateTime` options

Date/time options are merged in this order:

1. `lexicon.dateOptions`
2. optional `Say` constructor defaults
3. call options passed to `say.date*`

The result is forwarded to the native locale formatter:

- `say.date(...)`: `toLocaleDateString`
- `say.time(...)`: `toLocaleTimeString`
- `say.dateTime(...)`: `toLocaleString`

Supported options:

- `style`: `"numeric"` (default) or `"2-digit"`. It fills missing `year`, `month`, `day`, `hour`, `minute`, and `second` options.
- any `Intl.DateTimeFormatOptions` component option, such as `timeZone`, `weekday`, `year`, `month`, `day`, `hour`, `minute`, `second`, `hour12`, or `dayPeriod`.
- `null`, `"none"`, and `"hide"` remove an option before native formatting. This is useful when you set global defaults and want to hide one component.
- `invalidDate`: override fallback for invalid date values.

Example:

```js
const lexicon = new Lexicon({
    locales: [en, cs],
    translations: {},
    dateOptions: {
        timeZone: "UTC",
        style: "2-digit",
        second: "none"
    }
});

const say = lexicon.select("en");

say.dateTime("2024-01-02T03:04:05.678Z", {
    weekday: "short"
});

say.time("2024-01-02T03:04:05.678Z", {
    timeZone: "UTC",
    second: "numeric"
});

say.date("bad-input"); // from locale.invalidDate
say.date("bad-input", { invalidDate: "<custom>" }); // "<custom>"
```

## Defaults Strategy

Built-in locale defaults are intentionally small:

- `en`, `de` share English inflection selector.
- `cs`, `sk` share Czech-style selector.
- `pl` has dedicated selector.

If you need strict grammar rules, pass your own `Locale` instances.

## License

MIT
