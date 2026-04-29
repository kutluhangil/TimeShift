import JSZip from 'jszip';

self.onmessage = async (e) => {
    try {
        const { images, metadata } = e.data;
        const zip = new JSZip();
        
        await Promise.all(images.map(async (img: { decade: string, url: string }) => {
            if (!img.url) return;
            try {
                const response = await fetch(img.url);
                const blob = await response.blob();
                zip.file(`${img.decade.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`, blob);
            } catch (err) {
                console.error(`Failed to fetch ${img.decade}`, err);
            }
        }));

        if (metadata) {
            zip.file('metadata.json', JSON.stringify(metadata, null, 2));
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        self.postMessage({ type: 'success', blob: content });
    } catch (err: any) {
        self.postMessage({ type: 'error', error: err.message || 'Worker Error' });
    }
};
