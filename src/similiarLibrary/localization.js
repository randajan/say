import jet from "@randajan/jet-core";


const currenciesIndex =  {
    "CZK":"# Kč",
    "EUR":"€ #"
}

const currencies = [...Object.keys(currenciesIndex)];
const languages = ["cs", "sk"];
const countries = ["CZ", "SK"];



export class Loc {

    static languages = languages;
    static selectLanguage = jet.enumFactory(languages, { before: String.jet.to, def: "cs" });

    static countries = countries;
    static selectCountry = jet.enumFactory(countries, { before: String.jet.to, def: "CZ" });

    static currency = currencies;
    static selectCurrency = jet.enumFactory(currencies, { before: String.jet.to, def: "CZK" });

    static toPrice = (value, currency="CZK", decimal=2) => {
        const v = Number.jet.to(value);
        const vf = v.toLocaleString(undefined, {
            maximumFractionDigits: decimal,
        });

        if (!currencies.includes(currency)) { throw new Error(`Unknown currency '${currency}'`); }

        return currenciesIndex[currency].replace("#", vf);
    }

}