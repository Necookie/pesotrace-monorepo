import { SignUp } from "@clerk/nextjs";

const VALUE_PROPS = [
  "Upload screenshots, get structured data",
  "Multi-branch reporting in one place",
  "Fee tier tracking built-in",
];

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-surface-soft px-16">
        <span className="text-2xl font-semibold text-ink">PesoTrace</span>
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
            <span className="text-2xl font-semibold text-ink">PesoTrace</span>
          </div>
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
