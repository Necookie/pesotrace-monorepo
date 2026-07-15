import { z } from "zod";

const PH_MOBILE_RE = /^(0|\+63)9\d{9}$/;

export const storePhoneNumberSchema = z
  .string()
  .trim()
  .regex(PH_MOBILE_RE, "Use a PH mobile number like 09171234567 or +639171234567");

export const storePhoneNumbersSchema = z.array(storePhoneNumberSchema);
export type StorePhoneNumbers = z.infer<typeof storePhoneNumbersSchema>;
