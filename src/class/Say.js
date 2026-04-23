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
        return lexicon.lookup(locale.id, phraseId, false) != null;
    }

    or(phraseId, fallback) {
        const { lexicon, locale } = this;
        return lexicon.lookup(locale.id, phraseId, false) ?? fallback;
    }

    num(phraseId, num, opt={}) {
        const { locale } = this;
        const phrase = this.or(phraseId, `{{#} ${phraseId}}`);
        return locale.inflect(phrase, num, opt);
    }

    all(text) {
        return String(text ?? "").replace(/\p{L}+/gu, this);
    }
}
