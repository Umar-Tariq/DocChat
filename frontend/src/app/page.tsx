import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <section className="text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-indigo-400">
          AI-powered document Q&A
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Chat with your documents
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Upload PDFs or text files, and get accurate answers grounded in your content —
          with citations showing exactly where each answer came from.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-indigo-500 px-6 py-3 font-medium text-white hover:bg-indigo-400"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-zinc-700 px-6 py-3 font-medium text-zinc-200 hover:border-zinc-500"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="mt-24 grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Upload & index",
            body: "Drop a PDF or TXT file. We extract text, chunk it, and generate embeddings automatically.",
          },
          {
            title: "Ask anything",
            body: "Questions are answered only from your document context — no hallucinated facts.",
          },
          {
            title: "Cited answers",
            body: "Every response includes chunk and page references so you can verify the source.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
