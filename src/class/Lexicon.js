import { solids } from "@randajan/props";
import { Locale } from "./Locale";
import { Say } from "./Say";

export class Lexicon {

    /**
     * @param {object} opts
     * @param {(string|Locale|object)[]} opts.locales
     * @param {Record<string, string[]>} opts.translations
     * @param {Lexicon|null} opts.parent
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

    lookupSelf(localeId, phraseId) {
        const i = this.localeIndex[localeId];
        if (i == null) { return; }
        const arr = this.translations?.[phraseId];
        if (!Array.isArray(arr)) { return; }
        return arr[i];
    }

    lookupSiblings(localeId, phraseId, seen=new WeakSet()) {
        const { siblings } = this;
        if (!siblings.length) { return; }
        for (const sibling of siblings) {
            const r = sibling.lookup(localeId, phraseId, false, seen);
            if (r != null) { return r; }
        }
    }

    lookupParent(localeId, phraseId, seen=new WeakSet()) {
        const { parent } = this;
        return parent?.lookup(localeId, phraseId, false, seen);
    }

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

    resolveLocaleSelf(localeId) {
        const i = this.localeIndex[localeId];
        if (i == null) { return; }
        return this.locales[i];
    }

    resolveLocaleParent(localeId, seen=new WeakSet()) {
        const { parent } = this;
        return parent?.resolveLocale(localeId, false, seen);
    }

    resolveLocaleSiblings(localeId, seen=new WeakSet()) {
        const { siblings } = this;
        if (!siblings.length) { return; }
        for (const sibling of siblings) {
            const r = sibling.resolveLocale(localeId, false, seen);
            if (r) { return r; }
        }
    }

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

    extend({ locales, translations} = {}) {
        if (!locales) { locales = this.locales; }
        return new Lexicon({locales, translations, parent:this});
    }
    
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

    select(localeId) {
        return new Say(this, this.resolveLocale(localeId));
    }

}
