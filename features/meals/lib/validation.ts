import { z } from "zod";

export const mealFormSchema = z.object({
  meal_text: z.string().trim().min(1, "Укажите, что ели"),
  eaten_at: z.string().min(1, "Укажите время"),
});

export type MealFormValues = z.infer<typeof mealFormSchema>;
