import { Locale } from "../../class/Locale";
import inflectSelector from "../inflects/en";

const de = new Locale({
    id: "de",
    inflectSelector,
    invalidDate: "Ungültiges Datum"
});

export default de;
