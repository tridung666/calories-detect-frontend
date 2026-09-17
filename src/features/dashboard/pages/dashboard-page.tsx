import { useRef, useState } from "react"

import { ArrowRight, Plus } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/feedback"
import { DailyMealCard } from "@/features/dashboard/components/daily-meal-card"
import { DailyNutritionSummary } from "@/features/dashboard/components/daily-nutrition-summary"
import { DashboardDateToolbar } from "@/features/dashboard/components/dashboard-date-toolbar"
import { DashboardLoading } from "@/features/dashboard/components/dashboard-loading"
import { MealBreakdown } from "@/features/dashboard/components/meal-breakdown"
import { useDailyNutrition } from "@/features/dashboard/hooks/use-daily-nutrition"
import { MealFormDialog } from "@/features/meals/components/meal-form-dialog"
import { mealTypes, type MealType } from "@/features/meals/types/meal"
import { useProfile } from "@/features/profile/hooks/use-profile"
import { formatDate, today } from "@/lib/format"
import { dateSchema } from "@/lib/validation"

export const DashboardPage = () => {
  const { t } = useTranslation(["common", "dashboard"])

  const [params, setParams] = useSearchParams()
  const parsedDate = dateSchema.safeParse(params.get("date"))
  const date = parsedDate.success ? parsedDate.data : today()
  const query = useDailyNutrition(date)
  const { data: profile } = useProfile()
  const [creating, setCreating] = useState<MealType | null>(null)
  const mealTriggerRef = useRef<HTMLButtonElement | null>(null)
  const navigate = useNavigate()
  const firstName = profile?.fullName.trim().split(/\s+/).at(-1)
  const openMealForm = (type: MealType, trigger: HTMLButtonElement) => {
    mealTriggerRef.current = trigger
    setCreating(type)
  }

  return (
    <>
      <PageHeader
        title={t("dashboard:title")}
        description={
          firstName
            ? t("dashboard:personalSummary", { name: firstName })
            : t("dashboard:description")
        }
        action={
          <Button
            className="h-11 gap-2 px-4 sm:h-10"
            onClick={(event) => openMealForm("BREAKFAST", event.currentTarget)}
          >
            <Plus aria-hidden="true" />
            {t("dashboard:logMeal")}
          </Button>
        }
      />
      <DashboardDateToolbar
        date={date}
        isFetching={query.isFetching}
        onDateChange={(nextDate) => setParams({ date: nextDate })}
        onToday={() => setParams({})}
        onRefresh={query.refetch}
      />
      {query.isPending ? (
        <DashboardLoading />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : (
        <>
          <DailyNutritionSummary
            nutrition={query.nutrition}
            foodCount={query.entries.reduce((total, entry) => total + entry.items.length, 0)}
          />
          <div className="grid items-start gap-6 xl:grid-cols-3">
            <section
              aria-labelledby="daily-meals-title"
              className="min-w-0 overflow-hidden rounded-lg border bg-card xl:col-span-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
                <div className="min-w-0">
                  <h2 id="daily-meals-title" className="text-base font-semibold">
                    {t("dashboard:dailyMeals")}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t("dashboard:recorded", {
                      date: formatDate(date),
                      count: query.entries.length,
                    })}
                  </p>
                </div>
                <Button asChild variant="ghost" className="h-11 gap-2 px-3 sm:h-10">
                  <Link to={`/meals?date=${date}`}>
                    {t("dashboard:viewDiary")}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              {query.entries.length === 0 && (
                <div className="space-y-1 border-b bg-muted/30 p-4 sm:px-5">
                  <h3 className="text-sm font-medium">{t("dashboard:emptyTitle")}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("dashboard:emptyDescription")}
                  </p>
                </div>
              )}
              <div className="divide-y">
                {mealTypes.map((type) => (
                  <DailyMealCard
                    key={type}
                    type={type}
                    entries={query.entries.filter((entry) => entry.meal.mealType === type)}
                    onCreate={(trigger) => openMealForm(type, trigger)}
                  />
                ))}
              </div>
            </section>
            <MealBreakdown entries={query.entries} />
          </div>
        </>
      )}
      {creating && (
        <MealFormDialog
          initialDate={date}
          initialType={creating}
          returnFocusRef={mealTriggerRef}
          onClose={() => setCreating(null)}
          onSaved={(meal) => void navigate(`/meals/${meal.id}`)}
        />
      )}
    </>
  )
}
