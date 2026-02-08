import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server-auth";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  entityType: z.enum(["SIMLR_EDGE", "POST", "COMMENT"]),
  entityId: z.string().min(1),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  // userId already fetched
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = BodySchema.parse(await req.json());

  const existing = await prisma.vote.findUnique({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType: body.entityType,
        entityId: body.entityId,
      },
    },
    select: { id: true, value: true },
  });

  // Toggle behavior:
  // - clicking the same vote again removes it
  // - clicking opposite changes value
  if (existing && existing.value === body.value) {
    await prisma.vote.delete({ where: { id: existing.id } });
  } else {
    await prisma.vote.upsert({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: body.entityType,
          entityId: body.entityId,
        },
      },
      create: {
        userId,
        entityType: body.entityType,
        entityId: body.entityId,
        value: body.value,
      },
      update: {
        value: body.value,
      },
    });
  }

  const agg = await prisma.vote.aggregate({
    where: { entityType: body.entityType, entityId: body.entityId },
    _sum: { value: true },
  });

  const me = await prisma.vote.findUnique({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType: body.entityType,
        entityId: body.entityId,
      },
    },
    select: { value: true },
  });

  return NextResponse.json({ score: agg._sum.value ?? 0, myVote: me?.value ?? 0 });
}
