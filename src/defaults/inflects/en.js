export default (num, pattern) => {
    const isSingular = Number.isInteger(num) && Math.abs(num) === 1;
    if (pattern.length === 1) { return isSingular ? "" : pattern[0]; } // [s]
    return isSingular ? pattern[0] : pattern[1];
}