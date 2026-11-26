import type { PhotoAsset } from "@/types";

const photoFileNames = [
  "1.jpeg",
  "2.jpeg",
  "3.jpeg",
  "4.jpeg",
  "5.jpeg",
  "6.jpeg",
  "7.PNG",
  "8.jpeg",
  "9.jpeg",
  "10.jpeg",
  "11.jpeg",
  "12.jpeg",
  "13.jpeg",
  "14.jpeg",
  "15.jpeg",
  "16.jpeg",
  "17.jpeg",
  "18.jpeg",
  "19.jpeg",
  "20.jpeg",
  "21.jpeg",
  "22.jpeg",
  "23.jpeg",
  "24.jpeg",
  "25.jpeg",
  "26.jpeg",
  "27.jpeg",
  "28.JPG",
  "29.JPG",
  "30.JPG",
  "31.JPG",
  "32.jpeg",
  "33.jpeg",
  "34.jpeg",
  "35.jpeg",
  "36.jpg",
  "37.jpg",
  "38.jpeg",
  "39.jpeg",
  "40.jpeg",
  "41.JPG",
  "42.jpg",
  "43.jpg",
] as const;

function getNumericId(fileName: string) {
  const parsed = Number.parseInt(fileName.split(".")[0] ?? "", 10);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

const existingPhotos: PhotoAsset[] = [...photoFileNames]
  .sort((left, right) => getNumericId(left) - getNumericId(right))
  .map((fileName) => {
    const id = getNumericId(fileName);

    return {
      id,
      src: `/photos/${fileName}`,
      alt: `Photo ${id}`,
    };
  });

export const photoLibrary: PhotoAsset[] = [
  ...existingPhotos,
  { id: 44, src: "/photos/44.webp", alt: "Two friends pointing toward mountains in a meadow" },
  { id: 45, src: "/photos/45.webp", alt: "Friends hiking beside a mountain waterfall" },
  { id: 46, src: "/photos/46.webp", alt: "YC Startup School 2026 sign" },
  { id: 47, src: "/photos/47.webp", alt: "City skyline illuminated at night" },
  { id: 48, src: "/photos/48.webp", alt: "Friends walking along a forest road" },
  { id: 49, src: "/photos/49.webp", alt: "Friends on a rocky overlook above a lake at dusk" },
  { id: 50, src: "/photos/50.webp", alt: "Friends posing together in a pumpkin patch" },
  { id: 51, src: "/photos/51.webp", alt: "Friends seated among pumpkins and tall grasses" },
  { id: 52, src: "/photos/52.webp", alt: "Four friends wearing colorful character costumes" },
  { id: 53, src: "/photos/53.webp", alt: "Friends in colorful costumes sitting on a couch" },
  { id: 54, src: "/photos/54.webp", alt: "Four friends wearing white graphic shirts" },
  { id: 55, src: "/photos/55.webp", alt: "Hikers beside a waterfall and granite cliffs" },
  { id: 56, src: "/photos/56.webp", alt: "Sunset over a lake" },
  { id: 57, src: "/photos/57.webp", alt: "Pumpkin stand at sunset" },
  { id: 58, src: "/photos/58.webp", alt: "Mirror photo of a costume with red face paint" },
  { id: 59, src: "/photos/59.webp", alt: "Friends overlooking a lake in daylight" },
  { id: 60, src: "/photos/60.webp", alt: "Football game at Levi’s Stadium" },
  { id: 61, src: "/photos/61.webp", alt: "Palm trees and flowers at an amusement park" },
  { id: 62, src: "/photos/62.webp", alt: "Two friends in Batman and bear costumes" },
  { id: 63, src: "/photos/63.webp", alt: "Three friends in matching Jurassic Pubs shirts" },
  { id: 64, src: "/photos/64.webp", alt: "Surfer in a wetsuit with a blue surfboard" },
  { id: 65, src: "/photos/65.webp", alt: "Jellyfish glowing in a blue-lit aquarium" },
  { id: 66, src: "/photos/66.webp", alt: "Airplane cockpit overlooking the sunset" },
  { id: 67, src: "/photos/67.webp", alt: "Fish and chips with lemon and dipping sauces" },
  { id: 68, src: "/photos/68.webp", alt: "Fireworks above a concert at Stanford Stadium" },
  { id: 69, src: "/photos/69.webp", alt: "Friends’ shadows on sunlit sand" },
  { id: 70, src: "/photos/70.webp", alt: "Three friends beside arched windows overlooking the bay" },
  { id: 71, src: "/photos/71.webp", alt: "Bay at sunset with an island, rooftops, and seagulls" },
];
