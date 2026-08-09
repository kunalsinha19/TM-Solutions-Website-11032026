/**
 * Invoice module — shared validation utilities.
 *
 * Every exported validate* function returns null on success or an error
 * string on failure.  Fields are optional by default (empty string → null).
 */

// ── Shared form type (customers) ─────────────────────────────────────────────

export type CustomerFormData = {
  name: string;
  email: string;
  phone: string;
  altPhone: string;
  company: string;
  gstin: string;
  pan: string;
  customerType: string;
  creditLimit: number;
  creditDays: number;
  billingAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    stateCode: string;
    pincode: string;
    country: string;
  };
  notes: string;
};

export const EMPTY_CUSTOMER: CustomerFormData = {
  name: "", email: "", phone: "", altPhone: "", company: "",
  gstin: "", pan: "", customerType: "retail",
  creditLimit: 0, creditDays: 30,
  billingAddress: {
    line1: "", line2: "", city: "", state: "",
    stateCode: "", pincode: "", country: "India",
  },
  notes: "",
};

export const CUSTOMER_TYPES = ["retail", "wholesale", "dealer", "distributor", "other"] as const;

// ── Indian state codes (GST) for lookup ─────────────────────────────────────

export const STATE_CODE_MAP: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
  "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam",
  "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
  "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
  "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands",
  "36": "Telangana", "37": "Andhra Pradesh (New)",
  "38": "Ladakh", "97": "Other Territory", "99": "Centre Jurisdiction",
};

// ── Individual field validators ──────────────────────────────────────────────

/** Trim + min/max length check. */
export function validateName(v: string, label = "Name"): string | null {
  const t = v.trim();
  if (!t) return `${label} is required`;
  if (t.length < 2) return `${label} must be at least 2 characters`;
  if (t.length > 100) return `${label} is too long (max 100 characters)`;
  return null;
}

/** RFC 5322-simplified email check. */
export function validateEmail(v: string): string | null {
  if (!v) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
    ? null
    : "Enter a valid email address (e.g. name@domain.com)";
}

/**
 * Indian mobile number.
 * Accepts:  9XXXXXXXXX  /  09XXXXXXXXX  /  +91-9XXXXXXXXX  /  91-9XXXXXXXXX
 * Must be 10 digits starting with 6–9.
 */
export function validatePhone(v: string): string | null {
  if (!v) return null;
  const cleaned = v.replace(/[\s\-()+]/g, "");
  return /^(91|0)?[6-9]\d{9}$/.test(cleaned)
    ? null
    : "Enter a valid 10-digit Indian mobile number (starts with 6–9)";
}

/**
 * GSTIN — 15 chars, format: 22AAAAA0000A1Z5
 * Position:  1-2 state code · 3-12 PAN · 13 entity # · 14 always Z · 15 checksum
 */
export function validateGSTIN(v: string): string | null {
  if (!v) return null;
  const g = v.toUpperCase().trim();
  if (g.length !== 15) return "GSTIN must be exactly 15 characters";
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(g)) {
    return "Invalid GSTIN format — expected: 22AAAAA0000A1Z5";
  }
  const sc = parseInt(g.slice(0, 2), 10);
  if (sc < 1 || sc > 99 || !STATE_CODE_MAP[g.slice(0, 2)]) {
    return `Unrecognised state code "${g.slice(0, 2)}" in GSTIN`;
  }
  return null;
}

/**
 * PAN — 10 chars, format: ABCDE1234F
 * The 4th char identifies entity type:
 *   P=Person  C=Company  H=HUF  F=Firm  A=AOP  T=Trust  B=BOI
 *   L=LLP  J=Artificial Juridical Person  G=Government
 */
export function validatePAN(v: string): string | null {
  if (!v) return null;
  const p = v.toUpperCase().trim();
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(p)) {
    return "Invalid PAN — expected format: ABCDE1234F";
  }
  const entityChar = p[3];
  const validEntityChars = "PCHABFTLJG";
  if (!validEntityChars.includes(entityChar)) {
    return `Unknown entity type "${entityChar}" at PAN position 4`;
  }
  return null;
}

/**
 * Cross-validate: chars 3–12 of GSTIN must equal PAN.
 * Only runs if BOTH values are present and individually valid.
 */
export function crossValidateGSTINPAN(gstin: string, pan: string): string | null {
  if (!gstin || !pan) return null;
  const g = gstin.toUpperCase().trim();
  const p = pan.toUpperCase().trim();
  if (g.length !== 15 || p.length !== 10) return null;
  const embeddedPAN = g.slice(2, 12);
  if (embeddedPAN !== p) {
    return `GSTIN doesn't match PAN — embedded PAN in GSTIN is "${embeddedPAN}", but you entered "${p}"`;
  }
  return null;
}

/** 6-digit Indian pincode. */
export function validatePincode(v: string): string | null {
  if (!v) return null;
  return /^\d{6}$/.test(v) ? null : "Pincode must be exactly 6 digits";
}

