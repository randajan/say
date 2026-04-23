export const validPosInt = (num, required, propName)=>{
    if (num == null && !required) { return; }
    if (typeof num === "number" && num >= 0 && Number.isInteger(num)) { return num; }
    throw new TypeError(`${propName} must be positive integer got ${num}`);
}

export const formatDecimalCfg = (decimal)=>{
    if (Array.isArray(decimal)) {
        return {
            minimumFractionDigits:validPosInt(decimal[0], true, "minimumFractionDigits"),
            maximumFractionDigits:validPosInt(decimal[1], true, "maximumFractionDigits")
        }
    }
    const fixed = validPosInt(decimal, false, "fixedFractionDigits");
    return {
        minimumFractionDigits:fixed,
        maximumFractionDigits:fixed
    }
}

export const numFormat = (num, maximumFractionDigits)=>{
    const md = maximumFractionDigits;

    if (md == null) { return num; }
    if (md === 0) { return Math.round(num); }

    const z = Math.pow(10, md);
    return Math.round(num*z)/z;
}
