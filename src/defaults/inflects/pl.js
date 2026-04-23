export default (num, pattern) => {
    if (!Number.isInteger(num)) { return pattern[3]; }

    const a = Math.abs(num);
    const d10 = a % 10;
    const d100 = a % 100;

    if (a === 1) { return pattern[1]; }
    if (d10 >= 2 && d10 <= 4 && !(d100 >= 12 && d100 <= 14)) {
        return pattern[2];
    }
    return pattern[3];
}