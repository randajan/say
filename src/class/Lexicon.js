import { solids } from "@randajan/props";
import { Locale } from "./Locale";
import { Say } from "./Say";

/**
 * @typedef {object} LexiconOptions
 * @property {(string|Locale|object)[]} [locales]
 * @property {Record<string, string[]>} [translations]
 * @property {Lexicon|null} [parent]
 * @property {import("../dateTime").DateTimeOptions} [dateOptions] Defaults for all `say.date*` calls.
 */

/**
 * @typedef {object} LexiconExtendOptions
 * @property {(string|Locale|object)[]} [locales]
 * @property {Record<string, string[]>} [translations]
 * @property {import("../dateTime").DateTimeOptions} [dateOptions]
 */

/**
 * @callback PhraseFilter
 * @param {string} phraseId
 * @returns {boolean}
 */

/**
 * @typedef {Record<string, string>} TranslationCollector
 */

/**
 * Translation storage with locale resolution and fallback graph (self, siblings, parent).
 */
export class Lexicon {

    /**
     * @param {LexiconOptions} [opts={}]
     */

    constructor({
        locales = [],
        translations = {},
        parent = null,
        dateOptions = {}
    } = {}) {

        const siblings = [];
        locales = Locale.normalizeAll(locales, (localeId) => parent?.resolveLocale(localeId, false));
        translations = translations ?? {};

        solids(this, {
            locales,
            localeIndex: Locale.makeLocalesIndex(locales),
            translations,
            dateOptions:Object.freeze(dateOptions),
            parent,
            siblings
        });

    }

    /**
     * Lookup in current lexicon only (no fallback traversal).
     * @param {string} localeId
     * @param {string} phraseId
     * @returns {string|undefined}
     */
    lookupSelf(localeId, phraseId) {
        const i = this.localeIndex[localeId];
        if (i == null) { return; }
        const arr = this.translations?.[phraseId];
        if (!Array.isArray(arr)) { return; }
        return arr[i];
    }

    /**
     * Lookup via sibling lexicons.
     * @param {string} localeId
     * @param {string} phraseId
     * @param {WeakSet<object>} [seen=new WeakSet()]
     * @returns {string|undefined}
     */
    lookupSiblings(localeId, phraseId, seen=new WeakSet()) {
        const { siblings } = this;
        if (!siblings.length) { return; }
        for (const sibling of siblings) {
            const r = sibling.lookup(localeId, phraseId, seen);
            if (r != null) { return r; }
        }
    }

    /**
     * Lookup via parent lexicon.
     * @param {string} localeId
     * @param {string} phraseId
     * @param {WeakSet<object>} [seen=new WeakSet()]
     * @returns {string|undefined}
     */
    lookupParent(localeId, phraseId, seen=new WeakSet()) {
        const { parent } = this;
        return parent?.lookup(localeId, phraseId, seen);
    }

    /**
     * Resolves phrase by fallback order: self -> siblings -> parent.
     * @param {string} localeId
     * @param {string} phraseId
     * @param {WeakSet<object>} [seen=new WeakSet()]
     * @returns {string|undefined}
     */
    lookup(localeId, phraseId, seen=new WeakSet()) {
        if (seen.has(this)) { return; } else { seen.add(this); }

        const vh = this.lookupSelf(localeId, phraseId);
        if (vh != null) { return vh; }

        const vb = this.lookupSiblings(localeId, phraseId, seen);
        if (vb != null) { return vb; }

        const vp = this.lookupParent(localeId, phraseId, seen);
        if (vp != null) { return vp; }
    }

    /**
     * Collects matching translations from current lexicon only.
     * Existing keys in collector keep their earlier fallback value.
     * @param {string} localeId
     * @param {PhraseFilter} filter
     * @param {TranslationCollector} [collector={}]
     * @returns {TranslationCollector}
     */
    collectSelf(localeId, filter, collector={}) {
        const i = this.localeIndex[localeId];
        if (i == null) { return collector; }

        for (const key in this.translations) {
            if (Object.hasOwn(collector, key)) { continue; }
            if (!filter(key)) { continue; }
            const arr = this.translations[key];
            if (!Array.isArray(arr) || arr[i] == null) { continue; }
            collector[key] = arr[i];
        }

        return collector;
    }

    /**
     * Collects matching translations from sibling lexicons.
     * @param {string} localeId
     * @param {PhraseFilter} filter
     * @param {TranslationCollector} [collector={}]
     * @param {WeakSet<object>} [seen=new WeakSet()]
     * @returns {TranslationCollector}
     */
    collectSiblings(localeId, filter, collector={}, seen=new WeakSet()) {
        const { siblings } = this;
        if (!siblings.length) { return collector; }
        for (const sibling of siblings) {
            collector = sibling.collect(localeId, filter, collector, seen);
        }
        return collector;
    }

