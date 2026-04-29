import ZipWorker from './zipWorker?worker';

export async function downloadBulkImages(images: { decade: string, url: string }[], metadata?: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const worker = new ZipWorker();
        worker.onmessage = (e) => {
            if (e.data.type === 'success') {
                const blob = e.data.blob;
                const objUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = objUrl;
                link.download = 'timeshift-images.zip';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => window.URL.revokeObjectURL(objUrl), 1000);
                worker.terminate();
                resolve();
            } else if (e.data.type === 'error') {
                worker.terminate();
                reject(new Error(e.data.error));
            }
        };
        worker.onerror = (err) => {
            worker.terminate();
            reject(err);
        };
        worker.postMessage({ images, metadata });
    });
}
