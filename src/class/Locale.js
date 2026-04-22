import { solids } from "@randajan/props";
import { formatDecimalCfg, numFormat } from "../tools";

const _patternRegex = /\[.+\]/;

export class Locale {
    constructor({
        id,
        inflectSelector = (() => {}),
        numberPlaceholder = "{#}",
        nanSymbol = "?",
        nanSelect = 0,
        infinitySymbol = "\u221E",
        infinitySelect = 0,
    } = {}) {
        solids(this, {
            id,
            inflectSelector,
            numberPlaceholder,
            nanSymbol,
            nanSelect,
            infinitySymbol,
            infinitySelect,
            cachedPatterns: new Map()
        });
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