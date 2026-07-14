import { LoginForm } from "./login-form";

const VALUE_PROPS = [
  "Upload screenshots, get structured data",
  "Multi-branch reporting in one place",
  "Fee tier tracking built-in",
];

export default function LoginPage() {
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
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <span className="text-2xl font-semibold text-ink">PesoTrace</span>
          </div>
          <h1 className="text-2xl font-medium text-ink">Welcome back</h1>
          <p className="mt-1 text-body">Sign in to Transaction Monitor</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
