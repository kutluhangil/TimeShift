/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { DraggableCardContainer, DraggableCardBody } from './ui/draggable-card';
import { cn } from '../lib/utils';
import type { PanInfo } from 'framer-motion';

import { ImageEffect, getFilterString } from '../lib/albumUtils';

type ImageStatus = 'pending' | 'done' | 'error';

interface PolaroidCardProps {
    imageUrl?: string;
    caption: string;
    status: ImageStatus;
    error?: string;
    dragConstraintsRef?: React.RefObject<HTMLElement>;
    onShake?: (caption: string) => void;
    onDownload?: (caption: string) => void;
    onShare?: (caption: string) => void;
    onZoom?: (imageUrl: string, caption: string) => void;
    isMobile?: boolean;
    effect?: ImageEffect;
    dragSnapToOrigin?: boolean;
    onDragStartApp?: () => void;
    onDragEndApp?: () => void;
    isDimmed?: boolean;
    aspectRatio?: '1:1' | '4:3' | '16:9';
    progressPlaceholderUrl?: string | null;
    metadata?: { date?: string, location?: string, notes?: string };
}

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full bg-neutral-900/60 z-10 absolute inset-0 text-white overflow-hidden backdrop-blur-md">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full animate-pulse transition-all duration-1000"></div>
        
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center opacity-80">
            <div className="absolute inset-0 border-[2px] border-amber-500/20 rounded-full border-dashed animate-[spin_6s_linear_infinite]"></div>
            <div className="absolute inset-2 border-[1px] border-amber-400/30 rounded-full border-t-transparent animate-[spin_3s_linear_infinite_reverse]"></div>
            <div className="absolute inset-4 border-[1px] border-amber-300/50 rounded-full border-b-transparent animate-[spin_2s_linear_infinite]"></div>
        </div>
        <span className="font-medium text-sm tracking-[0.25em] uppercase text-amber-500/80 animate-[pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">Time Shifting</span>
        
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
    </div>
);

interface ErrorDisplayProps {
    error: string;
    onRetry: () => void;
}

const ErrorDisplay = ({ error, onRetry }: ErrorDisplayProps) => (
    <div className="flex flex-col items-center justify-center h-full bg-neutral-900/90 backdrop-blur-sm z-10 absolute inset-0 text-center px-3 py-4 overflow-y-auto overflow-x-hidden">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mb-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-white font-semibold tracking-tight text-lg mb-1 shrink-0">Development Failed</h3>
        <div className="text-[10px] sm:text-xs text-neutral-300 mb-4 w-full bg-black/40 p-2 rounded text-left overflow-y-auto max-h-24 leading-snug break-words border border-red-500/20">
            {error || "Unknown chemical error. The time coordinates were unstable."}
        </div>
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onRetry();
            }}
            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-100 px-4 py-2 rounded-full border border-red-500/50 transition-colors shrink-0"
            aria-label="Retry generation"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry Generation
        </button>
    </div>
);

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-neutral-500 group-hover:text-neutral-300 transition-colors duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-medium text-lg tracking-wide uppercase">Upload Photo</span>
    </div>
);


