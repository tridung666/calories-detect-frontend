# Calories Detect — Hướng dẫn dev mới và kết quả review

Ngày review: **16/09/2026**. Phạm vi: toàn bộ working tree hiện tại, bao gồm các
file chưa commit, cấu hình test, CI/CD và đặc tả OpenAPI của backend local.

**Kết luận: đã có phần lớn chức năng của MVP ghi nhật ký ăn uống thủ công, nhưng
chưa đủ điều kiện xác nhận hoàn thiện để release.** Lint, unit test và build đạt;
bộ E2E trong repo đang lỗi, CI chưa chạy test và còn các vấn đề bên dưới.

Nếu mới vào dự án: đọc mục 1 để biết trạng thái, làm theo mục 2 để chạy local,
rồi dùng mục 4 và mục 6 để chọn đúng nơi bắt đầu code.

## 1. Trạng thái dự án

### Những phần đã có

| Phần      | Route                           | Chức năng hiện tại                                                                                                              |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Auth      | `/auth/login`, `/auth/register` | Đăng nhập, đăng ký, validation, quay lại trang yêu cầu sau đăng nhập, logout, refresh token; Google login có điều kiện cấu hình |
| Dashboard | `/dashboard?date=YYYY-MM-DD`    | Chọn ngày, tổng dinh dưỡng, nhóm bữa sáng/trưa/tối/phụ, tạo bữa ăn                                                              |
| Meals     | `/meals`, `/meals/:mealId`      | Tạo/sửa/xóa bữa ăn và món ăn, lọc ngày/loại bữa, phân trang, cộng dinh dưỡng theo khẩu phần                                     |
| Profile   | `/profile`                      | Xem thông tin tài khoản, đổi mật khẩu                                                                                           |
| Admin     | `/admin/users`                  | Guard theo vai trò, danh sách người dùng, tạo tài khoản                                                                         |
| UI chung  | Các trang trên                  | Layout desktop/mobile, theme sáng/tối, tiếng Việt/Anh, loading/empty/error, dialog xác nhận xóa                                 |
| Hạ tầng   | —                               | TypeScript strict, lazy routes, Axios dùng chung, TanStack Query, Docker/Nginx, workflow CI/CD                                  |

Chưa có luồng tải ảnh/chụp ảnh và nhận diện món ăn/calories, danh mục thực phẩm
độc lập, chỉnh sửa hồ sơ, quên mật khẩu hoặc sửa/xóa người dùng admin. Source và
OpenAPI đã xem chưa cung cấp các luồng này. Đây là **phạm vi cần chốt với product
và backend**, không tự suy ra tất cả đều là yêu cầu bắt buộc từ tên dự án.

### Kết quả kiểm tra thực tế

Môi trường review: Node `26.7.0`, npm `11.19.0`, Chrome qua Playwright. CI/Docker
dùng Node 22; kết quả local này không thay thế việc chạy trên môi trường CI.

