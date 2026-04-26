export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  audioSrc: string;
  coverSrc: string;
  duration: string;
  accent: string;
}

export const defaultSpotifyTrackId = "alex-grohl";

export const spotifyTracks: SpotifyTrack[] = [
  {
    id: "alex-grohl",
    title: "Electronic Stylish Rock",
    artist: "Alex Grohl",
    audioSrc: "/spotify/alexgrohl-electronic-stylish-rock-15045.mp3",
    coverSrc: "/spotify/alex_grohl.webp",
    duration: "1:51",
    accent: "#ef8a22",
  },
  {
    id: "dance-playful-night",
    title: "Dance Playful Night",
    artist: "Alex Zavesa",
    audioSrc: "/spotify/alexzavesa-dance-playful-night-510786.mp3",
    coverSrc: "/spotify/alex_zavesa.jpeg",
    duration: "1:46",
    accent: "#f08d4b",
  },
  {
    id: "body-language",
    title: "Body Language",
    artist: "Sky Gienger",
    audioSrc: "/spotify/body-language-sky-gienger-main-version-40292-02-35.mp3",
    coverSrc: "/spotify/sky_ginger.webp",
    duration: "2:35",
    accent: "#3fd8df",
  },
  {
    id: "nagoya",
    title: "Nagoya",
    artist: "Otto",
    audioSrc: "/spotify/nagoya-otto-mp3-main-version-43810-01-36.mp3",
    coverSrc: "/spotify/otto_mp3.webp",
    duration: "1:36",
    accent: "#9ca2a8",
  },
  {
    id: "stylish-lifestyle",
    title: "Stylish Lifestyle",
    artist: "Dope Cat",
    audioSrc: "/spotify/stylish-lifestyle-dope-cat-main-version-44027-02-41.mp3",
    coverSrc: "/spotify/dope_cat.jpg",
    duration: "2:41",
    accent: "#43d9e4",
  },
  {
    id: "touch",
    title: "Touch",
    artist: "Panda Beats",
    audioSrc: "/spotify/panda-beats-touch-hard-hitting-drill-type-beat-425632.mp3",
    coverSrc: "/spotify/panda_beats.jpg",
    duration: "2:08",
    accent: "#e86dc1",
  },
  {
    id: "vlog-beat-background",
    title: "Vlog Beat Background",
    artist: "TuneTank",
    audioSrc: "/spotify/tunetank-vlog-beat-background-349853.mp3",
    coverSrc: "/spotify/tunetank.jpeg",
    duration: "1:36",
    accent: "#efc83a",
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
