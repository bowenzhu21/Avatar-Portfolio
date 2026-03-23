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

export const photoLibrary: PhotoAsset[] = [...photoFileNames]
  .sort((left, right) => getNumericId(left) - getNumericId(right))
  .map((fileName) => {
    const id = getNumericId(fileName);

    return {
      id,
      src: `/photos/${fileName}`,
      alt: `Photo ${id}`,
    };
  });

