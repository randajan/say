

export default (num, pattern) => {
    const r = Math.round(num);
    if (r !== num) { return pattern[2]; } // decimal

    const a = Math.abs(r);
    if (a === 1) { return pattern[1]; }
    if (a > 1 && a < 5) { return pattern[2]; }
    return pattern[3];
}