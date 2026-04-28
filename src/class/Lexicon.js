import { solids } from "@randajan/props";
import { Locale } from "./Locale";
import { Say } from "./Say";

/**
 * @typedef {object} LexiconOptions
 * @property {(string|Locale|object)[]} [locales]
 * @property {Record<string, string[]>} [translations]
 * @property {Lexicon|null} [parent]
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
        parent = null
    } = {}) {

        const siblings = [];
        locales = Locale.normalizeAll(locales, (localeId) => parent?.resolveLocale(localeId, false));
        translations = translations ?? {};

        solids(this, {
            locales,
            localeIndex: Locale.makeLocalesIndex(locales),
            translations,
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
            const r = sibling.lookup(localeId, phraseId, false, seen);
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
        return parent?.lookup(localeId, phraseId, false, seen);
    }

    /**
     * Resolves phrase by fallback order: self -> siblings -> parent.
     * @param {string} localeId
     * @param {string} phraseId
     * @param {boolean} [throwError=true]
     * @param {WeakSet<object>} [seen=new WeakSet()]
     * @returns {string|undefined}
     */
    lookup(localeId, phraseId, throwError=true, seen=new WeakSet()) {
        if (seen.has(this)) { return; } else { seen.add(this); }

        const vh = this.lookupSelf(localeId, phraseId);
        if (vh != null) { return vh; }

        const vb = this.lookupSiblings(localeId, phraseId, seen);
        if (vb != null) { return vb; }

        const vp = this.lookupParent(localeId, phraseId, seen);
        if (vp != null) { return vp; }

        if (!throwError) { return; }
        throw new Error(`Phrase '${phraseId}' not found (locale '${localeId}').`);
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
     * @param {{locales?:(string|Locale|object)[], translations?:Record<string, string[]>}} [opts={}]
     * @returns {Lexicon}
     */
    extend({ locales, translations} = {}) {
        if (!locales) { locales = this.locales; }
        return new Lexicon({locales, translations, parent:this});
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
