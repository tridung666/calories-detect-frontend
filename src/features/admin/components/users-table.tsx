import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { User } from "@/features/profile/types/user"
import { formatDate, getInitials } from "@/lib/format"

export const UsersTable = ({ users }: { users: User[] }) => {
  const { t } = useTranslation(["common"])
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">{t("common:navigation.users")}</TableHead>
          <TableHead>{t("common:fields.role")}</TableHead>
          <TableHead>{t("common:fields.status")}</TableHead>
          <TableHead className="pr-6">{t("common:fields.createdAt")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="py-4 pl-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {getInitials(user.fullName)}
                </span>
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                {user.role === "ADMIN" ? t("common:roles.ADMIN") : t("common:roles.USER")}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={
                  user.status === "ACTIVE"
                    ? "border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground"
                }
              >
                {user.status === "ACTIVE" ? t("common:status.active") : t("common:status.inactive")}
              </Badge>
            </TableCell>
            <TableCell className="pr-6 text-muted-foreground">
              {formatDate(user.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
