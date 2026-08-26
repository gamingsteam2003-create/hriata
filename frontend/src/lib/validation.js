// Shared client-side validation helpers for the Apply wizard.
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

export const DISPOSABLE_EMAIL_DOMAINS = [
  "mailinator.com", "yopmail.com", "guerrillamail.com", "guerrillamail.info",
  "sharklasers.com", "10minutemail.com", "tempmail.com", "temp-mail.org",
  "trashmail.com", "getnada.com", "dispostable.com", "maildrop.cc",
  "mailnesia.com", "fakeinbox.com", "throwawaymail.com", "mohmal.com",
  "mailcatch.com", "spam4.me", "moakt.com", "emailondeck.com",
];

const NAME_RE = /^[A-Za-z ]+$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function filterName(value) {
  return (value || "").replace(/[^A-Za-z ]/g, "");
}

export function validateFullName(value) {
  const name = (value || "").trim();
  if (!name) return "Full Name is required";
  if (!NAME_RE.test(name)) return "Name can contain letters and spaces only";
  return null;
}

export function validateEmail(value) {
  const email = (value || "").trim();
  if (!email) return "Email is required";
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return "Enter a valid email address";
  if (email.includes("..")) return "Enter a valid email address";
  if (!EMAIL_RE.test(email)) return "Enter a valid email address";
  const domain = parts[1].toLowerCase();
  const disposable = DISPOSABLE_EMAIL_DOMAINS.some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  );
  if (disposable) return "Please use a permanent email address";
  return null;
}

export function validateState(value) {
  const state = (value || "").trim();
  if (!state) return "State is required";
  if (!INDIAN_STATES.includes(state)) return "Please select a valid state";
  return null;
}
