# Image uploads

Contract checked against the local backend's `UserAvatarController`,
`MealImageController`, response DTOs and `CloudinaryImageStorageService`.

| Action             | Endpoint                        | Response data         |
| ------------------ | ------------------------------- | --------------------- |
| Replace own avatar | `PUT /api/users/me/avatar`      | User with `avatarUrl` |
| Replace meal image | `PUT /api/meals/{mealId}/image` | Meal with `imageUrl`  |

Both requests require authentication and multipart form data with one `file` part.
Accepted types: JPEG, PNG and WebP; non-empty, up to 5 MiB (5,242,880 bytes).
The browser supplies the multipart boundary; clear Axios's default JSON content
type for these requests. Upload requests have a 60-second timeout.

The profile page supports selecting, previewing and uploading an avatar. The
navigation uses the same profile query so the new avatar appears immediately.
Create a meal first, then select and upload its photo on the meal detail page.
Users explicitly submit the selected image; cancel discards only the local preview.
Upload failures retain the selection for retry and do not replace saved data.
Client validation checks size and MIME type; backend validation remains authoritative
for image contents. Object URLs are released on replacement, cancel and unmount.

Business errors 15000–15003 and HTTP 413 have English/Vietnamese messages.
Tests use mocked endpoints; deployment still requires configured backend image storage.
