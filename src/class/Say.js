import { solids } from "@randajan/props";

export class Say extends Function {
    constructor(lexicon, locale) {
        super();

        const _say = (phraseId) => _say.or(phraseId, `{${phraseId}}`);

        solids(_say, {lexicon, locale});

        return Object.setPrototypeOf(_say, new.target.prototype);
    }

    has(phraseId) {
        const { lexicon, locale } = this;
        return lexicon.lookup(locale, phraseId, false) != null;
    }

    or(phraseId, fallback) {
        const { lexicon, locale } = this;
        return lexicon.lookup(locale, phraseId, false) ?? fallback;
    }

    all(text) {
        return String(text ?? "").replace(/\p{L}+/gu, this);
    }
}
