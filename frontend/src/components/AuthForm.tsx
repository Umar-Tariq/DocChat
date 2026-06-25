interface AuthFormProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  showName?: boolean;
}

export function AuthForm({
  title,
  subtitle,
  submitLabel,
  error,
  isSubmitting,
  onSubmit,
  showName = false,
}: AuthFormProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {showName && (
          <div>
            <label htmlFor="name" className="mb-1 block text-sm text-zinc-300">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-zinc-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-zinc-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-indigo-500 py-2.5 font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
        >
          {isSubmitting ? "Please wait..." : submitLabel}
        </button>
      </form>
    </div>
  );
}
