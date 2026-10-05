# Phân tích bữa ăn bằng ảnh

Trang chi tiết meal hỗ trợ luồng chọn ảnh → upload → phân tích → xem lại/chỉnh
sửa → lưu món. Người dùng vẫn có thể nhập từng món thủ công. Giao diện hỗ trợ
tiếng Việt/Anh, light/dark và màn hình điện thoại.

## API frontend sử dụng

Tất cả request qua `apiClient`, với Bearer token trong bộ nhớ và cookie session
hiện có. FE chỉ gọi Spring; không gọi service AI hoặc giữ OpenAI key.

| Method | Path sau `/api` | Input | Data trả về |
| --- | --- | --- | --- |
| POST | `/meal` | `mealType`, `mealDate` | Meal mới |
| PUT | `/meals/{id}/image` | Multipart `file` | Meal có `imageUrl` |
| DELETE | `/meals/{id}/image` | Không body | Meal có `imageUrl: null` |
| POST | `/meals/{id}/analyze` | Không body | `{mealId, items}` dự đoán |
| POST | `/meals/{id}/confirm-analysis` | `{items}` đã chỉnh sửa | Meal kèm món đã lưu |
| DELETE | `/users/me/avatar` | Không body | User có `avatarUrl: null` |

CRUD meal/item tiếp tục dùng `/meal` số ít; ảnh và analysis dùng `/meals`
số nhiều. Endpoint tạo meal hiện là `/meal`, đã bỏ đường dẫn `/meal/create`.
GET meal không gộp món: trang chi tiết tải riêng `/meal/{id}/items`.

## State và thao tác

- Chỉ phân tích ảnh đã upload. Nếu đang preview file mới, phải upload hoặc hủy
  file đã chọn trước khi phân tích.
- Request phân tích có timeout riêng 90 giây; các request còn lại giữ cấu hình
  chung. Không tự retry analysis/confirmation. Retry sau 401 vẫn theo luồng
  refresh session hiện có; request 401 chưa thực hiện phân tích thành công.
- Trong lúc phân tích, khóa thay/xóa ảnh và hỗ trợ hủy chờ. Rời trang hoặc đổi
  URL ảnh sẽ abort request và bỏ state cũ. Abort FE không đảm bảo model đã dừng.
- Response AI được validate theo giới hạn backend và phải có đúng meal ID.
  Dự đoán chưa cập nhật món, tổng meal hoặc dashboard.
- Dialog review cho sửa tên, khối lượng và macro, thêm/xóa món. Đóng dialog giữ
  bản chỉnh sửa để mở lại. Reload, rời meal, upload/xóa ảnh hoặc phân tích lại sẽ
  bỏ bản review; không lưu dự đoán vào browser storage.
- Nút tính dinh dưỡng theo khối lượng dùng dự đoán gốc × khối lượng mới / khối
  lượng gốc, làm tròn hai chữ số. Thao tác này thay các số đang chỉnh sửa bằng
  số tính từ dự đoán gốc. Người dùng có thể tiếp tục sửa số trực tiếp.
- Confirmation yêu cầu ít nhất một món và thay thế toàn bộ món hiện có. Giao
  diện hiển thị cảnh báo cùng nút “Thay thế món cũ và lưu” khi meal đã có món.
- Lỗi lưu giữ bản chỉnh sửa. Trong khi lưu, khóa input và nút để tránh gửi trùng.
- Lưu thành công cập nhật cache meal/items và invalidate meal/dashboard. Tổng
  dinh dưỡng chỉ cập nhật từ các món đã lưu.

## Field và validation

Review dùng `name`, `quantityGrams`, `calories`, `protein`, `carbohydrate`, `fat`.
AI trả `estimatedGrams`, được dùng làm khối lượng ban đầu. Confidence chỉ hiển
thị trong review; chỉ số nguồn của row cũng là metadata nội bộ và không được
gửi khi confirm. Món đã lưu dùng `inputName`, `proteinGrams`,
`carbohydrateGrams`, `fatGrams`; không còn `normalizedName`.

Tên bắt buộc, tối đa 255 ký tự. Khối lượng dương, tối đa 99999999.99 g. Các số
dinh dưỡng không âm, tối đa 2147483647 và tối đa hai chữ số thập phân. Dinh dưỡng
là tổng cho khẩu phần, không phải trên 100 g. Form nhập món thủ công cũng dùng
validation thập phân này. Ảnh hỗ trợ JPEG/PNG/WebP, tối đa 5 MiB.

Mã lỗi AI 16000–16005 được dịch theo ngôn ngữ hiện tại, gồm chưa có ảnh,
service không sẵn sàng, timeout, kết quả sai, không có món và không đọc được ảnh.
Người dùng có thể thử lại, đổi ảnh hoặc thêm món thủ công.

## Kiểm thử

```sh
npm run build
npm run lint
npm test
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

Unit test kiểm tra contract API, timeout/signal, schema và mapping/scaling.
E2E dùng API mock để kiểm tra upload, review, thay thế món, cache/dashboard,
lỗi, hủy request, điều hướng, xóa ảnh/avatar và responsive. Các test này không
gọi model trả phí. Kiểm tra với backend/AI thật cần cấu hình backend, Cloudinary
và AI đã chạy, sau đó thực hiện luồng bằng tài khoản test.
