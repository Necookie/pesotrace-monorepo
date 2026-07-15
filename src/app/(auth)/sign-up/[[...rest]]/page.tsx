import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/brand/logo";

const VALUE_PROPS = [
  "Upload screenshots, get structured data",
  "Multi-branch reporting in one place",
  "Fee tier tracking built-in",
];

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-surface-soft bg-[url('/auth-background.jpg')] bg-cover bg-center px-16">
        <Logo />
        <ul className="mt-8 space-y-4">
          {VALUE_PROPS.map((prop) => (
            <li key={prop} className="flex items-center gap-3 text-body">
              <span className="size-1.5 rounded-full bg-primary" />
              {prop}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-1 items-center justify-center bg-canvas px-6">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="mb-4 text-center lg:hidden">
            <Logo className="justify-center" />
          </div>
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
            appearance={{ elements: { logoBox: { display: "none" } } }}
          />
          <p className="mt-6 text-sm text-body">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