const PolaroidCard: React.FC<PolaroidCardProps> = ({ imageUrl, caption, status, error, dragConstraintsRef, onShake, onDownload, onShare, onZoom, isMobile, effect = 'none', dragSnapToOrigin = true, onDragStartApp, onDragEndApp, isDimmed, aspectRatio = '1:1', progressPlaceholderUrl, metadata }) => {
    const [isDeveloped, setIsDeveloped] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const lastShakeTime = useRef(0);
    const lastVelocity = useRef({ x: 0, y: 0 });

    // Reset states when the image URL changes or status goes to pending.
    useEffect(() => {
        if (status === 'pending') {
            setIsDeveloped(false);
            setIsImageLoaded(false);
        }
        if (status === 'done' && imageUrl) {
            setIsDeveloped(false);
            setIsImageLoaded(false);
        }
    }, [imageUrl, status]);

    // When the image is loaded, start the developing animation.
    useEffect(() => {
        if (isImageLoaded) {
            const timer = setTimeout(() => {
                setIsDeveloped(true);
            }, 200); // Short delay before animation starts
            return () => clearTimeout(timer);
        }
    }, [isImageLoaded]);

    const handleDragStart = () => {
        // Reset velocity on new drag to prevent false triggers from old data
        lastVelocity.current = { x: 0, y: 0 };
        onDragStartApp?.();
    };

    const handleDragEnd = () => {
        onDragEndApp?.();
    };

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!onShake || isMobile) return;

        const velocityThreshold = 1500; // Require a high velocity to be considered a "shake".
        const shakeCooldown = 2000; // 2 seconds cooldown to prevent spamming.

        const { x, y } = info.velocity;
        const { x: prevX, y: prevY } = lastVelocity.current;
        const now = Date.now();

        // A true "shake" is a rapid movement AND a sharp change in direction.
        // We detect this by checking if the velocity is high and if its direction
        // has reversed from the last frame (i.e., the dot product is negative).
        const magnitude = Math.sqrt(x * x + y * y);
        const dotProduct = (x * prevX) + (y * prevY);

        if (magnitude > velocityThreshold && dotProduct < 0 && (now - lastShakeTime.current > shakeCooldown)) {
            lastShakeTime.current = now;
            onShake(caption);
        }

        lastVelocity.current = { x, y };
    };

    const containerAspectClass = aspectRatio === '1:1' ? 'aspect-square' :
                                 aspectRatio === '16:9' ? 'aspect-video' :
                                 'aspect-[4/3]'; // default 4:3

    const cardInnerContent = (
        <>
            <div className={cn("w-full bg-neutral-900 shadow-inner relative overflow-hidden group", containerAspectClass)}>
                {status === 'pending' && (
                    <>
                        {progressPlaceholderUrl ? (
                            <img src={progressPlaceholderUrl} alt="Loading..." className="w-full h-full object-cover blur-md opacity-50 saturate-0" />
                        ) : null}
                        <LoadingSpinner />
                    </>
                )}
                {status === 'error' && <ErrorDisplay error={error || ""} onRetry={() => onShake && onShake(caption)} />}
                {status === 'done' && imageUrl && (
                    <>
                        <div className={cn(
                            "absolute top-2 right-2 z-20 flex flex-col gap-2 transition-opacity duration-300",
                            !isMobile && "opacity-0 group-hover:opacity-100",
                        )}>
                            {onDownload && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent drag from starting on click
                                        onDownload(caption);
                                    }}
                                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                                    aria-label={`Download image for ${caption}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                            )}
                            {onShare && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onShare(caption);
                                    }}
                                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                                    aria-label={`Share image for ${caption}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </button>
                            )}
                             {isMobile && onShake && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onShake(caption);
                                    }}
                                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                                    aria-label={`Regenerate image for ${caption}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.42.71a5.002 5.002 0 00-8.479-1.554H10a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.42-.71a5.002 5.002 0 008.479 1.554H10a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 01-1 1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>


                        {/* The developing chemical overlay - fades out */}
                        <div
                            className={`absolute inset-0 z-10 bg-[#3a322c] transition-opacity duration-[3500ms] ease-out ${
                                isDeveloped ? 'opacity-0' : 'opacity-100'
                            }`}
                            aria-hidden="true"
                        />
                        
                        {/* The Image - fades in and color corrects */}
                        <img
                            key={imageUrl}
                            src={imageUrl}
                            alt={caption}
                            onLoad={() => setIsImageLoaded(true)}
                            onClick={() => onZoom && isDeveloped && imageUrl && onZoom(imageUrl, caption)}
                            className={cn(
                                "w-full h-full object-cover transition-all duration-[4000ms] ease-in-out",
                                onZoom && isDeveloped ? "cursor-zoom-in" : "",
                                !isDeveloped && 'opacity-80 sepia-[1] contrast-75 brightness-75',
                                isDeveloped && 'opacity-100',
                                isDeveloped && (
                                    effect === 'vintage' ? 'sepia-[0.3] contrast-90 brightness-110 saturate-[0.8]' :
                                    effect === 'bw' ? 'grayscale contrast-125' :
                                    effect === 'sepia' ? 'sepia contrast-90' :
                                    ''
                                )
                            )}
                            style={{ opacity: isImageLoaded ? undefined : 0 }}
                        />
                    </>
                )}
                {status === 'done' && !imageUrl && <Placeholder />}
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-center px-2 flex flex-col gap-0.5">
                <p className={cn(
                    "font-bold text-sm tracking-widest uppercase truncate",
                    status === 'done' && imageUrl ? 'text-black' : 'text-black/80'
                )}>
                    {caption}
                </p>
                {metadata && (metadata.date || metadata.location) && (
                    <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                        {[metadata.date, metadata.location].filter(Boolean).join(' • ')}
                    </p>
                )}
            </div>
        </>
    );

    if (isMobile) {
        return (
            <div className="bg-neutral-100 dark:bg-neutral-100 p-4 pb-14 flex flex-col items-center justify-start w-80 max-w-full rounded-md shadow-lg relative">
                {cardInnerContent}
            </div>
        );
    }

    return (
        <DraggableCardContainer className={cn("transition-all duration-500", isDimmed ? "opacity-20 grayscale-[50%] blur-[4px]" : "opacity-100")}>
            <DraggableCardBody 
                className="bg-neutral-100 dark:bg-neutral-100 p-4 pb-14 flex flex-col items-center justify-start w-80 max-w-full relative"
                dragConstraintsRef={dragConstraintsRef}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrag={handleDrag}
                dragSnapToOrigin={dragSnapToOrigin}
            >
                {cardInnerContent}
            </DraggableCardBody>
        </DraggableCardContainer>
    );
};

export default PolaroidCard;