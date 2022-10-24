export const isValidRegex = (regexp: string): boolean => {
  let isReg;
  try {
    isReg = eval(regexp) instanceof RegExp;
  } catch (e) {
    isReg = false;
  }
  return isReg;
};

/**
 * return unique id
 * @returns id
 */
export function uniqId(): string {
  return '_' + Math.random().toString(36).substr(2, 9);
}

export function getString(originString: string): string {
  let res = originString.trim();

  const quoteRegx = /"/g;

  // handle '"AUTHENTICATED"'
  if (originString.match(quoteRegx)) {
    res = res.replace(quoteRegx, '');
  }

  return res;
}

// capitalize the first letter of a string, and lowercase the rest
export const capitalize = (s?: string): string => {
  if (typeof s !== 'string') {
    return '';
  }

  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};
