/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function downloadDataUrlAsFile(dataUrl: string, filename: string) {
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const objUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objUrl;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(objUrl), 1000);
    } catch (e) {
        // Fallback for some browsers
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
