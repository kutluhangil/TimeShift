import JSZip from 'jszip';

self.onmessage = async (e) => {
    try {
        const images: { decade: string, url: string }[] = e.data;
        const zip = new JSZip();
        
        await Promise.all(images.map(async (img) => {
            if (!img.url) return;
            try {
                const response = await fetch(img.url);
                const blob = await response.blob();
                zip.file(`${img.decade.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`, blob);
            } catch (err) {
                console.error(`Failed to fetch ${img.decade}`, err);
            }
        }));
        
        const content = await zip.generateAsync({ type: 'blob' });
        self.postMessage({ type: 'success', blob: content });
    } catch (err: any) {
        self.postMessage({ type: 'error', error: err.message || 'Worker Error' });
    }
};
