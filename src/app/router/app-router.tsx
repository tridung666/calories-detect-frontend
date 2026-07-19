import { createBrowserRouter, Navigate } from "react-router"

import { AuthLayout } from "@/layouts/auth-layout"

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: "/auth",
    Component: AuthLayout,
    children: [
      {
        index: true,
        element: <Navigate to="login" replace />,
      },
      {
        path: "login",
        lazy: async () => {
          const { LoginPage } = await import(
            "@/features/auth/pages/login-page"
          )

          return { Component: LoginPage }
        },
      },
    ],
  },
])
