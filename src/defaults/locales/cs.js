import { Locale } from "../../class/Locale";
import inflectSelector from "../inflects/cs";

const cs = new Locale({
    id: "cs",
    inflectSelector,
    invalidDate: "Neplatné datum"
});

export default cs;
