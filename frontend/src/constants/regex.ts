export const REGEX_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!"#$%&'\\()*+,-./:;<=>?@[\]^_`{|}~])(?=.{8,16}$)([^\u00C0-\u1EF9]+$)/;

export const REGEX_TEXT_PASSWORD = /^(?:(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*)/;
export const REGEX_SPECIAL_CHARACTER_PASSWORD =
  /^(?=.*[!"#$%&'\\()*+,-./:;<=>?@[\]^_`{|}~])([^\u00C0-\u1EF9]+$)/;

export const REGEX_LENGTH_CHARACTER_PASSWORD = /(?=.{8,16}$)/;
export const REGEX_ONLY_NUMBER = /^\d+$/;
export const REGEX_SPECIAL_CHARACTER_USERNAME = /[ ,+"<>'&;^#=():\\/%*|-]/;
// export const REGEX_EMAIL = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
export const REGEX_URL =
  '^((http|https)://)[-a-zA-Z0-9@:%._\\+~#?&//=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%._\\+~#?&//=]*)$';
