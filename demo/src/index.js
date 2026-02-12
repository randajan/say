import { info, log } from "@randajan/simple-lib/node";
import Say from "../../dist/esm/index.mjs";

const hr = () => log("------------------------------------------------------------");
const show = (label, value) => log(label, value);
const showJson = (label, value) => log(label, JSON.stringify(value));

log("Say demo: base table");
const sayBase = new Say({
    langs: ["en", "cs", "en-GB"],
    translations: {
        hello: ["Hello", "Ahoj", "Hello (UK)"],
        color: ["Color", "Barva", "Colour"],
        phone: ["Phone", "Telefon", "Telephone"],
        empty: ["", "", ""],
    },
});

hr();
log("Override + different langs order");
const sayUk = sayBase.extend({
    langs: ["en-GB", "en", "cs"], // different order
    translations: {
        color: ["Colour (UK)", "Color", "Barva"], // override base
        invoice: ["Invoice (UK)", "Invoice", "Faktura"],
    },
});

hr();
log("App layer (parent chain)");
const sayApp = sayUk.extend({
    translations: {
        welcome: ["Welcome!", "Welcome!", "Vitej!"],
        item: ["Line item", "Line item", "Polozka"],
    },
});

hr();
log("Brother table (append)");
const sayMarketing = new Say({
    langs: ["en", "cs", "en-GB"],
    translations: {
        tagline: ["Fast & light", "Rychle a lehce", "Fast & light"],
        hello: ["Hello, friend", "Ahoj, pritele", "Hello, mate"],
    },
});
sayApp.append(sayMarketing);

hr();
log("Callable usage");
show("sayApp('welcome', 'cs') ->", sayApp("welcome", "cs"));
show("sayApp('color', 'en-GB') ->", sayApp("color", "en-GB")); // override from sayUk
show("sayApp('phone', 'en') ->", sayApp("phone", "en")); // fallback to base
show("sayApp('tagline', 'en') ->", sayApp("tagline", "en")); // fallback to brother
show("sayApp('hello', 'en-GB') ->", sayApp("hello", "en-GB")); // brother overrides base

hr();
log("Default language + bindLang");
const sayCs = sayApp.bindLang("cs");
const sayEnGb = sayApp.bindLang("en-GB");
show("sayCs('item') ->", sayCs("item"));
show("sayEnGb('invoice') ->", sayEnGb("invoice"));

hr();
log("has / sayOr / empty-string support");
show("has('color','en') ->", sayApp.has("color", "en"));
show("has('missing','en') ->", sayApp.has("missing", "en"));
show("sayOr('missing','<fallback>','en') ->", sayApp.sayOr("missing", "<fallback>", "en"));
showJson("sayOr('empty','<fallback>','en') ->", sayApp.sayOr("empty", "<fallback>", "en"));

hr();
log("Missing phrase default behavior");
show("sayApp('missing','en') ->", sayApp("missing", "en"));
