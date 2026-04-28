import { Locale } from "../../class/Locale";
import inflectSelector from "../inflects/cs";

const sk = new Locale({
    id: "sk",
    inflectSelector,
    invalidDate: "Neplatný dátum"
});

export default sk;
