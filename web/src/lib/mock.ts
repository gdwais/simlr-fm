export type MockAlbum = {
  spotifyAlbumId: string;
  title: string;
  artists: { id: string; name: string }[];
  releaseDate: string;
  releaseYear: number;
  coverUrl: string;
};

export const MOCK_ALBUMS: MockAlbum[] = [
  {
    spotifyAlbumId: "mock-in-rainbows",
    title: "In Rainbows",
    artists: [{ id: "mock-radiohead", name: "Radiohead" }],
    releaseDate: "2007-10-10",
    releaseYear: 2007,
    coverUrl: "/mock/cover.svg",
  },
  {
    spotifyAlbumId: "mock-to-pimp-a-butterfly",
    title: "To Pimp a Butterfly",
    artists: [{ id: "mock-kdot", name: "Kendrick Lamar" }],
    releaseDate: "2015-03-15",
    releaseYear: 2015,
    coverUrl: "/mock/cover.svg",
  },
  {
    spotifyAlbumId: "mock-blonde",
    title: "Blonde",
    artists: [{ id: "mock-frank", name: "Frank Ocean" }],
    releaseDate: "2016-08-20",
    releaseYear: 2016,
    coverUrl: "/mock/cover.svg",
  },
  {
    spotifyAlbumId: "mock-flowers",
    title: "Flowers for Vibes",
    artists: [{ id: "mock-simlr", name: "Simlr Ensemble" }],
    releaseDate: "2020-01-01",
    releaseYear: 2020,
    coverUrl: "/mock/cover.svg",
  },
];

export function mockSearch(q: string): MockAlbum[] {
  const s = q.toLowerCase();
  return MOCK_ALBUMS.filter((a) =>
    `${a.title} ${a.artists.map((x) => x.name).join(" ")}`.toLowerCase().includes(s),
  );
}

export function getMockAlbum(id: string): MockAlbum | undefined {
  return MOCK_ALBUMS.find((a) => a.spotifyAlbumId === id);
}
