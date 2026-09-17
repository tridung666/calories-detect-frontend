import { mealTypes } from "@/features/meals/types/meal"
import { useListParams } from "@/hooks/use-list-params"
import { dateSchema } from "@/lib/validation"

export const useMealFilters = () => {
  const params = useListParams()
  const date = dateSchema.safeParse(params.searchParams.get("date"))
  const mealType = mealTypes.find((type) => type === params.searchParams.get("type"))
  const mealDate = date.success ? date.data : undefined
  return {
    ...params,
    filters: { page: params.page, size: params.size, mealDate, mealType },
    setFilter: (key: "date" | "type", value: string) =>
      params.updateParams({ [key]: value, page: undefined }),
    clearFilters: () => params.updateParams({ date: undefined, type: undefined, page: undefined }),
  }
}
