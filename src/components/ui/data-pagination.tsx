import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { PageParams } from "@/lib/api/api-types"

type DataPaginationProps = PageParams & {
  totalElements: number
  totalPages: number
  disabled?: boolean
  onChange: (params: PageParams) => void
}

export const DataPagination = ({
  page,
  size,
  totalElements,
  totalPages,
  disabled,
  onChange,
}: DataPaginationProps) => {
  const { t } = useTranslation(["common"])
  return (
    <nav
      aria-label={t("common:pagination.label")}
      className="flex flex-wrap items-center justify-between gap-4 border-t px-4 py-4"
    >
      <p className="text-sm text-muted-foreground">
        {totalElements
          ? t("pagination.results", {
              start: page * size + 1,
              end: Math.min((page + 1) * size, totalElements),
              count: totalElements,
            })
          : t("pagination.empty")}
      </p>
      <div className="flex items-center gap-3">
        <NativeSelect
          aria-label={t("common:pagination.pageSize")}
          value={size}
          disabled={disabled}
          onChange={(event) => onChange({ page: 0, size: Number(event.target.value) })}
        >
          {[10, 20, 50].map((value) => (
            <NativeSelectOption key={value} value={value}>
              {t("pagination.perPage", { count: value })}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <span className="text-sm tabular-nums">
          {t("pagination.page", { current: totalPages ? page + 1 : 0, total: totalPages })}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("common:pagination.previous")}
          disabled={disabled || page === 0}
          onClick={() => onChange({ page: page - 1, size })}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("common:pagination.next")}
          disabled={disabled || page + 1 >= totalPages}
          onClick={() => onChange({ page: page + 1, size })}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
