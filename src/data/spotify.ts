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
