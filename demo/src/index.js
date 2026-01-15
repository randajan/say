import { info, log } from "@randajan/simple-lib/node";
import Say from "../../dist/esm/index.mjs";

const say = new Say({
    langs: ["en", "en-GB"],
    translations: {
        item: ["Item", "Item (UK)"],
        phone: ["Phone", "Telephone"],
    },
});

const say2 = say.extend({
    langs: ["en-GB", "en"], // different order
    translations: {
        serviceReport: ["Service report (UK)", "Service report"],
        item: ["Line item (UK)", "Line item"], // override
    },
});

const sayEn = say.extend({ defaultLang: "en" });

console.log(sayEn("item"));
