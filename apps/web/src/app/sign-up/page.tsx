import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = {
  title: "Create your free account",
  description: "Sign up for Lalli Fafa and get 250 free story credits. Your child becomes the hero today.",
};

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
