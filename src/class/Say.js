import { solids } from "@randajan/props";

/**
 * @typedef {import("../dateTime").DateTimeOptions & object} SayDateOptions
 * @property {string} [invalidDate] Fallback returned for invalid date values.
 */

/**
 * Callable phrase accessor bound to one lexicon and one locale.
 * @extends {Function}
 */
export class Say extends Function {
    /**
     * @param {import("./Lexicon").Lexicon} lexicon
     * @param {import("./Locale").Locale} locale
     * @param {import("../dateTime").DateTimeOptions} [dateOptions={}]
     * Defaults merged into every date/time call.
     */
    constructor(lexicon, locale, dateOptions={}) {
        super();

        const _say = (phraseId) => _say.or(phraseId, `{${phraseId}}`);

        solids(_say, {lexicon, locale, dateOptions:Object.freeze(dateOptions)});

        return Object.setPrototypeOf(_say, new.target.prototype);
    }

    /**
     * Returns true when phrase exists for current locale.
     * @param {string} phraseId
     * @returns {boolean}
     */
    has(phraseId) {
        const { lexicon, locale } = this;
        return lexicon.lookup(locale.id, phraseId, false) != null;
    }

    /**
     * Resolves phrase or returns provided fallback.
     * @param {string} phraseId
     * @param {string} fallback
     * @returns {string}
     */
    or(phraseId, fallback) {
        const { lexicon, locale } = this;
        return lexicon.lookup(locale.id, phraseId, false) ?? fallback;
    }

    /**
     * Inflects phrase using locale rules and formatted number.
     * @param {string} phraseId
     * @param {number} num
     * @param {import("./Locale").InflectOptions} [opt={}]
     * @returns {string}
     */
    num(phraseId, num, opt={}) {
        const { locale } = this;
        const phrase = this.or(phraseId, `{{#} ${phraseId}}`);
        return locale.inflect(phrase, num, opt);
    }

    /**
     * Formats date part only for current locale.
     * @param {Date|number|string} [value=Date.now()]
     * @param {SayDateOptions} [opt={}]
     * @returns {string}
     */
    date(value=Date.now(), opt={}) {
        const { lexicon, locale, dateOptions } = this;
        return locale._formatDate(value, {...lexicon.dateOptions, ...dateOptions, ...opt}, "Date");
    }

    /**
     * Formats localized date and time.
     * @param {Date|number|string} [value=Date.now()]
     * @param {SayDateOptions} [opt={}]
     * @returns {string}
     */
    dateTime(value=Date.now(), opt={}) {
        const { lexicon, locale, dateOptions } = this;
        return locale._formatDate(value, {...lexicon.dateOptions, ...dateOptions, ...opt});
    }

    /**
     * Formats time part only for current locale.
     * @param {Date|number|string} [value=Date.now()]
     * @param {SayDateOptions} [opt={}]
     * @returns {string}
     */
    time(value=Date.now(), opt={}) {
        const { lexicon, locale, dateOptions } = this;
        return locale._formatDate(value, {...lexicon.dateOptions, ...dateOptions, ...opt}, "Time");
    }

    /**
     * Replaces every letter-word in text by dictionary lookup.
     * @param {string} text
     * @returns {string}
     */
    all(text) {
        return String(text ?? "").replace(/\p{L}+/gu, this);
    }
}