    /**
     * Collects matching translations from parent lexicon.
     * @param {string} localeId
     * @param {PhraseFilter} filter
     * @param {TranslationCollector} [collector={}]
     * @param {WeakSet<object>} [seen=new WeakSet()]
     * @returns {TranslationCollector|undefined}
     */
    collectParent(localeId, filter, collector={}, seen=new WeakSet()) {
        const { parent } = this;
        return parent?.collect(localeId, filter, collector, seen);
    }

    /**
     * Collects matching translations by fallback order: self -> siblings -> parent.
     * The first value found for each phrase id wins.
     * @param {string} localeId
     * @param {PhraseFilter} filter
     * @param {TranslationCollector} [collector={}]
     * @param {WeakSet<object>} [seen=new WeakSet()]
     * @returns {TranslationCollector}
     */
    collect(localeId, filter, collector={}, seen=new WeakSet()) {
        if (seen.has(this)) { return collector; }
        seen.add(this);

        this.collectSelf(localeId, filter, collector);
        this.collectSiblings(localeId, filter, collector, seen);
        this.collectParent(localeId, filter, collector, seen);

        return collector;
    }

    /**
     * Resolve locale in current lexicon only.
     * @param {string} localeId
     * @returns {Locale|undefined}
     */
    resolveLocaleSelf(localeId) {
        const i = this.localeIndex[localeId];
        if (i == null) { return; }
        return this.locales[i];
    }

    /**
     * Resolve locale via parent lexicon.
     * @param {string} localeId
     * @param {WeakSet<object>} [seen=new WeakSet()]
     * @returns {Locale|undefined}
     */
    resolveLocaleParent(localeId, seen=new WeakSet()) {
        const { parent } = this;
        return parent?.resolveLocale(localeId, false, seen);
    }

    /**
     * Resolve locale via sibling lexicons.
     * @param {string} localeId
     * @param {WeakSet<object>} [seen=new WeakSet()]
     * @returns {Locale|undefined}
     */
    resolveLocaleSiblings(localeId, seen=new WeakSet()) {
        const { siblings } = this;
        if (!siblings.length) { return; }
        for (const sibling of siblings) {
            const r = sibling.resolveLocale(localeId, false, seen);
            if (r) { return r; }
        }
    }

    /**
     * Resolves locale by order: self -> parent -> siblings.
     * @param {string} localeId
     * @param {boolean} [throwError=true]
     * @param {WeakSet<object>} [seen=new WeakSet()]
     * @returns {Locale|undefined}
     */
    resolveLocale(localeId, throwError=true, seen=new WeakSet()) {
        if (seen.has(this)) { return; } else { seen.add(this); }

        const vh = this.resolveLocaleSelf(localeId);
        if (vh) { return vh; }

        const vp = this.resolveLocaleParent(localeId, seen);
        if (vp) { return vp; }

        const vb = this.resolveLocaleSiblings(localeId, seen);
        if (vb) { return vb; }

        if (!throwError) { return; }
        throw new Error(`Locale '${localeId}' not found.`);
    }

    /**
     * Creates child lexicon with current instance as parent.
     * @param {LexiconExtendOptions} [opts={}]
     * @returns {Lexicon}
     */
    extend({ locales, translations, dateOptions} = {}) {
        if (!locales) { locales = this.locales; }
        if (!dateOptions) { dateOptions = this.dateOptions; }
        return new Lexicon({locales, translations, dateOptions, parent:this});
    }
    
    /**
     * Registers another lexicon as sibling fallback.
     * @param {Lexicon} sibling
     * @returns {this}
     */
    addSibling(sibling) {
        if (sibling === this) {
            throw new Error(`Lexicon.addSibling(sibling) can't accept itself`);
        }
        if (sibling === this.parent) {
            throw new Error(`Lexicon.addSibling(sibling) can't accept own parent`);
        }
        if (!(sibling instanceof Lexicon)) {
            throw new Error(`Lexicon.addSibling(sibling) must by instanceof Lexicon()`);
        }
        this.siblings.push(sibling);
        return this;
    }

    /**
     * Returns callable Say view bound to resolved locale.
     * @param {string} localeId
     * @returns {Say}
     */
    select(localeId) {
        return new Say(this, this.resolveLocale(localeId));
    }

}
