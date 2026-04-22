import { log } from "@randajan/simple-lib/node";
import { Lexicon, Locale } from "../../dist/esm/index.mjs";

const hr = () => log("------------------------------------------------------------");
const show = (label, value) => log(label, value);
const showJson = (label, value) => log(label, JSON.stringify(value));

const tell = (lexicon, locale, text) => {
    return String(text ?? "").replace(/\p{L}+/gu, (phraseId) => {
        return lexicon.lookup(locale, phraseId, false) ?? `{${phraseId}}`;
    });
};

log("Lexicon demo: base table");
const lexBase = new Lexicon({
    locales: ["en", "cs", "en-GB"],
    translations: {
        hello: ["Hello", "Ahoj", "Hello (UK)"],
        color: ["Color", "Barva", "Colour"],
        phone: ["Phone", "Telefon", "Telephone"],
        empty: ["", "", ""],
    },
});

hr();
log("Override + different locales order");
const lexUk = lexBase.extend({
    locales: ["en-GB", "en", "cs"], // different order
    translations: {
        color: ["Colour (UK)", "Color", "Barva"], // override base
        invoice: ["Invoice (UK)", "Invoice", "Faktura"],
    },
});

hr();
log("App layer (parent chain)");
const lexApp = lexUk.extend({
    translations: {
        welcome: ["Welcome!", "Welcome!", "Vitej!"],
        item: ["Line item", "Line item", "Polozka"],
    },
});

hr();
log("Select locale (Say sugar over Lexicon)");
const sayCs = lexApp.select("cs");
const sayEn = lexApp.select("en");
const sayEnGb = lexApp.select("en-GB");

hr();
log("Lookup usage");
show("lexApp.lookup('cs', 'welcome') ->", lexApp.lookup("cs", "welcome", false));
show("lexApp.lookup('en-GB', 'color') ->", lexApp.lookup("en-GB", "color", false)); // override from lexUk
show("lexApp.lookup('en', 'phone') ->", lexApp.lookup("en", "phone", false)); // fallback to base

hr();
log("has / or / empty-string support");
show("sayEn.has('color') ->", sayEn.has("color"));
show("sayEn.has('missing') ->", sayEn.has("missing"));
show("sayEn.or('missing','<fallback>') ->", sayEn.or("missing", "<fallback>"));
showJson("sayEn.or('empty','<fallback>') ->", sayEn.or("empty", "<fallback>"));

hr();
log("Missing phrase default behavior");
show("lexApp.lookup('en','missing', false) ->", lexApp.lookup("en", "missing", false));

hr();
log("tell(text) word replacement");
show(
    "tell(lexApp, 'en', 'hello, color phone! missing.') ->",
    tell(lexApp, "en", "hello, color phone! missing.")
);
show(
    "tell(lexApp, 'en-GB', 'hello, color phone! invoice.') ->",
    tell(lexApp, "en-GB", "hello, color phone! invoice.")
);
show(
    "tell(lexApp, 'cs', 'welcome : item color unknown') ->",
    tell(lexApp, "cs", "welcome : item color unknown")
);


const cs = new Locale({
    id:"cs-Cz",
    inflectSelector:(num, pattern)=>{
        const r = Math.round(num);
        if (r !== num) { return pattern[2]; } //decimal

        const a = Math.abs(r);
        if (a === 1) { return pattern[1]; }
        if (a > 1 && a < 5) { return pattern[2]; }
        return pattern[3];
    }
});


for (let i=-1; i<3; i+=0.5) {
    console.log(cs.inflect("{#} hodin[|a|y|]", Math.random()*10, { decimal:1 }));
}
