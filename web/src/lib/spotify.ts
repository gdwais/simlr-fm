import SpotifyWebApi from "spotify-web-api-node";
import { env } from "@/lib/env";

export function hasSpotifyKeys() {
  return Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET);
}

export function spotifyAppClient() {
  if (!hasSpotifyKeys()) {
    throw new Error(
      "Missing Spotify env vars. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.",
    );
  }

  return new SpotifyWebApi({
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
  });
}
