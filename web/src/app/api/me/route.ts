import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      rushmore: {
        select: {
          slot: true,
          album: {
            select: { spotifyAlbumId: true, title: true, coverUrl: true },
          },
        },
        orderBy: { slot: "asc" },
      },
    },
  });

  return NextResponse.json({ me });
}

const UpdateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/i, "Use letters, numbers, and underscores only"),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = UpdateSchema.parse(await req.json());

  try {
    const me = await prisma.user.update({
      where: { id: userId },
      data: { username: body.username },
      select: { id: true, username: true },
    });
    return NextResponse.json({ me });
  } catch (e: any) {
    // Prisma unique constraint
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    throw e;
  }
}
