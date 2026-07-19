import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLogin } from "@/features/auth/hooks/use-login"
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login-schema"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { notification } from "@/lib/notification"

export function LoginPage() {
  const loginMutation = useLogin()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values, {
      onError: (error) => {
        notification.error(
          getApiErrorMessage(
            error,
            "Đăng nhập thất bại. Vui lòng thử lại.",
          ),
        )
      },
      onSuccess: () => {
        notification.success("Đăng nhập thành công")
      },
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Đăng nhập</CardTitle>
        <CardDescription>
          Nhập email và mật khẩu để truy cập tài khoản
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="space-y-4"
          id="login-form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              id="email"
              placeholder="user@example.com"
              type="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive" id="email-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={Boolean(errors.password)}
              autoComplete="current-password"
              id="password"
              placeholder="Nhập mật khẩu"
              type="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive" id="password-error">
                {errors.password.message}
              </p>
            )}
          </div>

        </form>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={loginMutation.isPending}
          form="login-form"
          type="submit"
        >
          {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>

      </CardFooter>
    </Card>
  )
}
