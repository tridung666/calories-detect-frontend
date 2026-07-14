import { useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";

import { register } from "@/features/auth/api/auth.api";
import type { RegisterResponse } from "@/features/auth/types/auth.types";
import type { BaseResponse } from "@/shared/types/api.types";

import "./App.css";

interface RegisterFormState {
  email: string;
  password: string;
  fullName: string;
}

type SubmitStatus = "idle" | "loading" | "success" | "error";

interface RegisterResponsePreviewProps {
  response: RegisterResponse;
}

const initialFormState: RegisterFormState = {
  email: "user@example.com",
  password: "password123",
  fullName: "John Doe",
};

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<BaseResponse<unknown>>(error)) {
    return error.response?.data.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Register request failed.";
};

export const RegisterResponsePreview = ({
  response,
}: RegisterResponsePreviewProps) => {
  const user = response.data;

  return (
    <section className="register-demo__response" aria-live="polite">
      <div className="register-demo__response-header">
        <div>
          <p className="register-demo__response-label">Response</p>
          <h2>{response.message}</h2>
        </div>

        <div className="register-demo__badges">
          <span className="register-demo__badge register-demo__badge--success">
            {response.success ? "Success" : "Failed"}
          </span>
          <span className="register-demo__badge">Code {response.code}</span>
        </div>
      </div>

      <dl className="register-demo__response-grid">
        <div>
          <dt>User ID</dt>
          <dd>{user.id}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Full name</dt>
          <dd>{user.fullName}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{user.role}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{user.status}</dd>
        </div>
      </dl>

      <details className="register-demo__raw-response">
        <summary>Raw response</summary>
        <pre>{JSON.stringify(response, null, 2)}</pre>
      </details>
    </section>
  );
};

export const App = () => {
  const [formData, setFormData] = useState<RegisterFormState>(initialFormState);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [response, setResponse] = useState<RegisterResponse | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStatus("loading");
    setErrorMessage("");
    setResponse(null);

    try {
      const registerResponse = await register(formData);

      setResponse(registerResponse);
      setStatus("success");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setStatus("error");
    }
  };

  const isSubmitting = status === "loading";

  return (
    <main className="app-shell">
      <section className="register-demo">
        <div className="register-demo__header">
          <p className="register-demo__eyebrow">API Demo</p>
          <h1>Register API</h1>
          <p>POST /auth/register</p>
        </div>

        <form className="register-demo__form" onSubmit={handleSubmit}>
          <label className="register-demo__field" htmlFor="fullName">
            <span>Full name</span>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={(event) =>
                setFormData((currentFormData) => ({
                  ...currentFormData,
                  fullName: event.target.value,
                }))
              }
              disabled={isSubmitting}
              required
            />
          </label>

          <label className="register-demo__field" htmlFor="email">
            <span>Email</span>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(event) =>
                setFormData((currentFormData) => ({
                  ...currentFormData,
                  email: event.target.value,
                }))
              }
              disabled={isSubmitting}
              required
            />
          </label>

          <label className="register-demo__field" htmlFor="password">
            <span>Password</span>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(event) =>
                setFormData((currentFormData) => ({
                  ...currentFormData,
                  password: event.target.value,
                }))
              }
              disabled={isSubmitting}
              required
              minLength={6}
            />
          </label>

          <button
            className="register-demo__submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Send register request"}
          </button>
        </form>

        {status === "error" && (
          <div className="register-demo__alert register-demo__alert--error">
            {errorMessage}
          </div>
        )}

        {status === "success" && response && (
          <RegisterResponsePreview response={response} />
        )}
      </section>
    </main>
  );
};

export default App;
