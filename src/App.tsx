import { RouterProvider } from "react-router/dom"

import { AppProviders } from "@/app/providers/app-providers"
import { appRouter } from "@/app/router/app-router"
import { AppToaster } from "@/components/app-toaster"
import { ModeToggle } from "@/components/mode-toggle"

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={appRouter} />

      <div className="fixed right-4 top-4 z-50">
        <ModeToggle />
      </div>

      <AppToaster />
    </AppProviders>
  )
}
