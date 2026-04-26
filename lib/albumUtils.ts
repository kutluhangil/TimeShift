/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Helper function to load an image and return it as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image`));
        img.src = src;
    });
}

export type AlbumLayout = 'grid' | 'collage' | 'single-column';
export type ImageEffect = 'none' | 'vintage' | 'bw' | 'sepia';

export async function createThumbnail(dataUrl: string, maxDim: number = 800): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
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
    layout: AlbumLayout = 'grid',
    effect: ImageEffect = 'none'
): Promise<string> {
    const canvas = document.createElement('canvas');
    let canvasWidth = 2480;
    let canvasHeight = 3508;

    const decadesCount = Object.keys(imageData).length;
    if (layout === 'single-column') {
        canvasWidth = 1400;
        canvasHeight = 600 + (decadesCount * 1200);
    } else if (layout === 'collage') {
        canvasWidth = 2480;
        canvasHeight = 2480;
    }

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

    if (layout === 'single-column') {
        ctx.font = `bold 100px 'Inter', sans-serif`;
        ctx.fillText('Generated with TimeShift', canvasWidth / 2, 250);
        ctx.font = `50px 'Inter', sans-serif`;
        ctx.fillStyle = '#666';
        ctx.fillText('on Google AI Studio', canvasWidth / 2, 330);
    } else {
        ctx.font = `bold 120px 'Inter', sans-serif`;
        ctx.fillText('Generated with TimeShift', canvasWidth / 2, 150);
        ctx.font = `60px 'Inter', sans-serif`;
        ctx.fillStyle = '#666';
        ctx.fillText('on Google AI Studio', canvasWidth / 2, 240);
    }

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

    const contentTopMargin = layout === 'single-column' ? 400 : 350;
    
    const grid = { cols: 2, rows: Math.ceil(imagesWithDecades.length / 2), padding: 100 };
    const contentHeight = canvasHeight - contentTopMargin;
    const cellWidth = (canvasWidth - grid.padding * (grid.cols + 1)) / grid.cols;
    const cellHeight = (contentHeight - grid.padding * (grid.rows + 1)) / grid.rows;

    const maxPolaroidWidth = cellWidth * 0.9;
    
    const maxPolaroidHeight = cellHeight * 0.9;

    let polaroidWidth = layout === 'single-column' ? 800 : maxPolaroidWidth;
    if (layout === 'collage') polaroidWidth = 800;
    
    let polaroidHeight = polaroidWidth * 1.2;

    const imageContainerWidth = polaroidWidth * 0.9;
    const imageContainerHeight = imageContainerWidth;

    const reversedImages = [...imagesWithDecades].reverse();
    reversedImages.forEach(({ decade, img }, reversedIndex) => {
        const index = imagesWithDecades.length - 1 - reversedIndex;

        let x = 0, y = 0, rotation = 0;

        if (layout === 'grid') {
            const row = Math.floor(index / grid.cols);
            const col = index % grid.cols;
            x = grid.padding * (col + 1) + cellWidth * col + (cellWidth - polaroidWidth) / 2;
            y = contentTopMargin + grid.padding * (row + 1) + cellHeight * row + (cellHeight - polaroidHeight) / 2;
            rotation = (Math.random() - 0.5) * 0.1;
        } else if (layout === 'single-column') {
            x = (canvasWidth - polaroidWidth) / 2;
            y = contentTopMargin + (index * 1200);
            rotation = (Math.random() - 0.5) * 0.05;
        } else if (layout === 'collage') {
            const marginX = 200;
            const marginY = contentTopMargin + 200;
            x = marginX + Math.random() * (canvasWidth - polaroidWidth - marginX * 2);
            y = marginY + Math.random() * (canvasHeight - polaroidHeight - contentTopMargin - 400);
            rotation = (Math.random() - 0.5) * 0.4;
        }
        
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
