import { describe, expect, it } from "vitest"

import {
  predictionToReviewItem,
  reviewToConfirmation,
  scalePrediction,
} from "@/features/meals/lib/meal-analysis"
import { mealAnalysisReviewSchema, mealAnalysisSchema } from "@/features/meals/schemas/meal-schema"
import type { MealPredictionItem } from "@/features/meals/types/meal"

const chicken: MealPredictionItem = {
  name: "Ức gà",
  estimatedGrams: 150,
  calories: 248,
  protein: 46.5,
  carbohydrate: 0,
  fat: 5.4,
  confidence: 0.91234,
}

describe("analysis review contract", () => {
  it("scales original portion totals without accumulating rounding errors", () => {
    expect(scalePrediction(chicken, 180)).toEqual({
      calories: 297.6,
      protein: 55.8,
      carbohydrate: 0,
      fat: 6.48,
    })
    expect(scalePrediction(chicken, 150)).toEqual({
      calories: 248,
      protein: 46.5,
      carbohydrate: 0,
      fat: 5.4,
    })
  })

  it("maps estimated grams and removes review metadata from edited confirmation", () => {
    const review = predictionToReviewItem(chicken, 2)
    expect(review.quantityGrams).toBe(150)
    const payload = reviewToConfirmation(
      mealAnalysisReviewSchema.parse({
        items: [
          { ...review, name: "  Gà nướng  ", quantityGrams: 180, ...scalePrediction(chicken, 180) },
        ],
      }),
    )
    expect(payload).toEqual({
      items: [
        {
          name: "Gà nướng",
          quantityGrams: 180,
          calories: 297.6,
          protein: 55.8,
          carbohydrate: 0,
          fat: 6.48,
        },
      ],
    })
  })

  it("accepts the backend prediction including fractional nutrition and unrounded confidence", () => {
    expect(mealAnalysisSchema.parse({ mealId: 123, items: [chicken] }).items[0]).toEqual(chicken)
  })

  it.each([
    { name: " " },
    { name: "x".repeat(256) },
    { estimatedGrams: 0 },
    { estimatedGrams: 150.001 },
    { estimatedGrams: 100_000_000 },
    { calories: -1 },
    { calories: 2_147_483_648 },
    { protein: 1.001 },
    { fat: Number.NaN },
    { confidence: -0.1 },
    { confidence: 1.1 },
  ])("rejects a prediction that cannot be reviewed and saved: %o", (invalid) => {
    expect(
      mealAnalysisSchema.safeParse({ mealId: 123, items: [{ ...chicken, ...invalid }] }).success,
    ).toBe(false)
  })

  it("rejects empty predictions and empty confirmation lists", () => {
    expect(mealAnalysisSchema.safeParse({ mealId: 123, items: [] }).success).toBe(false)
    expect(mealAnalysisReviewSchema.safeParse({ items: [] }).success).toBe(false)
  })
})
