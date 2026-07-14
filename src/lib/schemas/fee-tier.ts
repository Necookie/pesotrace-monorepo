import { z } from "zod";

export const feeTierSchema = z.object({
  min: z.coerce.number().min(0),
  max: z.coerce.number().nullable(),
  type: z.enum(["flat", "per_thousand"]),
  fee: z.coerce.number().min(0),
});

export type FeeTier = z.infer<typeof feeTierSchema>;

export const feeTierConfigSchema = z.array(feeTierSchema).min(1);
export type FeeTierConfig = z.infer<typeof feeTierConfigSchema>;

export const DEFAULT_FEE_TIER_CONFIG: FeeTierConfig = [
  { min: 0, max: null, type: "per_thousand", fee: 20 },
];
