import { solids } from "@randajan/props";

const makeLangIndex = (langs = []) => {
    const idx = {};
    for (let i = 0; i < langs.length; i++) idx[langs[i]] = i;
    return idx;
};

export class Say extends Function {
    /**
     * @param {object} opts
     * @param {string[]} opts.langs
     * @param {Record<string, string[]>} opts.translations
     * @param {string} opts.defaultLang
     * @param {Say|null} opts.parent
     */
    constructor({ defaultLang = null, langs = [], translations = {}, parent = null } = {}) {
        super();

        const brothers = [];
        langs = langs ?? [];
        translations = translations ?? {};
        this.defaultLang = defaultLang ?? langs[0];

        // Important: keep prototype = Say so instance methods work
        const _say = (phraseId, lang) => _say.say(phraseId, lang);

        solids(_say, {
            langs,
            langIndex: makeLangIndex(langs),
            translations,
            parent,
            brothers
        });

        return Object.setPrototypeOf(_say, new.target.prototype);
    }

    _lookupHere(phraseId, lang) {
        const i = this.langIndex[lang];
        if (i == null) { return; }
        const arr = this.translations?.[phraseId];
        if (!Array.isArray(arr)) { return; }
        return arr[i];
    }

    _lookupBrothers(phraseId, lang, seen=new WeakSet()) {
        const { brothers } = this;
        if (!brothers.length) { return; }
        for (const bro of brothers) {
            const r = bro._lookup(phraseId, lang, false, seen);
            if (r != null) { return r; }
        }
    }

    _lookupParent(phraseId, lang, seen=new WeakSet()) {
        const { parent } = this;
        return parent?._lookup(phraseId, lang, false, seen);
    }
    
    _lookup(phraseId, lang, throwError=true, seen=new WeakSet()) {
        if (seen.has(this)) { return; } else { seen.add(this); }

        const el = lang ?? this.defaultLang;
        const vh = this._lookupHere(phraseId, el);
        if (vh != null) { return vh; }

        const vb = this._lookupBrothers(phraseId, el, seen);
        if (vb != null) { return vb; }

        const vp = this._lookupParent(phraseId, el, seen);
        if (vp != null) { return vp; }

        if (!throwError) { return; }
        throw new Error(`Phrase '${phraseId}' not found (lang '${el}').`);
    }

    bindLang(lang) {
        return this.extend({defaultLang:lang});
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

    has(phraseId, lang) {
        return this._lookup(phraseId, lang, false) != null;
    }

    sayOr(phraseId, fallback, lang) {
        return this._lookup(phraseId, lang, false) ?? fallback;
    }

    say(phraseId, lang) {
        return this.sayOr(phraseId, `{${phraseId}}`, lang);
    }

    setLang(lang) {
        this.defaultLang = lang;
        return this;
    }
}

export default Say;
