import type { MealAnalysisReviewValues } from "@/features/meals/schemas/meal-schema"
import type {
  ConfirmMealAnalysisRequest,
  ConfirmedMealItem,
  MealPredictionItem,
} from "@/features/meals/types/meal"

export const predictionToReviewItem = (item: MealPredictionItem, sourceIndex: number) => ({
  name: item.name,
  quantityGrams: item.estimatedGrams,
  calories: item.calories,
  protein: item.protein,
  carbohydrate: item.carbohydrate,
  fat: item.fat,
  sourceIndex,
})

export const emptyReviewItem = (): ConfirmedMealItem => ({
  name: "",
  quantityGrams: 100,
  calories: 0,
  protein: 0,
  carbohydrate: 0,
  fat: 0,
})

// Always use the original prediction, avoiding accumulated rounding on repeated edits.
export const scalePrediction = (prediction: MealPredictionItem, quantityGrams: number) => {
  const ratio = quantityGrams / prediction.estimatedGrams
  const round = (value: number) => Math.round(value * ratio * 100) / 100
  return {
    calories: round(prediction.calories),
    protein: round(prediction.protein),
    carbohydrate: round(prediction.carbohydrate),
    fat: round(prediction.fat),
  }
}

// Form-only metadata never crosses the confirmation API boundary.
export const reviewToConfirmation = ({
  items,
}: MealAnalysisReviewValues): ConfirmMealAnalysisRequest => ({
  items: items.map(({ name, quantityGrams, calories, protein, carbohydrate, fat }) => ({
    name,
    quantityGrams,
    calories,
    protein,
    carbohydrate,
    fat,
  })),
})
