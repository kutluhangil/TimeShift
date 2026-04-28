import gifshot from 'gifshot';

self.onmessage = async (e) => {
    try {
        const { imageUrls, interval, size } = e.data;
        
        gifshot.createGIF({
            images: imageUrls,
            gifWidth: size,
            gifHeight: size,
            interval: interval, 
            numFrames: imageUrls.length,
            progressCallback: (captureProgress: number) => {
                self.postMessage({ type: 'progress', progress: captureProgress * 100 });
            }
        }, function (obj: any) {
            if (!obj.error) {
                self.postMessage({ type: 'success', image: obj.image });
            } else {
                self.postMessage({ type: 'error', error: obj.error });
            }
        });
        
    } catch (err: any) {
        self.postMessage({ type: 'error', error: err.message || 'Worker Error' });
    }
};
