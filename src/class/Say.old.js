import { makeLocaleIndex } from "../tools";
import { solids } from "@randajan/props";


export class Say extends Function {

    /**
     * @param {object} opts
     * @param {string[]} opts.langs
     * @param {Record<string, string[]>} opts.translations
     * @param {string} opts.defaultLang
     * @param {Say|null} opts.parent
     */

    constructor({
        defaultLang = null,
        langs = [],
        translations = {},
        parent = null
    } = {}) {
        super();

        const brothers = [];
        langs = langs ?? [];
        translations = translations ?? {};

        // Important: keep prototype = Say so instance methods work
        const _say = (phraseId, langId) => _say.say(phraseId, langId);

        _say.defaultLang = defaultLang ?? langs[0];

        solids(_say, {
            langs,
            langIndex: makeLocaleIndex(langs),
            translations,
            parent,
            brothers
        });

        return Object.setPrototypeOf(_say, new.target.prototype);
    }

    _lookupHere(phraseId, langId) {
        const i = this.langIndex[langId];
        if (i == null) { return; }
        const arr = this.translations?.[phraseId];
        if (!Array.isArray(arr)) { return; }
        return arr[i];
    }

    _lookupBrothers(phraseId, langId, seen=new WeakSet()) {
        const { brothers } = this;
        if (!brothers.length) { return; }
        for (const bro of brothers) {
            const r = bro._lookup(phraseId, langId, false, seen);
            if (r != null) { return r; }
        }
    }

    _lookupParent(phraseId, langId, seen=new WeakSet()) {
        const { parent } = this;
        return parent?._lookup(phraseId, langId, false, seen);
    }

    _lookup(phraseId, langId, throwError=true, seen=new WeakSet()) {
        if (seen.has(this)) { return; } else { seen.add(this); }

        const el = langId ?? this.defaultLang;
        const vh = this._lookupHere(phraseId, el);
        if (vh != null) { return vh; }

        const vb = this._lookupBrothers(phraseId, el, seen);
        if (vb != null) { return vb; }

        const vp = this._lookupParent(phraseId, el, seen);
        if (vp != null) { return vp; }

        if (!throwError) { return; }
        throw new Error(`Phrase '${phraseId}' not found (langId '${el}').`);
    }

    bindLang(langId) {
        return this.extend({defaultLang:langId});
    }

    extend({ defaultLang, langs, translations} = {}) {
        if (!langs) { langs = this.langs; }
        else if (!defaultLang) { defaultLang = this.defaultLang; }
        return new Say({defaultLang, langs, translations, parent:this});
    }
    
    append(brother) {
        if (brother === this) {
            throw new Error(`Say.append(children) can't accept itself`);
        }
        if (brother === this.parent) {
            throw new Error(`Say.append(children) can't accept own parent`);
        }
        if (!(brother instanceof Say)) {
            throw new Error(`Say.append(children) must by instanceof Say()`);
        }
        this.brothers.push(brother);
        return this;
    }

    has(phraseId, langId) {
        return this._lookup(phraseId, langId, false) != null;
    }

    sayOr(phraseId, fallback, langId) {
        return this._lookup(phraseId, langId, false) ?? fallback;
    }

    say(phraseId, langId) {
        return this.sayOr(phraseId, `{${phraseId}}`, langId);
    }

    tell(text, langId) {
        return String(text ?? "").replace(/\p{L}+/gu, (phraseId) => this.say(phraseId, langId));
    }

    setLang(langId) {
        this.defaultLang = langId;
        return this;
    }
}
