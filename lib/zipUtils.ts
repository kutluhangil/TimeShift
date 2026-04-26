import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function downloadBulkImages(images: { decade: string, url: string }[]) {
    const zip = new JSZip();
    
    // Download each image and add it to the ZIP
    await Promise.all(images.map(async (img) => {
        try {
            const response = await fetch(img.url);
            const blob = await response.blob();
            // Extract just the decade part (e.g., "1920s" from "1920s Flapper")
            const safeName = img.decade.split(' ')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
            zip.file(`${safeName}.jpg`, blob);
        } catch (error) {
            console.error(`Failed to fetch image for ${img.decade}:`, error);
        }
    }));
    
    // Generate ZIP and download
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'timeshift-images.zip');
}
