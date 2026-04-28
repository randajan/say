import { Locale } from "../../class/Locale";
import inflectSelector from "../inflects/en";

const en = new Locale({
    id: "en",
    inflectSelector,
    invalidDate: "Invalid date"
});

export default en;
