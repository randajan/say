/**
 * Shared date/time formatting options used by `say.date`, `say.time`, and
 * `say.dateTime`.
 *
 * `style` controls the default component width for year/month/day/hour/minute/
 * second. Any option with value `null`, `"none"`, or `"hide"` is removed before
 * calling the native formatter.
 *
 * @typedef {Intl.DateTimeFormatOptions & object} DateTimeOptions
 * @property {"numeric"|"2-digit"} [style="numeric"] Default component style.
 */

const formatRem = {
    Date: ["hour", "minute", "second", "dayPeriod"],
    Time: ["weekday", "era", "year", "month", "day"],
};


const formatStyles = {
    numeric: {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
    },

    "2-digit": {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }
};

/**
 * Formats a valid Date with the locale-aware native Date API.
 *
 * Empty `formatMethod` calls `toLocaleString`, `"Date"` calls
 * `toLocaleDateString`, and `"Time"` calls `toLocaleTimeString`.
 *
 * @param {Date} date Valid Date instance.
 * @param {string} localeId Locale identifier forwarded to the native formatter.
 * @param {DateTimeOptions} [formatOpt={}]
 * @param {""|"Date"|"Time"} [formatMethod=""]
 * @returns {string}
 */
export const formatDateTime = (date, localeId, formatOpt={}, formatMethod="")=>{
    const { style="numeric", ...passOpt } = formatOpt;

    if (style !== "numeric" && style !== "2-digit") {
        throw new TypeError(`style must be 'numeric' or '2-digit'`);
    }

    if (formatMethod !== "" && formatMethod !== "Time" && formatMethod !== "Date") {
        throw new TypeError(`formatMethod must be 'Date' or 'Time'`);
    }

    const def = formatStyles[style];

    const opt = {...def, ...passOpt};

    for (let i in opt) {
        if (opt[i] == null || opt[i] == "none" || opt[i] == "hide") { delete opt[i]; }
    }

    const rems = formatRem[formatMethod];
    if (rems) {
        for (const rem of rems) { delete opt[rem]; }
    }

    return date[`toLocale${formatMethod}String`](localeId, opt);
}
