"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000/api";

type UserProfile = {
  id: number;
  username: string;
  email: string;
};

type LoginResponse = {
  user?: UserProfile;
  access: string;
  refresh: string;
};

type ApiError = {
  detail?: string;
  non_field_errors?: string[];
  username?: string[];
  email?: string[];
  password?: string[];
};

function getErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (!error || typeof error !== "object") {
    return "Something went wrong.";
  }

  const apiError = error as ApiError;

  if (apiError.detail) {
    return apiError.detail;
  }

  const messages = [
    ...(apiError.non_field_errors ?? []),
    ...(apiError.username ?? []),
    ...(apiError.email ?? []),
    ...(apiError.password ?? []),
  ];

  return messages.length > 0 ? messages.join(" ") : "Request failed.";
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw data ?? `Request failed with status ${response.status}`;
  }

  return data as T;
}

export default function Home() {
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [hasLoadedStoredTokens, setHasLoadedStoredTokens] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState<
    "register" | "login" | "profile" | ""
  >("");

  const isLoggedIn = useMemo(() => Boolean(accessToken), [accessToken]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAccessToken(window.localStorage.getItem("accessToken") ?? "");
      setRefreshToken(window.localStorage.getItem("refreshToken") ?? "");
      setHasLoadedStoredTokens(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoadingAction("register");

    try {
      const data = await requestJson<{ message: string }>("/register/", {
        method: "POST",
        body: JSON.stringify(registerForm),
      });

      setMessage(data.message);
      setLoginForm({
        username: registerForm.username,
        password: registerForm.password,
      });
    } catch (registerError) {
      setError(getErrorMessage(registerError));
    } finally {
      setLoadingAction("");
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoadingAction("login");

    try {
      const data = await requestJson<LoginResponse>("/login/", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });

      window.localStorage.setItem("accessToken", data.access);
      window.localStorage.setItem("refreshToken", data.refresh);
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      setProfile(data.user ?? null);
      setMessage("Login successful.");
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setLoadingAction("");
    }
  }

  async function loadProfile() {
    setError("");
    setMessage("");
    setLoadingAction("profile");

    try {
      const data = await requestJson<UserProfile>("/profile/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setProfile(data);
      setMessage("Profile loaded.");
    } catch (profileError) {
      setError(getErrorMessage(profileError));
    } finally {
      setLoadingAction("");
    }
  }

  function logout() {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("refreshToken");
    setAccessToken("");
    setRefreshToken("");
    setProfile(null);
    setMessage("Logged out.");
    setError("");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col gap-3 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">
              AI Sabai
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Authentication
            </h1>
          </div>
          <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
            {!hasLoadedStoredTokens
              ? "Checking token..."
              : isLoggedIn
                ? "Token ready"
                : "Not logged in"}
          </div>
        </header>

        {(message || error) && (
          <div
            className={`mb-5 rounded-md border px-4 py-3 text-sm ${
              error
                ? "border-red-500/40 bg-red-950/60 text-red-100"
                : "border-emerald-500/40 bg-emerald-950/50 text-emerald-100"
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_1fr]">
          <form
            onSubmit={handleRegister}
            className="rounded-md border border-zinc-800 bg-zinc-900 p-5"
          >
            <h2 className="text-xl font-semibold text-white">Register</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                Username
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-cyan-400"
                  value={registerForm.username}
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      username: event.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Email
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-cyan-400"
                  type="email"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      email: event.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Password
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-cyan-400"
                  type="password"
                  minLength={8}
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      password: event.target.value,
                    })
                  }
                  required
                />
              </label>
            </div>
            <button
              className="mt-5 w-full rounded-md bg-cyan-400 px-4 py-2.5 font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loadingAction === "register"}
              type="submit"
            >
              {loadingAction === "register" ? "Creating..." : "Create Account"}
            </button>
          </form>

          <form
            onSubmit={handleLogin}
            className="rounded-md border border-zinc-800 bg-zinc-900 p-5"
          >
            <h2 className="text-xl font-semibold text-white">Login</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                Username
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-cyan-400"
                  value={loginForm.username}
                  onChange={(event) =>
                    setLoginForm({
                      ...loginForm,
                      username: event.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Password
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-cyan-400"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm({
                      ...loginForm,
                      password: event.target.value,
                    })
                  }
                  required
                />
              </label>
            </div>
            <button
              className="mt-5 w-full rounded-md bg-white px-4 py-2.5 font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loadingAction === "login"}
              type="submit"
            >
              {loadingAction === "login" ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <section className="mt-5 rounded-md border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white">Profile</h2>
            <div className="flex gap-2">
              <button
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!accessToken || loadingAction === "profile"}
                onClick={loadProfile}
                type="button"
              >
                {loadingAction === "profile" ? "Loading..." : "Load Profile"}
              </button>
              <button
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!accessToken}
                onClick={logout}
                type="button"
              >
                Logout
              </button>
            </div>
          </div>

          {profile ? (
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
                <dt className="text-zinc-500">ID</dt>
                <dd className="mt-1 font-medium text-white">{profile.id}</dd>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
                <dt className="text-zinc-500">Username</dt>
                <dd className="mt-1 font-medium text-white">
                  {profile.username}
                </dd>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
                <dt className="text-zinc-500">Email</dt>
                <dd className="mt-1 break-words font-medium text-white">
                  {profile.email}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="mt-5 rounded-md border border-dashed border-zinc-700 p-4 text-sm text-zinc-400">
              No profile loaded.
            </div>
          )}

          {refreshToken && (
            <p className="mt-4 truncate text-xs text-zinc-500">
              Refresh token saved locally: {refreshToken}
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
