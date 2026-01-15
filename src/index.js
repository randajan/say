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
     * @param {string[]} opts.defaultLang
     * @param {Say|null} opts.parent
     */
    constructor({ defaultLang = null, langs = [], translations = {}, parent = null } = {}) {
        // Make the instance callable: (...args) => this.say(...args)
        super();

        langs = langs ?? [];
        translations = translations ?? {};
        defaultLang = defaultLang ?? langs[0];

        // Important: keep prototype = Say so instance methods work
        const _say = (...a) => _say.say(...a);

        solids(_say, {
            defaultLang,
            langs,
            langIndex: makeLangIndex(langs),
            translations,
            parent
        });

        console.log("h", _say.langIndex);

        return Object.setPrototypeOf(_say, new.target.prototype);
    }

    _lookupHere(phraseId, lang) {
        const i = this.langIndex[lang];
        if (i == null) { return; }
        const arr = this.translations?.[phraseId];
        if (!Array.isArray(arr)) { return; }
        return arr[i];
    }

    say(phraseId, lang) {
        const effectiveLang = lang ?? this.defaultLang;
        const here = this._lookupHere(phraseId, effectiveLang);

        if (here != null) { return here; }
        if (this.parent) { return this.parent.say(phraseId, effectiveLang); }

        throw new Error(`Phrase '${phraseId}' not found (lang '${effectiveLang}').`);
    }

    bindLang(lang) {
        return this.extend({defaultLang:lang});
    }

    extend({ defaultLang, langs, translations} = {}) {
        if (!langs) { langs = this.langs; }
        else if (!defaultLang) { defaultLang = this.defaultLang; }

        console.log({ defaultLang, langs, translations }, {...this});
        return new Say({defaultLang, langs, translations, parent:this});
    }

    has(phraseId, lang) {
        try {
            this.say(phraseId, lang);
            return true;
        } catch {
            return false;
        }
    }

    sayOr(phraseId, fallback, lang) {
        try {
            return this.say(phraseId, lang);
        } catch {
            return fallback;
        }
    }
}

export default Say;
