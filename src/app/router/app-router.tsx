import { createBrowserRouter, Navigate } from "react-router"

import { NotFoundPage, RouteErrorPage } from "@/app/router/error-page"
import { AppLayout } from "@/components/layout/app-layout"
import { AuthLayout } from "@/components/layout/auth-layout"
import { PageLoading } from "@/components/ui/feedback"
import { AdminRoute, ProtectedRoute } from "@/features/auth/components/protected-route"

export const appRouter = createBrowserRouter([
  {
    path: "/auth",
    Component: AuthLayout,
    ErrorBoundary: RouteErrorPage,
    HydrateFallback: PageLoading,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      {
        path: "login",
        lazy: async () => ({
          Component: (await import("@/features/auth/pages/login-page")).LoginPage,
        }),
      },
      {
        path: "register",
        lazy: async () => ({
          Component: (await import("@/features/auth/pages/register-page")).RegisterPage,
        }),
      },
    ],
  },
  {
    Component: ProtectedRoute,
    ErrorBoundary: RouteErrorPage,
    HydrateFallback: PageLoading,
    children: [
      {
        Component: AppLayout,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          {
            path: "/dashboard",
            lazy: async () => ({
              Component: (await import("@/features/dashboard/pages/dashboard-page")).DashboardPage,
            }),
          },
          {
            path: "/meals",
            lazy: async () => ({
              Component: (await import("@/features/meals/pages/meals-page")).MealsPage,
            }),
          },
          {
            path: "/meals/:mealId",
            lazy: async () => ({
              Component: (await import("@/features/meals/pages/meal-detail-page")).MealDetailPage,
            }),
          },
          {
            path: "/profile",
            lazy: async () => ({
              Component: (await import("@/features/profile/pages/profile-page")).ProfilePage,
            }),
          },
          {
            Component: AdminRoute,
            children: [
              {
                path: "/admin/users",
                lazy: async () => ({
                  Component: (await import("@/features/admin/pages/users-page")).UsersPage,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", Component: NotFoundPage },
])
