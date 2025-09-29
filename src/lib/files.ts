/**
 * Reads a File and returns its contents as a data URL string.
 *
 * @param file - The File to read.
 * @returns A promise that resolves to a data URL (base64) string representation of the file.
 */
export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
