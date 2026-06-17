import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Register — Timbremap",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <p className="text-sm text-zinc-400">
        Registering lets you place votes on the compass and keep a list of your placements.
      </p>
      <AuthForm mode="register" />
    </main>
  );
}
