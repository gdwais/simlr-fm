import { prisma } from "@/lib/prisma";
import { MOCK_ALBUMS } from "@/lib/mock";

export async function ensureMockSeeded() {
  const existing = await prisma.album.count();
  if (existing > 0) return;

  // Seed a couple fake users + ratings so charts have something.
  const users = [
    { id: "seed_alice", username: "alice", name: "Alice" },
    { id: "seed_bob", username: "bob", name: "Bob" },
    { id: "seed_cara", username: "cara", name: "Cara" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: u,
      update: { username: u.username, name: u.name },
    });
  }

  for (const a of MOCK_ALBUMS) {
    await prisma.album.upsert({
      where: { spotifyAlbumId: a.spotifyAlbumId },
      create: {
        spotifyAlbumId: a.spotifyAlbumId,
        title: a.title,
        artistsJson: a.artists,
        coverUrl: a.coverUrl,
        releaseYear: a.releaseYear,
      },
      update: {
        title: a.title,
        artistsJson: a.artists,
        coverUrl: a.coverUrl,
        releaseYear: a.releaseYear,
      },
    });
  }

  const albums = await prisma.album.findMany({ select: { id: true, spotifyAlbumId: true } });
  const bySpotifyId = new Map(albums.map((a) => [a.spotifyAlbumId, a.id]));

  const ratings: Array<{ userId: string; spotifyAlbumId: string; score: number }> = [
    { userId: "seed_alice", spotifyAlbumId: "mock-in-rainbows", score: 10 },
    { userId: "seed_bob", spotifyAlbumId: "mock-in-rainbows", score: 9 },
    { userId: "seed_cara", spotifyAlbumId: "mock-in-rainbows", score: 8 },

    { userId: "seed_alice", spotifyAlbumId: "mock-to-pimp-a-butterfly", score: 9 },
    { userId: "seed_bob", spotifyAlbumId: "mock-to-pimp-a-butterfly", score: 10 },
    { userId: "seed_cara", spotifyAlbumId: "mock-to-pimp-a-butterfly", score: 9 },

    { userId: "seed_alice", spotifyAlbumId: "mock-blonde", score: 8 },
    { userId: "seed_bob", spotifyAlbumId: "mock-blonde", score: 7 },
    { userId: "seed_cara", spotifyAlbumId: "mock-blonde", score: 9 },

    { userId: "seed_alice", spotifyAlbumId: "mock-flowers", score: 6 },
    { userId: "seed_bob", spotifyAlbumId: "mock-flowers", score: 7 },
    { userId: "seed_cara", spotifyAlbumId: "mock-flowers", score: 6 },
  ];

  for (const r of ratings) {
    const albumId = bySpotifyId.get(r.spotifyAlbumId);
    if (!albumId) continue;

    await prisma.rating.upsert({
      where: { userId_albumId: { userId: r.userId, albumId } },
      create: { userId: r.userId, albumId, score: r.score },
      update: { score: r.score },
    });
  }

  // Seed a simple discussion post + simlr to showcase UI.
  const src = bySpotifyId.get("mock-in-rainbows");
  const tgt = bySpotifyId.get("mock-blonde");
  if (src && tgt) {
    const post = await prisma.post.create({
      data: {
        albumId: src,
        userId: "seed_alice",
        title: "First impressions",
        body: "This is seeded test data so the UI has something to render without Spotify keys.",
      },
      select: { id: true },
    });

    await prisma.comment.create({
      data: {
        postId: post.id,
        userId: "seed_bob",
        body: "Seeded comment — agree. The mix is incredible.",
      },
    });

    const edge = await prisma.simlrEdge.upsert({
      where: { sourceAlbumId_targetAlbumId: { sourceAlbumId: src, targetAlbumId: tgt } },
      create: { sourceAlbumId: src, targetAlbumId: tgt },
      update: {},
      select: { id: true },
    });

    await prisma.simlrReason.upsert({
      where: { edgeId_userId: { edgeId: edge.id, userId: "seed_cara" } },
      create: {
        edgeId: edge.id,
        userId: "seed_cara",
        reason:
          "Both albums reward full, front-to-back listening. Different worlds, same obsessiveness about texture and pacing.",
      },
      update: {},
    });

    await prisma.vote.createMany({
      data: [
        { userId: "seed_alice", entityType: "SIMLR_EDGE", entityId: edge.id, value: 1 },
        { userId: "seed_bob", entityType: "SIMLR_EDGE", entityId: edge.id, value: 1 },
      ],
      skipDuplicates: true,
    });
  }
}
