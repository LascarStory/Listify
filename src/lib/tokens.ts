import { customAlphabet } from "nanoid";

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const generateShareToken = customAlphabet(alphabet, 10);
export const generateAdminToken = customAlphabet(alphabet, 24);
