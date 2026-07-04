import { z } from "zod";

export const weightFormSchema = z.object({
  measured_at: z.string().min(1, "Укажите дату"),
  weight: z.number().min(20).max(300),
});

export type WeightFormValues = z.infer<typeof weightFormSchema>;
