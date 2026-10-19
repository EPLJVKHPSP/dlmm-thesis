import Image from "next/image";
import { redirect } from "next/navigation";
import { authenticate, readSession, startSession } from "@/lib/session";
import { ThemeToggle } from "@/components/theme-toggle";

async function login(formData: FormData) {
  "use server";
  const user = await authenticate(String(formData.get("email") || ""), String(formData.get("password") || ""));
  if (!user) redirect("/login?error=1");
  await startSession(user);
  redirect("/");
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await readSession()) redirect("/");
  const { error } = await searchParams;
  return <main className="login-page">
    <div className="login-theme"><ThemeToggle/></div>
    <form action={login} className="login-card">
      <div className="login-brand"><Image src="/logo.png" alt="DLMM" width={40} height={40}/><div><h1>DLMM</h1><p>Sign in to continue</p></div></div>
      <label>Login<input name="email" type="email" defaultValue="reviewer@dlmm.local" autoComplete="username" required/></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required/></label>
      {error && <p className="form-error" role="alert">Invalid login or password.</p>}
      <button className="button" type="submit">Sign in</button>
    </form>
  </main>;
}