/** GST state code: 2-digit number 01–38. */
export function validateStateCode(v: string): string | null {
  if (!v) return null;
  const padded = v.padStart(2, "0");
  if (!/^\d{1,2}$/.test(v)) return "State code must be a number (e.g. 27)";
  if (!STATE_CODE_MAP[padded]) return `Unknown GST state code "${v}" (valid: 01–38)`;
  return null;
}

/** Non-negative number. */
export function validateNonNegative(v: number, label: string): string | null {
  if (v < 0) return `${label} cannot be negative`;
  return null;
}

/**
 * IFSC code — 11 chars.
 * Format: AAAA0XXXXXX
 *   1–4  bank code (letters)
 *   5    always 0
 *   6–11 branch code (alphanumeric)
 */
export function validateIFSC(v: string): string | null {
  if (!v) return null;
  const i = v.toUpperCase().trim();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(i))
    return "Invalid IFSC — expected format: SBIN0001234 (11 chars, 5th char is 0)";
  return null;
}

/** Bank account number — 9 to 18 digits. */
export function validateBankAccount(v: string): string | null {
  if (!v) return null;
  const b = v.replace(/\s/g, "");
  if (!/^\d{9,18}$/.test(b))
    return "Bank account must be 9–18 digits";
  return null;
}

// ── Supplier form type ───────────────────────────────────────────────────────

export type SupplierFormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  gstin: string;
  pan: string;
  address: {
    line1: string;
    city: string;
    state: string;
    stateCode: string;
    pincode: string;
    country: string;
  };
  bankName: string;
  bankAccount: string;
  bankIFSC: string;
  paymentTerms: number;
  notes: string;
};

export const EMPTY_SUPPLIER: SupplierFormData = {
  name: "", email: "", phone: "", company: "", gstin: "", pan: "",
  address: { line1: "", city: "", state: "", stateCode: "", pincode: "", country: "India" },
  bankName: "", bankAccount: "", bankIFSC: "", paymentTerms: 30, notes: "",
};

// ── Composite: run all customer validations ──────────────────────────────────

export type FieldErrors = Record<string, string>;

export function validateCustomerForm(fd: CustomerFormData): FieldErrors {
  const e: FieldErrors = {};

  const nameErr = validateName(fd.name, "Customer name");
  if (nameErr) e.name = nameErr;

  const emailErr = validateEmail(fd.email);
  if (emailErr) e.email = emailErr;

  const phoneErr = validatePhone(fd.phone);
  if (phoneErr) e.phone = phoneErr;

  const altPhoneErr = validatePhone(fd.altPhone);
  if (altPhoneErr) e.altPhone = altPhoneErr;

  const gstinErr = validateGSTIN(fd.gstin);
  if (gstinErr) e.gstin = gstinErr;

  const panErr = validatePAN(fd.pan);
  if (panErr) e.pan = panErr;

  // Cross-validate only when both pass their own checks
  if (!e.gstin && !e.pan) {
    const crossErr = crossValidateGSTINPAN(fd.gstin, fd.pan);
    if (crossErr) e.gstin = crossErr;
  }

  const pincodeErr = validatePincode(fd.billingAddress.pincode);
  if (pincodeErr) e["addr.pincode"] = pincodeErr;

  const scErr = validateStateCode(fd.billingAddress.stateCode);
  if (scErr) e["addr.stateCode"] = scErr;

  const clErr = validateNonNegative(Number(fd.creditLimit), "Credit limit");
  if (clErr) e.creditLimit = clErr;

  const cdErr = validateNonNegative(Number(fd.creditDays), "Credit days");
  if (cdErr) e.creditDays = cdErr;

  return e;
}

// ── Composite: run all supplier validations ──────────────────────────────────

export function validateSupplierForm(fd: SupplierFormData): FieldErrors {
  const e: FieldErrors = {};

  const nameErr = validateName(fd.name, "Supplier name");
  if (nameErr) e.name = nameErr;

  const emailErr = validateEmail(fd.email);
  if (emailErr) e.email = emailErr;

  const phoneErr = validatePhone(fd.phone);
  if (phoneErr) e.phone = phoneErr;

  const gstinErr = validateGSTIN(fd.gstin);
  if (gstinErr) e.gstin = gstinErr;

  const panErr = validatePAN(fd.pan);
  if (panErr) e.pan = panErr;

  if (!e.gstin && !e.pan) {
    const crossErr = crossValidateGSTINPAN(fd.gstin, fd.pan);
    if (crossErr) e.gstin = crossErr;
  }

  const pincodeErr = validatePincode(fd.address.pincode);
  if (pincodeErr) e["addr.pincode"] = pincodeErr;

  const scErr = validateStateCode(fd.address.stateCode);
  if (scErr) e["addr.stateCode"] = scErr;

  const ifscErr = validateIFSC(fd.bankIFSC);
  if (ifscErr) e.bankIFSC = ifscErr;

  const baErr = validateBankAccount(fd.bankAccount);
  if (baErr) e.bankAccount = baErr;

  const ptErr = validateNonNegative(Number(fd.paymentTerms), "Payment terms");
  if (ptErr) e.paymentTerms = ptErr;

  return e;
}
