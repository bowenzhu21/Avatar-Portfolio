export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  audioSrc: string;
  coverSrc: string;
  duration: string;
  accent: string;
}

export const defaultSpotifyTrackId = "california";

export const spotifyTracks: SpotifyTrack[] = [
  {
    id: "california",
    title: "California",
    artist: "beabadoobee",
    audioSrc: "/spotify/California.m4a",
    coverSrc: "/spotify/california_cover.jpg",
    duration: "2:52",
    accent: "#d68b5f",
  },
  {
    id: "put-your-records-on",
    title: "Put Your Records On",
    artist: "Corinne Bailey Rae",
    audioSrc: "/spotify/Corinne Bailey Rae - Put Your Records On.m4a",
    coverSrc: "/spotify/putyourrecordson_cover.jpeg",
    duration: "3:54",
    accent: "#c1874c",
  },
  {
    id: "end-of-beginning",
    title: "End Of Beginning",
    artist: "Djo",
    audioSrc: "/spotify/End Of Beginning.m4a",
    coverSrc: "/spotify/endofbeginner_cover.png",
    duration: "2:39",
    accent: "#9d8f82",
  },
  {
    id: "heartbreak-weather",
    title: "Heartbreak Weather",
    artist: "Niall Horan",
    audioSrc: "/spotify/Niall Horan - Heartbreak Weather.m4a",
    coverSrc: "/spotify/heartbreakweather_cover.png",
    duration: "3:25",
    accent: "#6fa8ca",
  },
  {
    id: "writings-on-the-wall",
    title: "Writing's On The Wall",
    artist: "ROLE MODEL",
    audioSrc: "/spotify/ROLE MODEL - Writing's On The Wall (Lyric Video).m4a",
    coverSrc: "/spotify/writingsonthewall_cover.jpg",
    duration: "2:47",
    accent: "#b8613f",
  },
  {
    id: "siren-sounds",
    title: "Siren Sounds",
    artist: "Tate McRae",
    audioSrc: "/spotify/Tate McRae - Siren sounds (Lyric Video).m4a",
    coverSrc: "/spotify/sirensounds_cover.jpeg",
    duration: "3:03",
    accent: "#9d545d",
  },
  {
    id: "mulberry-street",
    title: "Mulberry Street",
    artist: "Twenty One Pilots",
    audioSrc: "/spotify/Twenty One Pilots - Mulberry Street (Lyric Video).m4a",
    coverSrc: "/spotify/mulberrystreet_cover.webp",
    duration: "3:44",
    accent: "#d2b654",
  },
  {
    id: "unbelievable",
    title: "Unbelievable",
    artist: "Why Don't We",
    audioSrc: "/spotify/Why Don't We - Unbelievable [Official Music Video].m4a",
    coverSrc: "/spotify/unbelievable_cover.jpg",
    duration: "3:17",
    accent: "#7a9ad5",
  },
];

export function getSpotifyTrackById(trackId: string | null | undefined) {
  return spotifyTracks.find((track) => track.id === trackId) ?? spotifyTracks[0]!;
}

function normalizeSpotifySearchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreSpotifyTrackMatch(query: string, track: SpotifyTrack) {
  const normalizedQuery = normalizeSpotifySearchValue(query);

  if (!normalizedQuery) {
    return 0;
  }

  const normalizedTitle = normalizeSpotifySearchValue(track.title);
  const normalizedArtist = normalizeSpotifySearchValue(track.artist);
  const normalizedId = normalizeSpotifySearchValue(track.id);
  const normalizedFull = normalizeSpotifySearchValue(`${track.title} ${track.artist}`);

  if (
    normalizedQuery === normalizedTitle ||
    normalizedQuery === normalizedArtist ||
    normalizedQuery === normalizedId ||
    normalizedQuery === normalizedFull
  ) {
    return 120;
  }

  let score = 0;

  if (normalizedTitle && normalizedQuery.includes(normalizedTitle)) {
    score = Math.max(score, 96 + normalizedTitle.length);
  }

  if (normalizedTitle && normalizedTitle.includes(normalizedQuery)) {
    score = Math.max(score, 82 + normalizedQuery.length);
  }

  if (normalizedArtist && normalizedQuery.includes(normalizedArtist)) {
    score = Math.max(score, 74 + normalizedArtist.length);
  }

  if (normalizedFull && normalizedQuery.includes(normalizedFull)) {
    score = Math.max(score, 88 + normalizedFull.length);
  }

  if (normalizedFull && normalizedFull.includes(normalizedQuery)) {
    score = Math.max(score, 80 + normalizedQuery.length);
  }

  const queryTokens = new Set(normalizedQuery.split(" ").filter((token) => token.length > 2));
  const trackTokens = new Set(
    `${normalizedTitle} ${normalizedArtist}`.split(" ").filter((token) => token.length > 2),
  );
  let overlap = 0;

  for (const token of queryTokens) {
    if (trackTokens.has(token)) {
      overlap += 1;
    }
  }

  if (overlap > 0) {
    score = Math.max(score, overlap * 12);
  }

  return score;
}

export function findSpotifyTrackByQuery(query: string) {
  const scoredMatches = spotifyTracks
    .map((track) => ({
      track,
      score: scoreSpotifyTrackMatch(query, track),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return scoredMatches[0]?.track ?? null;
}

export function getNextSpotifyTrackId(trackId: string | null | undefined) {
  const currentIndex = spotifyTracks.findIndex((track) => track.id === trackId);

  if (currentIndex === -1) {
    return spotifyTracks[0]?.id ?? defaultSpotifyTrackId;
  }

  return spotifyTracks[(currentIndex + 1) % spotifyTracks.length]?.id ?? defaultSpotifyTrackId;
}
