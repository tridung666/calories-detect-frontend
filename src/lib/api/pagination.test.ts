import { expect, it } from "vitest"

import { normalizePage, toPageParams } from "@/lib/api/pagination"

it("adapts the live Spring contract without losing server pagination metadata", () => {
  expect(toPageParams({ page: 2, size: 20 })).toEqual({ pageNo: 2, pageSize: 20 })
  expect(
    normalizePage({
      data: [{ id: 9 }],
      pageNo: 2,
      pageSize: 20,
      totalElements: 41,
      totalPages: 3,
      last: true,
    }),
  ).toEqual({
    content: [{ id: 9 }],
    page: 2,
    size: 20,
    totalElements: 41,
    totalPages: 3,
  })
})
