import { makeLocaleIndex } from "../tools";
import { solids } from "@randajan/props";
import { Say } from "./Say";


export class Lexicon {

    /**
     * @param {object} opts
     * @param {string[]} opts.locales
     * @param {Record<string, string[]>} opts.translations
     * @param {Lexicon|null} opts.parent
     */

    constructor({
        locales = [],
        translations = {},
        parent = null
    } = {}) {

        const brothers = [];
        locales = locales ?? [];
        translations = translations ?? {};

        solids(this, {
            locales,
            localesIndex: makeLocaleIndex(locales),
            translations,
            parent,
            brothers
        });

    }

    lookupSelf(locale, phraseId) {
        const i = this.localesIndex[locale];
        if (i == null) { return; }
        const arr = this.translations?.[phraseId];
        if (!Array.isArray(arr)) { return; }
        return arr[i];
    }

    lookupBrothers(locale, phraseId, seen=new WeakSet()) {
        const { brothers } = this;
        if (!brothers.length) { return; }
        for (const bro of brothers) {
            const r = bro.lookup(locale, phraseId, false, seen);
            if (r != null) { return r; }
        }
    }

    lookupParent(locale, phraseId, seen=new WeakSet()) {
        const { parent } = this;
        return parent?.lookup(locale, phraseId, false, seen);
    }

    lookup(locale, phraseId, throwError=true, seen=new WeakSet()) {
        if (seen.has(this)) { return; } else { seen.add(this); }

        const vh = this.lookupSelf(locale, phraseId);
        if (vh != null) { return vh; }

        const vb = this.lookupBrothers(locale, phraseId, seen);
        if (vb != null) { return vb; }

        const vp = this.lookupParent(locale, phraseId, seen);
        if (vp != null) { return vp; }

        if (!throwError) { return; }
        throw new Error(`Phrase '${phraseId}' not found (locale '${locale}').`);
    }

    extend({ locales, translations} = {}) {
        if (!locales) { locales = this.locales; }
        return new Lexicon({locales, translations, parent:this});
    }
    
    append(brother) {
        if (brother === this) {
            throw new Error(`Lexicon.append(children) can't accept itself`);
        }
        if (brother === this.parent) {
            throw new Error(`Lexicon.append(children) can't accept own parent`);
        }
        if (!(brother instanceof Lexicon)) {
            throw new Error(`Lexicon.append(children) must by instanceof Lexicon()`);
        }
        this.brothers.push(brother);
        return this;
    }

    select(locale) {
        return new Say(this, locale);
    }

}