| Kiểm tra                                                            | Kết quả                                                                                                                                     |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                                      | Đạt                                                                                                                                         |
| `npm run format:check`                                              | Đạt                                                                                                                                         |
| `npm run test`                                                      | **45/45 test đạt**, trong 6 file                                                                                                            |
| `npm run build`                                                     | Đạt TypeScript và Vite production build                                                                                                     |
| `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` trên repo nguyên trạng | **13/13 test thất bại**; nguyên nhân chặn khởi động được mô tả ở R1                                                                         |
| E2E trong bản sao test tạm, đã chỉnh R1                             | 13 luồng có sẵn đạt; thêm 1 ca chẩn đoán xác nhận lỗi phân trang R3                                                                         |
| Đối chiếu API                                                       | Đọc thành công [OpenAPI local](http://127.0.0.1:8080/v3/api-docs), gồm 13 path/19 operation; đối chiếu endpoint, phân trang và schema chính |

Bản sao test tạm chỉ phục vụ chẩn đoán; **các chỉnh sửa đó chưa được áp dụng vào
repo**. Ca chẩn đoán R3 đạt nghĩa là tái hiện được lỗi, không có nghĩa lỗi đã sửa.
Đã xem ảnh dashboard desktop và profile mobile từ lượt chạy tạm. E2E dùng API
mock; chưa chạy CRUD bằng tài khoản/backend thật, Google OAuth thật, Docker build
hay triển khai VPS. Đọc OpenAPI chỉ xác minh đặc tả, không xác minh hành vi runtime
hoặc quyền truy cập dữ liệu giữa các tài khoản.

### Các việc cần xử lý

Ưu tiên P1: cần xử lý trước khi dùng kết quả kiểm thử để xác nhận release.
Ưu tiên P2: lỗi chức năng/cấu hình/tài liệu cần sửa theo phạm vi bản phát hành.

| Mã  | Ưu tiên | Phát hiện và tác động                                                                                                                                           | Nơi bắt đầu                                                                                                                                                                                                                                               | Tiêu chí hoàn thành                                                                                                                                        |
| --- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | P1      | Mock API bắt cả module Vite, làm ứng dụng không khởi động trong E2E; sau khi thu hẹp mock còn lỗi chờ route và giả định sai về cache                            | [fixtures.ts](../e2e/fixtures.ts#L32), [i18n.spec.ts](../e2e/i18n.spec.ts#L26), [meals.spec.ts](../e2e/meals.spec.ts#L67), [playwright.config.ts](../playwright.config.ts)                                                                                | Chạy 13 E2E trong chính repo đạt, không phụ thuộc `.env` cá nhân                                                                                           |
| R2  | P1      | CI chỉ chạy lint/build; lỗi test vẫn có thể qua CI rồi được CD build/publish                                                                                    | [ci.yml](../.github/workflows/ci.yml#L28), [cd.yml](../.github/workflows/cd.yml)                                                                                                                                                                          | CI chạy format, unit test, E2E với browser được cài; test lỗi phải làm CI thất bại                                                                         |
| R3  | P2      | URL vượt số trang làm UI báo khoảng kết quả ngược và empty state gây hiểu nhầm                                                                                  | [use-list-params.ts](../src/hooks/use-list-params.ts#L7), [data-pagination.tsx](../src/components/ui/data-pagination.tsx#L30), [meals-page.tsx](../src/features/meals/pages/meals-page.tsx), [users-page.tsx](../src/features/admin/pages/users-page.tsx) | Khi dữ liệu cho biết page vượt giới hạn, đưa URL về trang hợp lệ; không hiển thị khoảng ngược hay báo chưa có dữ liệu khi tổng vẫn dương                   |
| R4  | P2      | Google login bị ẩn trong image theo pipeline hiện tại: UI cần client ID lúc build, nhưng Docker/CD chỉ truyền API base URL và `.env` bị loại khỏi build context | [google-sign-in.tsx](../src/features/auth/components/google-sign-in.tsx#L17), [Dockerfile](../Dockerfile#L11), [cd.yml](../.github/workflows/cd.yml#L110), [.dockerignore](../.dockerignore)                                                              | Nếu release có Google login: truyền `VITE_GOOGLE_CLIENT_ID` qua build, cấu hình origin hợp lệ và smoke test image; để trống chỉ khi chủ đích tắt tính năng |
| R5  | P2      | Tài liệu ghi backend dùng `page/size/content`, trong khi OpenAPI và code dùng `pageNo/pageSize/data`; dev mới dễ gọi API sai                                    | [api-conventions.md](./api-conventions.md#L90), [pagination.ts](../src/lib/api/pagination.ts), [api-types.ts](../src/lib/api/api-types.ts)                                                                                                                | Cập nhật tài liệu, phân biệt contract backend và model UI; giữ adapter hiện tại theo OpenAPI                                                               |

Chi tiết để xử lý R1:

- `page.route("**/api/**", ...)` khớp cả `/src/lib/api/token-storage.ts`. Trace
  ghi nhận request module này nhận JSON 404 từ mock. Chỉ match URL có
  `url.pathname.startsWith("/api/")`; không match mọi đường dẫn chứa `/api/`.
- Test i18n chuyển từ register sang login rồi điền email ngay. Cần chờ URL/trang
  login sẵn sàng để tránh điền vào form register đang chờ chuyển route. Bản tạm
  thêm `await expect(page).toHaveURL(/\/auth\/login$/)` sau click.
- Test lỗi API bật `failMeals` rồi xóa bộ lọc, nhưng danh sách mặc định vẫn nằm
  trong cache còn mới (`staleTime: 30_000`). Trace không có request mới tới danh
  sách mặc định; vì vậy không thể chờ UI lỗi 500. Bản tạm reload sau xóa bộ lọc để
  thực sự gọi API lỗi; có thể thiết kế ca test bằng một query chưa được cache.
- Đặt môi trường web server E2E rõ ràng: `VITE_API_BASE_URL=/api` và
  `VITE_GOOGLE_CLIENT_ID=""` cho các test không kiểm tra OAuth. Nếu cần test Google,
  tạo ca riêng với SDK/API được kiểm soát.

Chi tiết tái hiện R3: có 1 bữa ăn, mở `/meals?page=99`. Với phản hồi mock hợp lệ
`pageNo=98`, `pageSize=10`, `data=[]`, `totalElements=1`, `totalPages=1`, UI hiển thị
`981–1 trong 1 kết quả`, `99 / 1` và “Bắt đầu với bữa ăn đầu tiên”. Hook hiện chỉ
kiểm tra page là số nguyên dương, chưa đối chiếu tổng số trang. Cần kiểm tra cả
trường hợp dữ liệu giảm do thao tác ở tab khác và trang danh sách admin dùng chung
component phân trang.

## 2. Chạy dự án trên máy mới

### Đọc trước khi sửa code

1. [AGENTS.md](../AGENTS.md).
2. [Frontend rules](./frontend-rules.md).
3. [API conventions](./api-conventions.md), cùng lưu ý R5 và mục 5 bên dưới.
4. [UI design](./ui-design.md).
5. [Hướng dẫn i18n](./i18n.md).

### Cài đặt và cấu hình

Dùng **Node 22 từ 22.12.0 trở lên trong nhánh 22.x** để đồng bộ CI/Docker và đáp
ứng engines của Vite/Vitest đang cài. Dùng npm và giữ `package-lock.json`.

```bash
node --version
npm --version
npm ci
```

Nếu chưa có `.env`, tạo từ mẫu; giữ cấu hình cá nhân nếu file đã tồn tại:

```bash
cp .env.example .env
```

| Biến                    | Giá trị mặc định/mẫu    | Ý nghĩa                                                                               |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | `/api`                  | Prefix Axios dùng trong trình duyệt; giá trị được đưa vào bundle khi build            |
| `API_PROXY_TARGET`      | `http://localhost:8080` | Địa chỉ backend mà Vite dev server proxy tới; không dùng để cấu hình Nginx production |
| `VITE_GOOGLE_CLIENT_ID` | Trống                   | Bật Google login khi có OAuth client ID phù hợp backend/origin; lưu ý R4 với Docker   |

Mọi giá trị `VITE_*` đều có thể xuất hiện trong frontend bundle; không đặt secret
backend vào đây. Restart Vite sau khi sửa `.env`.

```bash
npm run dev
```

Mở URL Vite in ra, mặc định `http://localhost:5173`. Browser gọi
`/api/meal` → Vite proxy tới `http://localhost:8080/api/meal`; prefix `/api` được
giữ nguyên. API function chỉ ghi `/meal`, tránh lặp thành `/api/api/meal`.

Repo này không chứa backend hoặc Docker Compose/database của backend. Để thao tác
dữ liệu thật, cần backend đang chạy và tài khoản test có vai trò phù hợp. Có thể
đọc [OpenAPI local](http://127.0.0.1:8080/v3/api-docs) khi backend dùng cổng mặc định.
Tài khoản trong `e2e/fixtures.ts` chỉ hoạt động khi Playwright cài mock cho trang;
`npm run dev` không tự bật chế độ dữ liệu giả.

### Chạy kiểm tra

```bash
npm run lint
npm run format:check
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Nếu dùng Chrome đã cài trên macOS/Linux:

```bash
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

Playwright tự mở Vite tại `127.0.0.1:4173`. Sửa R1 trước khi kỳ vọng suite đạt.
Đảm bảo cổng này không đang phục vụ một bản app/cấu hình khác vì local config cho
phép tái sử dụng server có sẵn. Trong CI Linux, cần cài cả browser và dependency
hệ thống, ví dụ `npx playwright install --with-deps chromium`.

`npm run preview` xem bundle trong `dist` sau build. Preview không sử dụng Nginx
production, nên không thay thế kiểm tra image và reverse proxy khi phát hành.

## 3. Bản đồ code

```text
src/
  main.tsx                      Mount React
  App.tsx                       Providers + router + toaster
  app/
    providers/                  QueryClient, theme, language, xử lý cache theo session
    router/                     Route tree, lazy pages, trang lỗi/404
  features/
    auth/                       Đăng nhập/đăng ký, session, Google, route guards
    dashboard/                  Tổng hợp bữa ăn và dinh dưỡng theo ngày
    meals/                      Bữa ăn, món ăn, filters, CRUD, dinh dưỡng
    profile/                    Thông tin người dùng và form đổi mật khẩu
    admin/                      Danh sách/tạo người dùng
  components/
    layout/                     AuthLayout, AppLayout, navigation, PageHeader
    ui/                         shadcn primitives và thành phần dùng lại
  hooks/                        Hook chung: list params, page title, theme
  lib/
    axios.ts                    Axios instance duy nhất, auth interceptors
    api/                        Envelope, pagination, token storage, refresh, errors
    i18n/                       Cấu hình, resources, typed translation keys
    validation.ts               Schema dùng chung
    format.ts                   Ngày/số theo locale, ngày local
  locales/{vi,en}/               JSON dịch theo namespace
  index.css                     Tailwind v4, theme tokens, font
e2e/                            Playwright scenarios và mock API
docs/                           Quy ước và hướng dẫn
.github/workflows/              CI và CD
```

Luồng dữ liệu cần giữ:

```text
Page / Component
  → Hook TanStack Query hoặc mutation
  → API function trong feature
  → apiClient trong src/lib/axios.ts
  → /api/... trên backend
  → bóc response.data.data / normalizePage
  → Query cache → UI
```

Server state ở TanStack Query; trạng thái mở dialog ở component; page/filter ở URL;
form ở React Hook Form và Zod. Chưa có Zustand trong project.

## 4. Nhận task thì mở file nào?

| Task                                 | File bắt đầu đọc/sửa                                                                                                                                                                                                                                            |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thêm route/trang, đổi quyền truy cập | [app-router.tsx](../src/app/router/app-router.tsx), [protected-route.tsx](../src/features/auth/components/protected-route.tsx)                                                                                                                                  |
| Sửa menu, header, mobile layout      | [app-navigation.tsx](../src/components/layout/app-navigation.tsx), [app-layout.tsx](../src/components/layout/app-layout.tsx)                                                                                                                                    |
| Login, refresh, session, lỗi 401     | [use-login.ts](../src/features/auth/hooks/use-login.ts), [axios.ts](../src/lib/axios.ts), [refresh-token.ts](../src/lib/api/refresh-token.ts), [session.ts](../src/features/auth/lib/session.ts)                                                                |
| Danh sách/lọc/phân trang bữa ăn      | [meals-page.tsx](../src/features/meals/pages/meals-page.tsx), [use-meal-filters.ts](../src/features/meals/hooks/use-meal-filters.ts), [use-list-params.ts](../src/hooks/use-list-params.ts)                                                                     |
| Thêm/sửa field món ăn                | [meal.ts](../src/features/meals/types/meal.ts), [meal-schema.ts](../src/features/meals/schemas/meal-schema.ts), [meal-item-form-dialog.tsx](../src/features/meals/components/meal-item-form-dialog.tsx), [meals-api.ts](../src/features/meals/api/meals-api.ts) |
| Sai tổng calories/macros             | [use-daily-nutrition.ts](../src/features/dashboard/hooks/use-daily-nutrition.ts), [dashboard-api.ts](../src/features/dashboard/api/dashboard-api.ts), [meal-utils.ts](../src/features/meals/lib/meal-utils.ts)                                                  |
| Profile/đổi mật khẩu                 | [profile-page.tsx](../src/features/profile/pages/profile-page.tsx), [change-password-form.tsx](../src/features/profile/components/change-password-form.tsx), [auth-schema.ts](../src/features/auth/schemas/auth-schema.ts)                                      |
| Danh sách/tạo user admin             | [users-page.tsx](../src/features/admin/pages/users-page.tsx), [use-users.ts](../src/features/admin/hooks/use-users.ts), [users-api.ts](../src/features/admin/api/users-api.ts)                                                                                  |
| Copy, validation, thông báo lỗi      | `src/locales/vi`, `src/locales/en`, [validation.ts](../src/lib/validation.ts), [api-error.ts](../src/lib/api/api-error.ts)                                                                                                                                      |
| Màu/theme, UI dùng chung             | [index.css](../src/index.css), `src/components/ui`, [theme-provider.tsx](../src/components/theme-provider.tsx)                                                                                                                                                  |

Để hiểu một feature từ đầu đến cuối, đọc luồng tạo bữa ăn theo thứ tự:
`meals-page.tsx` → `meal-form-dialog.tsx` → `meal-schema.ts` →
`use-meal-mutations.ts` → `meals-api.ts` → `axios.ts`, rồi xem
[meals.spec.ts](../e2e/meals.spec.ts) để hiểu hành vi mong đợi.

## 5. Các contract phải nắm trước khi code

### API và phân trang

Response có envelope `{ code, message, data }`, backend hiện còn có `success`.
Lấy payload bằng `response.data.data`. Chỉ import `apiClient` dùng chung; component
không gọi Axios trực tiếp, không tạo Axios instance riêng cho từng feature.

Đối chiếu OpenAPI local trong lần review này:

| Nhóm       | HTTP và path tương đối với `/api`                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Auth       | `POST /auth/login`, `/auth/register`, `/auth/google`, `/auth/refresh-token`, `/auth/logout`; `PUT /auth/change-password` |
| Profile    | `GET /user/{id}`                                                                                                         |
| Meals      | `GET /meal`, `POST /meal/create`; `GET`, `PUT`, `DELETE /meal/{id}`                                                      |
| Meal items | `GET`, `POST /meal/{mealId}/items`; `PUT`, `DELETE /meal/{mealId}/items/{itemId}`                                        |
| Admin      | `GET`, `POST /admin/users`                                                                                               |

OpenAPI còn có `GET /meal/{mealId}/items/{itemId}`; UI hiện dùng danh sách items,
chưa cần API function riêng cho thao tác đọc từng item.

Phân biệt ba lớp phân trang:

| Lớp                               | Ví dụ trang đầu                  |
| --------------------------------- | -------------------------------- |
| URL của UI, bắt đầu từ 1          | `/meals?page=1&size=10`          |
| Model trong UI/hook, bắt đầu từ 0 | `{ page: 0, size: 10 }`          |
| Request backend, bắt đầu từ 0     | `/api/meal?pageNo=0&pageSize=10` |

Payload phân trang của backend nằm trong envelope:

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {
    "data": [],
    "pageNo": 0,
    "pageSize": 10,
    "totalElements": 0,
    "totalPages": 0,
    "last": true
  }
}
```

[toPageParams/normalizePage](../src/lib/api/pagination.ts) chuyển đổi giữa backend
và `{ content, page, size, totalElements, totalPages }` cho UI. Đây là điểm cần
đồng bộ lại trong `api-conventions.md` ở R5. Không sửa request thành `page/size`
chỉ vì tài liệu cũ đang ghi như vậy; cần đối chiếu backend trước.

### Query keys và cập nhật dữ liệu

| Dữ liệu              | Query key hiện tại           |
| -------------------- | ---------------------------- |
| Profile              | `["profile", userId]`        |
| Danh sách meals      | `["meals", "list", filters]` |
| Chi tiết meal        | `["meals", mealId]`          |
| Items của meal       | `["meals", mealId, "items"]` |
| Bữa ăn của dashboard | `["dashboard", date]`        |
| Users admin          | `["users", params]`          |

Dùng `mealKeys` trong [use-meals.ts](../src/features/meals/hooks/use-meals.ts).
Mutation bữa ăn/món ăn hiện invalidate cả `["meals"]` và `["dashboard"]`; tạo user
invalidate `["users"]`. Query đọc dữ liệu truyền `AbortSignal` xuống API function.
Đừng copy dữ liệu server sang `useState` để quản lý thêm một bản cache.

Query mặc định giữ dữ liệu mới trong 30 giây; không retry lỗi hủy/lỗi HTTP dưới
500, các lỗi khác retry tối đa một lần; mutation không tự retry. Cần hiểu điều này
khi viết test hoặc chẩn đoán vì sao đổi bộ lọc chưa gọi API mới.

### Auth và dinh dưỡng

- Token lưu qua `tokenStorage` dưới key `accessToken`/`refreshToken`. `useSession`
  đọc claims JWT `userId`, `sub`, `role`, `exp`; việc giải mã này không xác minh
  chữ ký hoặc tự chứng minh quyền truy cập. Backend phải thực thi authorization.
- Interceptor gắn Bearer token, gom refresh khi nhiều request cùng nhận 401, chỉ
  replay một lần. Auth endpoints công khai không dùng luồng refresh này.
- `AdminRoute` đọc vai trò từ profile; không chỉ ẩn menu admin. Khi logout/đổi tài
  khoản, query cache được xóa. Giữ các kiểm thử ranh giới session khi sửa auth.
- Theo mô tả `MealItemRequest` trong OpenAPI, calories/macros là **tổng cho khẩu
  phần đã nhập**, không phải trên 100 g. `sumNutrition` chỉ cộng; không nhân tiếp
  theo `quantityGrams`. Ví dụ khẩu phần 250 g nhập 450 kcal thì tổng là 450 kcal.
- Schema frontend hiện cho khối lượng dương với tối đa 2 số thập phân;
  calories/protein/carbohydrate/fat là số nguyên không âm. Không nới validation
  độc lập khi backend vẫn dùng integer.
- Ngày bữa ăn giữ `YYYY-MM-DD` theo ngày local. Dùng `today`, `toDateInput`,
  `formatDate`, `formatNumber`; tránh chuyển ngày ăn qua UTC làm lệch ngày.
- Dashboard lấy hết các trang meals của ngày, rồi query items theo từng meal.
  Chưa có endpoint aggregate trong OpenAPI đã xem; nếu dữ liệu lớn, bàn với backend
  về API tổng hợp trước khi tối ưu bằng cách bỏ bớt dữ liệu.

## 6. Bắt đầu code theo thứ tự nào?

**Task đầu tiên phù hợp cho dev mới là R1:** sửa test fixture, điểm chờ navigation,
ca lỗi API và môi trường Playwright. Đây là công việc có phạm vi rõ, tiêu chí là
13 test của repo đạt; đồng thời giúp đọc qua các hành vi chính của app. Sau đó làm
R2 để CI duy trì kết quả, R3 để sửa phân trang, R5 để đồng bộ tài liệu và R4 nếu
bản phát hành có Google login.

Khi thêm/sửa tính năng nghiệp vụ:

1. Chốt hành vi và contract với backend; kiểm tra OpenAPI và một response mẫu đã
   loại dữ liệu nhạy cảm. Không tự tạo endpoint dựa trên tên feature.
2. Mở feature tương ứng. Thêm/sửa DTO trong `types`, validation trong `schemas`,
   API function trong `api`, query/mutation trong `hooks`.
3. Dùng React Hook Form + Zod cho form. Tái sử dụng `FormInput`, `FormSelect`,
   `SubmitButton`, `MutationError`, `ConfirmDeleteDialog` khi phù hợp.
4. Ghép component vào page; xử lý loading/empty/error, quyền truy cập và thao tác
   đang chờ. Component nghiệp vụ lớn khoảng hơn 200 dòng nên tách trách nhiệm.
5. Nếu thêm trang: đăng ký lazy route ở `app-router.tsx`, đặt trong guard phù hợp,
   thêm navigation nếu cần. Dùng `PageHeader`/`usePageTitle` cho tiêu đề trang.
6. Bổ sung khóa dịch cho cả `vi` và `en`. Dùng `useTranslation` với namespace rõ
   ràng; ngoài React gọi `i18n.t` lúc hiển thị. Schema dùng `validationKey`, không
   hardcode thông báo tiếng Việt/Anh.
7. Invalidate các query bị ảnh hưởng. Cập nhật unit test cho logic/contract thay
   đổi và E2E cho hành vi người dùng liên quan; chạy các kiểm tra ở mục 2.

Ưu tiên functional component, named export, arrow function, alias `@/`, kiểu dữ
liệu rõ ràng; không dùng `any`, inline CSS hoặc business logic chung trong page.
Feature mới có thể theo cấu trúc `api/`, `hooks/`, `types/`, `schemas/`,
`components/`, `pages/`; chỉ tạo những thư mục thực sự cần.

## 7. Build, bàn giao và xác nhận release

Docker dùng Node 22 để build, rồi Nginx phục vụ `dist`. Nginx có SPA fallback cho
deep link và proxy `/api/*` tới service `backend:8080`, giữ nguyên request path.
Image phải chạy trong mạng có tên service đó; repo này không kèm Compose để tạo
môi trường ấy.

```bash
docker build --build-arg VITE_API_BASE_URL=/api -t calories-detect-frontend .
```

Lệnh trên là hướng dẫn, chưa được chạy trong lần review. Google client ID chưa có
build argument tương ứng trong Dockerfile hiện tại, cần xử lý R4 trước.
Thêm biến `VITE_*` vào môi trường container Nginx sau build không tự đổi bundle.

Workflow CD publish image lên GHCR với tag theo SHA, gắn `latest` cho nhánh mặc
định, rồi dùng SSH cập nhật frontend trên VPS tại `/opt/calories-detect`. Secrets
đang được tham chiếu: `VPS_HOST`, `VPS_USER`, `VPS_SSH_PORT`, `VPS_SSH_KEY`;
publishing dùng `GITHUB_TOKEN`. Thay workflow có thể ảnh hưởng deployment thật,
cần kiểm tra trigger/nhánh và môi trường đích khi làm task CI/CD.

Trước khi xác nhận release:

- [ ] R1 đã sửa trong repo, toàn bộ lint/format/unit/build/E2E đạt trên CI Node 22.
- [ ] Các API mutation, refresh token, logout và quyền USER/ADMIN được smoke test
      với backend thật bằng tài khoản/dữ liệu test được chuẩn bị cho mục đích này.
- [ ] Phân trang vượt giới hạn và dữ liệu thay đổi giữa các tab được xử lý.
- [ ] Google OAuth được kiểm tra nếu thuộc phạm vi; nếu tắt thì ghi rõ cấu hình.
- [ ] Image build và chạy được; deep link, `/api` proxy và healthcheck hoạt động
      trong môi trường triển khai dự kiến.
- [ ] Kiểm tra các màn hình liên quan trên desktop/mobile, sáng/tối, vi/en và
      thao tác bằng bàn phím; không chỉ dựa vào ảnh của một vài trang.
- [ ] PR chứa đầy đủ file source/test/config mới, kèm thay đổi contract và tài
      liệu; kết quả review working tree không bảo đảm các file đã được commit.

## 8. Khi gặp lỗi local

| Triệu chứng                              | Kiểm tra trước                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Không kết nối API/502                    | Backend có chạy không, `API_PROXY_TARGET`, browser đang gọi `/api/...` hay lặp `/api/api/...`     |
| Login xong quay lại trang đăng nhập      | Response token, claims mà `readSession` cần, request profile và refresh; không log token/password |
| Danh sách lỗi hoặc phân trang sai        | Phân biệt URL 1-based với API 0-based; kiểm tra `pageNo/pageSize/data` và R3/R5                   |
| Sửa `.env` nhưng không đổi hành vi       | Restart Vite; với bundle production phải build lại                                                |
| Nút Google không xuất hiện               | `VITE_GOOGLE_CLIENT_ID` có lúc build không; xem R4                                                |
| E2E timeout trước khi thấy form          | Xem trace module `/src/.../api/...` có bị mock thành 404 không; xử lý R1                          |
| Test mong lỗi API nhưng vẫn thấy dữ liệu | Query có đang dùng cache 30 giây không; xác nhận request mới thực sự được gửi                     |
| Browser khác/ngôn ngữ khác làm test lệch | Xem locale trong Playwright, localStorage language và môi trường của web server                   |

Khi scope hoặc code thay đổi, cập nhật phần trạng thái và kết quả kiểm tra ở đầu
tài liệu; không coi snapshot ngày 16/09/2026 là trạng thái vĩnh viễn của dự án.
