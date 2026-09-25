import { RouterProvider } from "react-router/dom"

import { AppProviders } from "@/app/providers/app-providers"
import { appRouter } from "@/app/router/app-router"
import { SessionBoundary } from "@/features/auth/components/session-boundary"
import { AppToaster } from "@/components/app-toaster"

export const App = () => (
  <AppProviders>
    <SessionBoundary>
      <RouterProvider router={appRouter} />
    </SessionBoundary>
    <AppToaster />
  </AppProviders>
)
