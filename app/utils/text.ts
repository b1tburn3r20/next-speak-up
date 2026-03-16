import sanitizeHtml from 'sanitize-html';

export const sanitizeText = (dirtytext: string) => {
  return sanitizeHtml(dirtytext);
}

export const fixGoogleImageUrl = (url: string | null) => {
  if (!url) return "";

  if (url.includes("googleusercontent.com")) {
    const baseUrl = url.split("=")[0];
    return `${baseUrl}=s200-c`;
  }

  return url;
};
