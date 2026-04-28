import GifWorker from './gifWorker?worker';

export async function createGifFromImages(
    imageUrls: string[], 
    onProgress?: (progress: number) => void,
    interval: number = 1.0,
    size: number = 600
): Promise<string> {
    return new Promise((resolve, reject) => {
        const worker = new GifWorker();
        
        worker.onmessage = (e) => {
            if (e.data.type === 'progress' && onProgress) {
                onProgress(e.data.progress);
            } else if (e.data.type === 'success') {
                worker.terminate();
                resolve(e.data.image);
            } else if (e.data.type === 'error') {
                worker.terminate();
                reject(new Error(e.data.error));
            }
        };
        
        worker.onerror = (err) => {
            worker.terminate();
            reject(err);
        };
        
        worker.postMessage({ imageUrls, interval, size });
    });
}
