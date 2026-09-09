import CryptoJS from "crypto-js";

const SECRET_KEY = "YOUR_SECRET_KEY";

export const encrypt = (data: unknown): string => {
  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    SECRET_KEY
  ).toString();
};

export const decrypt = <T>(encrypted: string): T | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(
      encrypted,
      SECRET_KEY
    );

    return JSON.parse(
      bytes.toString(CryptoJS.enc.Utf8)
    ) as T;
  } catch {
    return null;
  }
};

export const SecureStorage = {

  save(key: string, value: unknown) {
    sessionStorage.setItem(
      key,
      encrypt(value)
    );
  },

  load<T>(key: string): T | null {

    const encrypted =
      sessionStorage.getItem(key);

    if (!encrypted) return null;

    return decrypt<T>(encrypted);
  },

  remove(key: string) {
    sessionStorage.removeItem(key);
  },

  clear() {
    sessionStorage.clear();
  }
};