import { Locale } from "../../class/Locale";
import inflectSelector from "../inflects/pl";

const pl = new Locale({
    id: "pl",
    inflectSelector,
    invalidDate: "Nieprawidłowa data"
});

export default pl;
