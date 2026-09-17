import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePageTitle } from "@/hooks/use-page-title"

export const AuthCard = ({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) => {
  usePageTitle(title)
  return (
    <Card className="gap-6 rounded-lg py-8 shadow-sm">
      <CardHeader className="px-6 md:px-8">
        <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
        <CardDescription className="mt-2 leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-6 md:px-8">{children}</CardContent>
      <CardFooter className="justify-center px-6 py-4 text-sm text-muted-foreground">
        {footer}
      </CardFooter>
    </Card>
  )
}
