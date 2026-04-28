import { solids } from "@randajan/props";
import { formatDecimalCfg, numFormat, toDate } from "../tools";

const _patternRegex = /\[.+\]/;
const _defaultInflectSelector = (() => {});

/**
 * @typedef {object} LocaleOptions
 * @property {string} id Locale identifier used by Intl formatters.
 * @property {(number: number, pattern: string[]) => (string|undefined)} [inflectSelector] Pattern selector for `inflect`.
 * @property {string} [numberPlaceholder] Placeholder replaced by formatted number.
 * @property {string} [nanSymbol] Replacement used for NaN values.
 * @property {number} [nanSelect] Pattern index used for NaN symbol.
 * @property {string} [infinitySymbol] Replacement used for infinity values.
 * @property {number} [infinitySelect] Pattern index used for infinity symbol.
 * @property {string} [invalidDate] Fallback returned when date value is invalid.
 */

/**
 * @typedef {object} InflectOptions
 * @property {number|number[]} [decimal] Fraction digits config.
 * @property {boolean} [noZero] Hide output if rounded number is zero.
 * @property {boolean} [noNaN] Hide output for NaN.
 * @property {boolean} [noInfinity] Hide output for infinity.
 * @property {boolean} [noBS] Hide all special shortcuts (NaN, infinity, zero).
 * @property {string} [nanSymbol] Overrides locale `nanSymbol`.
 * @property {string} [infinitySymbol] Overrides locale `infinitySymbol`.
 */

/**
 * Numeric and date formatting rules bound to a locale id.
 */
export class Locale {
    /**
     * Builds an id->index map for locale arrays.
     * @param {(string|Locale|{id:string})[]} [locales=[]]
     * @returns {Record<string, number>}
     */
    static makeLocalesIndex(locales = []) {
        const idx = {};
        for (let i = 0; i < locales.length; i++) {
            const item = locales[i];
            const id = typeof item === "string" ? item : item?.id;

            if (typeof id !== "string" || !id) {
                throw new TypeError(`Locale at index ${i} must have non-empty string 'id'.`);
            }
            if (idx[id] != null) {
                throw new Error(`Duplicate locale '${id}'.`);
            }
            idx[id] = i;
        }
        return idx;
    }

    /**
     * Normalizes locale input into a Locale instance.
     * @param {string|Locale|object} rawLocale
     * @param {(localeId:string)=>Locale|undefined} [resolveById]
     * @returns {Locale}
     */
    static normalize(rawLocale, resolveById) {
        if (rawLocale instanceof Locale) { return rawLocale; }

        if (typeof rawLocale === "string") {
            return resolveById?.(rawLocale) ?? new Locale({ id: rawLocale });
        }

        if (rawLocale && typeof rawLocale === "object") {
            const locale = new Locale(rawLocale);
            if (typeof locale.id !== "string" || !locale.id) {
                throw new TypeError(`Locale object must contain non-empty string 'id'.`);
            }
            return locale;
        }

        throw new TypeError(`Locale must be string, Locale instance, or object, got '${rawLocale}'`);
    }

    /**
     * Normalizes all locale inputs.
     * @param {(string|Locale|object)[]} [locales=[]]
     * @param {(localeId:string)=>Locale|undefined} [resolveById]
     * @param {boolean} [freeze=true]
     * @returns {Locale[]}
     */
    static normalizeAll(locales = [], resolveById, freeze=true) {
        const arr = (locales ?? []).map((rawLocale) => Locale.normalize(rawLocale, resolveById));
        return freeze ? Object.freeze(arr) : arr;
    }

    /**
     * @param {LocaleOptions} [options={}]
     */
    constructor({
        id,
        inflectSelector = _defaultInflectSelector,
        numberPlaceholder = "{#}",
        nanSymbol = "?",
        nanSelect = 0,
        infinitySymbol = "\u221E",
        infinitySelect = 0,
        invalidDate = "?",
    } = {}) {
        solids(this, {
            id,
            inflectSelector,
            numberPlaceholder,
            nanSymbol,
            nanSelect,
            infinitySymbol,
            infinitySelect,
            invalidDate,
            cachedPatterns: new Map()
        });
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.id;
    }

    _parsePattern(pattern) {
        return pattern.slice(1, -1).split("|");
    }

    _matchPattern(str) {
        const raw = (str.match(_patternRegex) || [])[0];
        if (!raw) { return {}; }

        const cache = this.cachedPatterns;
        let parsed = cache.get(raw);
        if (!parsed) { cache.set(raw, parsed = this._parsePattern(raw)); }

        return { raw, parsed };
    }

    _applyInflect(str, numStr, patternRaw, inflected) {
        const { numberPlaceholder } = this;
        if (patternRaw) { str = str.replace(patternRaw, inflected ?? ""); }
        return str.replace(numberPlaceholder, numStr);
    }

    _inflectByNum(str, numStr, number) {
        const p = this._matchPattern(str);
        if (p.parsed) { p.inflected = this.inflectSelector(number, p.parsed); }
        return this._applyInflect(str, numStr, p.raw, p.inflected);
    }

    _inflectDirect(str, numStr, selectKey) {
        const p = this._matchPattern(str);
        if (p.parsed) { p.inflected = p.parsed[selectKey]; }
        return this._applyInflect(str, numStr, p.raw, p.inflected);
    }

    /**
     * Internal helper for locale date/time formatting used by Say methods.
     * @param {Date|number|string} value
     * @param {{invalidDate?:string} & Intl.DateTimeFormatOptions} [opt={}]
     * @param {"toLocaleDateString"|"toLocaleString"|"toLocaleTimeString"} formatMethod
     * @returns {string}
     */
    _formatDate(value, opt, formatMethod) {
        if (!opt || typeof opt !== "object") { opt = {}; }

        const date = toDate(value);
        if (Number.isNaN(date.getTime())) { return opt.invalidDate ?? this.invalidDate; }

        const { invalidDate, ...formatOpt } = opt;
        return date[formatMethod](this.id, formatOpt);
    }

    /**
     * Applies locale number formatting and inflection selector to a pattern string.
     * @param {string} str Phrase pattern (e.g. "{#} hour[s]").
     * @param {number} num Input number.
     * @param {InflectOptions} [opt={}]
     * @returns {string}
     */
    inflect(str, num, opt = {}) {
        const { id, nanSelect, infinitySelect } = this;
        const { decimal, noZero, noNaN, noInfinity, noBS } = opt;

        const nanSymbol = opt.nanSymbol ?? this.nanSymbol;
        const infinitySymbol = opt.infinitySymbol ?? this.infinitySymbol;

        num = Number(num);

        if (Number.isNaN(num)) {
            if (!nanSymbol || noBS || noNaN) { return ""; }
            return this._inflectDirect(str, nanSymbol, nanSelect);
        }
        if (!Number.isFinite(num)) {
            if (!infinitySymbol || noBS || noInfinity) { return ""; }
            return this._inflectDirect(str, infinitySymbol, infinitySelect);
        }

        const decCfg = formatDecimalCfg(decimal);

        const n = numFormat(num, decCfg.maximumFractionDigits);
        if ((noZero || noBS) && n === 0) { return ""; }

        const nStr = n.toLocaleString(id, decCfg);
        return this._inflectByNum(str, nStr, n);
    }
}
