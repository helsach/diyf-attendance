export const popularCountryCodes = [
  { code: '62', name: 'Indonesia (+62)' },
  { code: '60', name: 'Malaysia (+60)' },
  { code: '65', name: 'Singapore (+65)' },
  { code: '61', name: 'Australia (+61)' },
  { code: '81', name: 'Japan (+81)' },
  { code: '82', name: 'South Korea (+82)' },
  { code: '86', name: 'China (+86)' },
  { code: '66', name: 'Thailand (+66)' },
  { code: '84', name: 'Vietnam (+84)' },
  { code: '63', name: 'Philippines (+63)' },
  { code: '91', name: 'India (+91)' },
  { code: '1', name: 'United States / Canada (+1)' },
  { code: '44', name: 'United Kingdom (+44)' },
  { code: '49', name: 'Germany (+49)' },
  { code: '31', name: 'Netherlands (+31)' },
  { code: '966', name: 'Saudi Arabia (+966)' },
];

export const allCountryCodes = [
  ...popularCountryCodes,
  { code: '93', name: 'Afghanistan (+93)' },
  { code: '355', name: 'Albania (+355)' },
  { code: '213', name: 'Algeria (+213)' },
  { code: '376', name: 'Andorra (+376)' },
  { code: '244', name: 'Angola (+244)' },
  { code: '54', name: 'Argentina (+54)' },
  { code: '374', name: 'Armenia (+374)' },
  { code: '43', name: 'Austria (+43)' },
  { code: '994', name: 'Azerbaijan (+994)' },
  { code: '973', name: 'Bahrain (+973)' },
  { code: '880', name: 'Bangladesh (+880)' },
  { code: '375', name: 'Belarus (+375)' },
  { code: '32', name: 'Belgium (+32)' },
  { code: '55', name: 'Brazil (+55)' },
  { code: '673', name: 'Brunei (+673)' },
  { code: '359', name: 'Bulgaria (+359)' },
  { code: '855', name: 'Cambodia (+855)' },
  { code: '56', name: 'Chile (+56)' },
  { code: '57', name: 'Colombia (+57)' },
  { code: '385', name: 'Croatia (+385)' },
  { code: '357', name: 'Cyprus (+357)' },
  { code: '420', name: 'Czech Republic (+420)' },
  { code: '45', name: 'Denmark (+45)' },
  { code: '20', name: 'Egypt (+20)' },
  { code: '358', name: 'Finland (+358)' },
  { code: '33', name: 'France (+33)' },
  { code: '995', name: 'Georgia (+995)' },
  { code: '30', name: 'Greece (+30)' },
  { code: '852', name: 'Hong Kong (+852)' },
  { code: '36', name: 'Hungary (+36)' },
  { code: '98', name: 'Iran (+98)' },
  { code: '964', name: 'Iraq (+964)' },
  { code: '353', name: 'Ireland (+353)' },
  { code: '39', name: 'Italy (+39)' },
  { code: '962', name: 'Jordan (+962)' },
  { code: '7', name: 'Kazakhstan / Russia (+7)' },
  { code: '254', name: 'Kenya (+254)' },
  { code: '965', name: 'Kuwait (+965)' },
  { code: '856', name: 'Laos (+856)' },
  { code: '961', name: 'Lebanon (+961)' },
  { code: '352', name: 'Luxembourg (+352)' },
  { code: '52', name: 'Mexico (+52)' },
  { code: '212', name: 'Morocco (+212)' },
  { code: '95', name: 'Myanmar (+95)' },
  { code: '977', name: 'Nepal (+977)' },
  { code: '64', name: 'New Zealand (+64)' },
  { code: '234', name: 'Nigeria (+234)' },
  { code: '47', name: 'Norway (+47)' },
  { code: '968', name: 'Oman (+968)' },
  { code: '92', name: 'Pakistan (+92)' },
  { code: '970', name: 'Palestine (+970)' },
  { code: '48', name: 'Poland (+48)' },
  { code: '351', name: 'Portugal (+351)' },
  { code: '974', name: 'Qatar (+974)' },
  { code: '27', name: 'South Africa (+27)' },
  { code: '34', name: 'Spain (+34)' },
  { code: '94', name: 'Sri Lanka (+94)' },
  { code: '46', name: 'Sweden (+46)' },
  { code: '41', name: 'Switzerland (+41)' },
  { code: '886', name: 'Taiwan (+886)' },
  { code: '670', name: 'Timor-Leste (+670)' },
  { code: '90', name: 'Turkey (+90)' },
  { code: '971', name: 'United Arab Emirates (+971)' },
  { code: '998', name: 'Uzbekistan (+998)' },
  { code: '967', name: 'Yemen (+967)' },
];

/**
 * Normalizes user-inputted phone number to an E.164 compatible string of digits (without leading +).
 * Handles:
 * - Direct +countrycode (e.g. +60123456789 -> 60123456789)
 * - Local 08... (e.g. 08123456789 -> 628123456789 when countryCode is 62)
 * - Number with country code already (e.g. 60123456789 -> 60123456789)
 * - Plain number using selected country code
 */
export function normalizeWhatsAppNumber(rawInput, selectedCountryCode = '62') {
  if (!rawInput) return '';
  const cleaned = rawInput.trim().replace(/[^\d+]/g, '');
  if (!cleaned) return '';

  if (cleaned.startsWith('+')) {
    return cleaned.slice(1);
  }

  if (cleaned.startsWith('0')) {
    return `${selectedCountryCode}${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith(selectedCountryCode)) {
    return cleaned;
  }

  return `${selectedCountryCode}${cleaned}`;
}

export function isValidWhatsAppNumber(number) {
  const digits = String(number).replace(/[^\d]/g, '');
  return /^\d{7,16}$/.test(digits);
}
