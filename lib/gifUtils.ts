import gifshot from 'gifshot';

export async function createGifFromImages(
    imageUrls: string[], 
    onProgress?: (progress: number) => void,
    interval: number = 1.0,
    size: number = 600
): Promise<string> {
    return new Promise((resolve, reject) => {
        gifshot.createGIF({
            images: imageUrls,
            gifWidth: size,
            gifHeight: size,
            interval: interval, 
            numFrames: imageUrls.length,
            progressCallback: (captureProgress: number) => {
                if (onProgress) onProgress(captureProgress * 100);
            }
        }, function (obj: any) {
            if (!obj.error) {
                resolve(obj.image);
            } else {
                reject(obj.error);
            }
        });
    });
}
