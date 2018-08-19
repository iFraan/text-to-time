const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const monthsRegex = '(' + months.join('|') + ')';

const formats = {
    dot: {
        regex: '(\\d{1,2})\\.(\\d{1,2})(\\.(\\d{4}))?', 
        parse: (arr) => {
            return parseRegexDate(arr, 1, 2, 4);
        }
    },
    slash: {
        regex: '(\\d{1,2})\\/(\\d{1,2})(\\/(\\d{4}))?',
        parse: (arr) => {
            return parseRegexDate(arr, 1, 2, 4);
        }
    }, 
    hyphen: {
        regex: '(\\d{4})-(\\d{1,2})-(\\d{1,2})',
        parse: (arr) => {
            return arr[3] + "." + arr[2] + "." + arr[1];
        }
    }, 
    dayMonth: {
        regex: '(\\d{1,2})\\s+' + monthsRegex + '(\\s*,?\\s*(\\d{4}))?',
        parse: (arr) => {
            return parseRegexDate(arr, 1, 2, 4);
        }
    },
    monthDay: {
        regex: monthsRegex + '\\s+(\\d{1,2})(\\s*,?\\s*(\\d{4}))?',
        parse: (arr) => {
            return parseRegexDate(arr, 2, 1, 4);
        }
    }
};

const masks = new Map([
    ['DD', {regex: '(\\d{2})', type:'days'}],
    ['D', {regex: '(\\d{1,2})', type:'days'}],
    ['MMM', {regex: monthsRegex, type: 'months'}],
    ['MM', {regex: '(\\d{2})', type:'months'}],
    ['M', {regex: '(\\d{1,2})', type:'months'}],
    ['YYYY', {regex: '(\\d{4})', type:'years'}],
]);

function parseRegexDate(arr, dayIndex, monthIndex, yearIndex) {
    let day = arr[dayIndex];
    let month = arr[monthIndex];
    if (months.indexOf(month) >= 0) {
        month = months.indexOf(month) + 1; 
    }
    let parsed = day + '.' + month;
    if (typeof arr[yearIndex] != 'undefined') {
        parsed += '.' + arr[yearIndex];
    }
    return parsed;
}

function normalizeDates(text) {
    let replaced = text;
    for (let f in formats) {
        let format = formats[f];

        let regexp = RegExp(format.regex);
        let arr = regexp.exec(replaced);
        if (arr) {
            replaced = replaced.replace(arr[0], format.parse(arr));
        }
    }
   
    return replaced;
}

function normalizeExplicitlyFormattedDates(text, format) {
    let formatRegex = format;
    
    let masksArr = [];
    for (let [mask, rg] of masks) {
        if (formatRegex.includes(mask)) {
            let maskIndex = format.indexOf(mask);
            let maskType = rg.type;
            formatRegex = formatRegex.replace(mask, rg.regex);
            masksArr.push({index:maskIndex, type:maskType});
        }
    }
    
    masksArr.sort((m1, m2) => {return m1.index - m2.index});
    let maskGroups = {};
    for (let i = 0; i < masksArr.length; ++i) {
        maskGroups[masksArr[i].type] = i;
    }
    
    let regexp = RegExp(formatRegex, 'gi');
    var a;
    let normalizedText = text;
    while ((a = regexp.exec(normalizedText)) != null) {
        let matched = a[0];
        let matchedMonth = a[maskGroups['months'] + 1];
        let resolvedMonth = resolveMonthNumber(matchedMonth);
        let normalized = a[maskGroups['days'] + 1] + '.' + resolvedMonth + '.' + a[maskGroups['years'] + 1];
        normalizedText = normalizedText.replace(matched, normalized);
    }

    return normalizedText;
}

function resolveMonthNumber(matchedMonth) {
    let monthNumber = months.indexOf(matchedMonth.toLowerCase());
    let resolvedMonth = matchedMonth;

    if (monthNumber >= 0) {
        resolvedMonth = monthNumber + 1;
    }

    return resolvedMonth.toString();
}

function parseExplicitlyFormattedDate(text) {
    let split = text.split('.');
    return {
        days: parseInt(split[0]),
        months: parseInt(split[1]), 
        years: parseInt(split[2])
    };
}

function parseNormalizedDate(text) {
    let split = text.split('.');

    // resolve the day and month
    let day, month;
    let potentialDay = split[0];
    let potentialMonth = split[1];

    if (potentialDay <= 31) {
        if (potentialMonth <= 12) {
            day = potentialDay;
            month = potentialMonth;
        } else {
            if (potentialDay <= 12 && potentialMonth <= 31) {
                month = potentialDay;
                day = potentialMonth;
            }
        }
    }

    if (typeof(day) != 'undefined' && typeof(month) != 'undefined') {
        let parsed = {
            days: parseInt(day), 
            months: parseInt(month),
        };

        let year = split[2];
        if (year) {
            parsed['years'] = parseInt(year);
        }

        return parsed;
    }
}

module.exports.normalizeDates = normalizeDates;
module.exports.parseNormalizedDate = parseNormalizedDate;

module.exports.normalizeExplicitlyFormattedDates = normalizeExplicitlyFormattedDates;
module.exports.parseExplicitlyFormattedDate = parseExplicitlyFormattedDate;