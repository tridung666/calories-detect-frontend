import { RouterProvider } from "react-router"

import { AppProviders } from "@/app/providers/app-providers"
import { appRouter } from "@/app/router/app-router"
import { AppToaster } from "@/components/app-toaster"

export const App = () => (
  <AppProviders>
    <RouterProvider router={appRouter} />
    <AppToaster />
  </AppProviders>
)
