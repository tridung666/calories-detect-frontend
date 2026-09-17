import { describe, expect, it } from "vitest"

import { sumNutrition } from "@/features/meals/lib/meal-utils"
import { mealItemSchema, mealSchema } from "@/features/meals/schemas/meal-schema"

const item = {
  inputName: " Cơm gà ",
  normalizedName: "",
  quantityGrams: 250,
  calories: 450,
  proteinGrams: 30,
  carbohydrateGrams: 50,
  fatGrams: 12,
}

describe("meal nutrition contract", () => {
  it("adds portion totals without multiplying by the portion's weight", () => {
    expect(sumNutrition([item, { ...item, quantityGrams: 150, calories: 150 }])).toEqual({
      calories: 600,
      proteinGrams: 60,
      carbohydrateGrams: 100,
      fatGrams: 24,
    })
    expect(sumNutrition([]).calories).toBe(0)
  })

  it("accepts zero nutrition and fractional portions with two decimal places", () => {
    const parsed = mealItemSchema.parse({ ...item, calories: 0, quantityGrams: 0.25 })
    expect(parsed.inputName).toBe("Cơm gà")
    expect(parsed.quantityGrams).toBe(0.25)
  })

  it.each([
    { quantityGrams: 0 },
    { quantityGrams: -1 },
    { quantityGrams: 1.001 },
    { calories: -1 },
    { calories: 1.5 },
    { proteinGrams: Number.NaN },
    { carbohydrateGrams: 2_147_483_648 },
    { inputName: "   " },
  ])("rejects invalid backend input %o", (invalid) => {
    expect(mealItemSchema.safeParse({ ...item, ...invalid }).success).toBe(false)
  })

  it("rejects impossible calendar dates and unknown meal types", () => {
    expect(mealSchema.safeParse({ mealType: "BREAKFAST", mealDate: "2026-02-30" }).success).toBe(
      false,
    )
    expect(mealSchema.safeParse({ mealType: "BRUNCH", mealDate: "2026-09-12" }).success).toBe(false)
  })
})
