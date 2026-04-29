import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Lalli Fafa account and continue your child's story adventures.",
};

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
