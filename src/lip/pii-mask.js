
// pii-mask.js


const MaskData = require('maskdata');

function maskEmail(
  email,
  opt = {
    maskWith: '*',
    unmaskedStartCharactersBeforeAt: 2,
    unmaskedEndCharactersAfterAt: 2,
    maskAtTheRate: false
  }
) {
  const defaults = {
    maskWith: '*',
    unmaskedStartCharactersBeforeAt: 2,
    unmaskedEndCharactersAfterAt: 2,
    maskAtTheRate: false
  };
  return MaskData.maskEmail2(email, { ...defaults, ...opt });
}

function maskPhone(
  phone,
  opt = { maskWith: '*', unmaskedStartDigits: 4, unmaskedEndDigits: 1 }
) {
  const defaults = { maskWith: '*', unmaskedStartDigits: 4, unmaskedEndDigits: 1 };
  return MaskData.maskPhone(phone, { ...defaults, ...opt });
}

function maskCard(
  card,
  opt = { maskWith: '*', unmaskedStartDigits: 4, unmaskedEndDigits: 1 }
) {
  const defaults = { maskWith: '*', unmaskedStartDigits: 4, unmaskedEndDigits: 1 };
  return MaskData.maskCard(card, { ...defaults, ...opt });
}

/** ====== Mask Thai name (show first 2 characters, mask the rest) ====== **/
function maskThaiName(fullname, keep = 2, maskChar = 'x') {
    const parts = fullname.trim().split(/\s+/); // ตรวจสอบว่ามีการแยกคำจากช่องว่างอย่างถูกต้องหรือไม่
  if (parts.length < 2) {
    console.error('Name format is incorrect:', fullname); // log ข้อความผิดปกติ
    return fullname; // ถ้าไม่สามารถแยกชื่อ-นามสกุลได้
  }
  if (parts.length < 2) return maskWord(fullname, keep, maskChar);
  const prefix = parts.slice(0, parts.length - 2); // e.g., Mr./Ms. (if any)
  const first = parts[parts.length - 2];
  const last = parts[parts.length - 1];
  return [...prefix, maskWord(first, keep, maskChar), maskWord(last, keep, maskChar)].join(' ');
}

function maskWord(word, keep = 2, maskChar = 'x') {
  if (!word) return word;
  if (word.length <= keep) return word[0] + maskChar.repeat(Math.max(0, word.length - 1));
  return word.slice(0, keep) + maskChar.repeat(word.length - keep);
}

/** ====== JSON/Object helper (Mask entire payload) ====== **/
function maskObject(obj, cfg) {
  return MaskData.maskJSON2(obj, cfg);
}

/** Default configuration often used (can be modified as needed) **/
const defaultJsonMaskConfig = {
  emailFields: ['email', 'user.email', 'contacts[*].email'],
  phoneFields: ['phone', 'mobile', 'contacts[*].phone'],
  cardFields: ['card.number', 'cards[*].number'],
  passwordFields: ['password', 'credentials.password'],
  uuidFields: ['uuid', 'user.uuid'],
  jwtFields: ['token', 'auth.jwt'],
  emailMaskOptions: { maskWith: '*', unmaskedStartCharactersBeforeAt: 2, unmaskedEndCharactersAfterAt: 2, maskAtTheRate: false },
  phoneMaskOptions: { maskWith: '*', unmaskedStartDigits: 2, unmaskedEndDigits: 1 },
  cardMaskOptions: { maskWith: 'X', unmaskedStartDigits: 4, unmaskedEndDigits: 4 },
  genericStrings: [
    {
      fields: ['address.line1', 'address.line2'],
      config: { maskWith: '*', unmaskedStartCharacters: 0, unmaskedEndCharacters: 0, maxMaskedCharacters: 64 }
    }
  ]
};

module.exports = {
  maskEmail,
  maskPhone,
  maskCard,
  maskThaiName,
  maskObject,
  defaultJsonMaskConfig
};
