# Simlr.fm — Product Requirements Document (PRD)

**Owner:** Dalton Wais  
**Status:** Draft v0.1  
**Last updated:** 2026-02-01

## 1) Summary
Simlr.fm is a community site for **album-level discovery, ratings, and discussion**.

Users connect Spotify, search/browse albums, rate them on a **1–10 slider**, and see aggregated community sentiment. Every album also has a **Simlr** section: album-to-album “shoutouts” inspired by the old CD booklet “thank you” lists—human-curated links that help you find adjacent music.

## 2) Goals / Non-goals

### Goals
- **Fast album rating loop:** connect Spotify → find album → rate (1–10) → see consensus
- **Human discovery graph:** album-to-album shoutouts (“Simlrs”), vote-ranked
- **Community:** reddit-style threaded discussion + voting per album
- **Identity:** user profile with username + top 4 “Mount Rushmore” albums

### Non-goals (MVP)
- Track-level ratings
- Full social network features (DMs, friend graph)
- Full editorial staff / curation
- Piracy/streaming playback features (beyond linking out to Spotify)

## 3) Target Users
- Music enthusiasts who enjoy album-focused listening
- People who like community consensus but want more nuance than star ratings
- Fans of liner-notes / scene discovery: “if you like this record, you’ll like these”

## 4) Core Concepts

### 4.1 Album
- Canonical source of truth: **Spotify Album ID**
- Metadata: title, artists, cover art, release date/year, genres (if available), label (optional)

### 4.2 Rating (1–10)
- One rating per user per album
- Optional short review text (MVP can omit; v1 add)
- Aggregation: average, median, distribution histogram

### 4.3 Discussion Thread (per album)
- Reddit-style posts/comments
- Voting (up/down)
- Sorting: Top, New

### 4.4 Simlr (album-to-album shoutout)
A **directed edge** from a source album to a target album.

- **Album-level only** (no artist-level edges)
- Uncapped quantity (no hard limit)
- De-duped targets: many users can endorse the same target album; it remains one canonical edge
- Edge ordering determined by vote score and (optionally) time-decay modes

**Edge fields (MVP):**
- source_album_id
- target_album_id
- created_by_user_id
- created_at

**User contributions on an edge:**
- vote (+1 / -1)
- **required reason blurb** (140–280 chars)

## 5) User Stories (MVP)

### Auth + profile
- As a user, I can log in with Spotify so my identity is tied to a real account.
- As a user, I can set a username (unique) and choose my top 4 albums.

### Search + browse
- As a user, I can search for an artist and browse their albums.
- As a user, I can open an album page from search results.

### Rate
- As a user, I can rate an album with a 1–10 slider.
- As a user, I can see the community aggregate score and distribution.

### Simlr edges
- As a user, I can add a Simlr (link this album → another album) and optionally explain why.
- As a user, I can upvote/downvote Simlr edges.
- As a user, I can sort Simlrs by Top / New / Rising.

### Discussion
- As a user, I can start a thread on an album and comment/reply.
- As a user, I can upvote/downvote posts and comments.

## 6) Ranking & Aggregation

### Ratings
- Store raw ratings; compute:
  - mean score
  - median score
  - count of ratings
  - histogram bins (1–10)

### Simlr edges
- Edge score = sum(votes)
- Default sort: **Top** (descending score)
- Secondary sorts:
  - New (created_at desc)
  - Rising (recent vote velocity, e.g. score in last 7 days)
  - Controversial (high total votes with near-even split)

## 7) Trust, Abuse, and Moderation (MVP)
Because Simlrs are uncapped, quality controls must be lightweight but real.

- **Rate-limits:** e.g. limit Simlr submissions per user per day
- **Eligibility:** user must have rated the source album before adding Simlrs (prevents drive-by spam)
- **Duplicate merge:** if edge already exists, new submission becomes an endorsement/reason on existing edge
- **Report:** allow reporting Simlr reasons and comments
- **Admin tools (internal):** remove abusive content, ban users

## 8) UX Notes

### Album page layout
- Header: cover art, title, artists, year
- Rating panel: slider + your current score + save/update
- Community panel: avg/median + distribution chart
- Simlr section:
  - CTA: “Add a Simlr”
  - list of target albums with vote controls, short reasons, and link-out to Spotify
- Discussion section:
  - sort + create post
  - thread tree

### Profile page
- Username
- Mount Rushmore (4 albums)
- Recent ratings
- Optional: user’s most upvoted Simlrs

## 9) Technical Requirements (suggested)

### Frontend
- Next.js (App Router)
- Tailwind

### Backend
- Postgres (users, albums, ratings, simlr_edges, posts/comments, votes)
- Redis (optional) for caching hot aggregates / rate limits

### Integrations
- Spotify OAuth (login + search)
- Spotify Web API for album metadata

### Hosting
- Vercel or similar

## 10) Data Model (proposed, simplified)

### users
- id (uuid)
- spotify_user_id (string)
- username (string, unique)
- created_at

### albums
- id (uuid)
- spotify_album_id (string, unique)
- title
- artists_json
- cover_url
- release_year

### ratings
- id
- user_id
- album_id
- score (int 1–10)
- created_at
- updated_at

### simlr_edges
- id
- source_album_id
- target_album_id
- created_at

### simlr_reasons (optional but recommended)
- id
- edge_id
- user_id
- reason (text)
- created_at

### votes
- id
- user_id
- entity_type (enum: simlr_edge | post | comment)
- entity_id
- value (+1|-1)
- created_at

### posts
- id
- album_id
- user_id
- title
- body
- created_at

### comments
- id
- post_id
- user_id
- parent_comment_id (nullable)
- body
- created_at

## 11) MVP Milestones

1) **Auth + album search**
- Spotify OAuth
- Search albums by artist

2) **Album page + rating aggregation**
- Slider rating
- Aggregate calculations

3) **Simlr section**
- Add Simlr
- Vote + sort
- De-dupe edges

4) **Discussion**
- Posts/comments
- Voting

5) **Profiles**
- Username
- Mount Rushmore 4

## 12) Open Questions
- Do we enforce the reason length strictly client-side + server-side? (Recommendation: yes, 140–280 chars)
- Do we show both average and median prominently? (Recommendation: yes)
- Do we allow changing username? (Recommendation: yes, with cooldown)
- Public vs private ratings? (Recommendation: ratings public by default)
