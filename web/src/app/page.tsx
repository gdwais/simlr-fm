import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Simlr.fm</h1>
      <p className="mt-3 text-muted-foreground">
        Rate albums (1–10), discover records through liner-note-style shoutouts,
        and discuss with the community.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/search"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Search albums
        </Link>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        MVP in progress.
      </p>
    </main>
  );
}
