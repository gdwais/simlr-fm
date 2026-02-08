import Link from "next/link";
import { getCurrentUser } from "@/lib/server-auth";
import { Button } from "@/components/ui/button";

export async function SiteNav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Simlr.fm
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/search"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Search
          </Link>

          <Link
            href="/top"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Top
          </Link>

          <Link
            href="/me"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Profile
          </Link>

          {user ? (
            <form action="/api/auth/logout" method="post">
              <Button variant="secondary" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          ) : (
            <Link href="/login">
              <Button size="sm">
                Sign in
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
