import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function SiteNav() {
  const session = await getServerSession(authOptions);

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

          {session?.user ? (
            <form action="/api/auth/signout" method="post">
              <Button variant="secondary" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          ) : (
            <form action="/api/auth/signin" method="post">
              <Button size="sm" type="submit">
                Sign in
              </Button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
