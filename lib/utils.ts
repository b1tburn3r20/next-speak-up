import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
  // Function to fix Google image URLs
  export const fixGoogleImageUrl = (url: string | null) => {
    if (!url) return "";

    // For Google profile images, ensure proper size parameter
    if (url.includes("googleusercontent.com")) {
      // Remove existing size parameter and add a consistent one
      const baseUrl = url.split("=")[0];
      return `${baseUrl}=s200-c`; // s200-c gives 200px square cropped image
    }

    return url;
  };