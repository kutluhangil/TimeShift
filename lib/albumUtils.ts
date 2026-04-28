/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Helper function to load an image and return it as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image`));
        img.src = src;
    });
}

export type ImageEffect = 'none' | 'vintage' | 'bw' | 'sepia';

export async function createThumbnail(dataUrl: string, maxDim: number = 800): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round(height * (maxDim / width));
                    width = maxDim;
                } else {
                    width = Math.round(width * (maxDim / height));
                    height = maxDim;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No canvas context');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => reject('Failed to load image for thumbnail');
        img.src = dataUrl;
    });
}

export function getFilterString(effect: ImageEffect): string {
    switch(effect) {
        case 'vintage': return 'sepia(0.3) contrast(0.9) brightness(1.1) saturate(0.8)';
        case 'bw': return 'grayscale(1) contrast(1.2)';
        case 'sepia': return 'sepia(1) contrast(0.9)';
        default: return 'none';
    }
}

/**
 * Creates an album page combining the generated polaroids.
 */
export async function createAlbumPage(
    imageData: Record<string, string>, 
    onProgress?: (progress: number) => void,
    effect: ImageEffect = 'none'
): Promise<string> {
    const canvas = document.createElement('canvas');
    let canvasWidth = 1400;
    const decadesCount = Object.keys(imageData).length;
    let canvasHeight = 500 + (decadesCount * 1300) + 200;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('Could not get 2D canvas context');
    }

    if (onProgress) onProgress(10);

    ctx.fillStyle = '#fdf5e6';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
        ctx.fillRect(Math.random() * canvasWidth, Math.random() * canvasHeight, 2, 2);
    }

    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';

    ctx.font = `bold 100px 'Inter', sans-serif`;
    ctx.fillText('Generated with TimeShift', canvasWidth / 2, 250);
    ctx.font = `50px 'Inter', sans-serif`;
    ctx.fillStyle = '#666';
    ctx.fillText('on Google AI Studio', canvasWidth / 2, 330);

    if (onProgress) onProgress(20);

    const decades = Object.keys(imageData);
    const loadedImages = await Promise.all(
        Object.values(imageData).map(url => loadImage(url))
    );

    if (onProgress) onProgress(50);

    const imagesWithDecades = decades.map((decade, index) => ({
        decade,
        img: loadedImages[index],
    }));

    const contentTopMargin = 500;
    
    const polaroidWidth = 800;
    const polaroidHeight = polaroidWidth * 1.2; // 960

    const imageContainerWidth = polaroidWidth * 0.9; // 720
    const imageContainerHeight = imageContainerWidth; // 720

    // Do NOT reverse images to keep them in chronological order
    imagesWithDecades.forEach(({ decade, img }, index) => {
        let x = (canvasWidth - polaroidWidth) / 2;
        let y = contentTopMargin + (index * 1300);
        let rotation = (Math.random() - 0.5) * 0.05;
        
        ctx.save();
        
        ctx.translate(x + polaroidWidth / 2, y + polaroidHeight / 2);
        ctx.rotate(rotation);
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 35;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 10;
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(-polaroidWidth / 2, -polaroidHeight / 2, polaroidWidth, polaroidHeight);
        
        ctx.shadowColor = 'transparent';
        
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let drawWidth = imageContainerWidth;
        let drawHeight = drawWidth / aspectRatio;

        if (drawHeight > imageContainerHeight) {
            drawHeight = imageContainerHeight;
            drawWidth = drawHeight * aspectRatio;
        }

        const imageAreaTopMargin = (polaroidWidth - imageContainerWidth) / 2;
        const imageContainerY = -polaroidHeight / 2 + imageAreaTopMargin;
        
        const imgX = -drawWidth / 2;
        const imgY = imageContainerY + (imageContainerHeight - drawHeight) / 2;
        
        if (effect !== 'none') {
            ctx.filter = getFilterString(effect);
        }
        ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);
        ctx.filter = 'none';
        
        ctx.fillStyle = '#222';
        ctx.font = `60px 'Permanent Marker', cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const captionAreaTop = imageContainerY + imageContainerHeight;
        const captionAreaBottom = polaroidHeight / 2;
        const captionY = captionAreaTop + (captionAreaBottom - captionAreaTop) / 2;

        ctx.fillText(decade, 0, captionY);
        
        ctx.restore();
    });

    if (onProgress) onProgress(80);

    const result = canvas.toDataURL('image/jpeg', 0.9);
    if (onProgress) onProgress(100);
    return result;
}
