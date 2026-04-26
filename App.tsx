/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDecadeImage, analyzeCharacterFeatures } from './services/geminiService';
import PolaroidCard from './components/PolaroidCard';
import { createAlbumPage, AlbumLayout, ImageEffect } from './lib/albumUtils';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import { playClickSound, playUploadSound, playShutterSound, playSuccessSound, playRegenerateSound } from './lib/sounds';
import { Volume2, VolumeX, Settings, X } from 'lucide-react';
import { createThumbnail } from './lib/albumUtils';
import { setMuted } from './lib/sounds';

const DECADES = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s'];

// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
    { top: '5%', left: '10%', rotate: -8 },
    { top: '15%', left: '60%', rotate: 5 },
    { top: '45%', left: '5%', rotate: 3 },
    { top: '2%', left: '35%', rotate: 10 },
    { top: '40%', left: '70%', rotate: -12 },
    { top: '50%', left: '38%', rotate: -3 },
];

const GHOST_POLAROIDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
  { initial: { x: "0%", y: "-200%", rotate: 0 }, transition: { delay: 0.5 } },
  { initial: { x: "100%", y: "150%", rotate: 10 }, transition: { delay: 0.3 } },
];


type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

const primaryButtonClasses = "relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all duration-300";
const secondaryButtonClasses = "px-8 py-4 bg-transparent text-white font-medium rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95";

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

function App() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [isSharing, setIsSharing] = useState<boolean>(false);
    const [appState, setAppState] = useState<'landing' | 'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('landing');
    const [layout, setLayout] = useState<AlbumLayout>('grid');
    const [effect, setEffect] = useState<ImageEffect>('none');
    const [showSettings, setShowSettings] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [characterDescription, setCharacterDescription] = useState<string>('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');


    const toggleSound = () => {
        const newSound = !soundEnabled;
        setSoundEnabled(newSound);
        setMuted(!newSound);
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            playUploadSound();
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setAppState('image-uploaded');
                setGeneratedImages({}); // Clear previous results
                setCharacterDescription('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage) return;

        playClickSound();
        setIsLoading(true);
        setAppState('generating');
        
        let desc = characterDescription;
        if (!desc) {
            console.log("Analyzing character features...");
            desc = await analyzeCharacterFeatures(uploadedImage);
            setCharacterDescription(desc);
            console.log("Character features:", desc);
        }

        const initialImages: Record<string, GeneratedImage> = {};
        DECADES.forEach(decade => {
            initialImages[decade] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const concurrencyLimit = 2; // Process two decades at a time
        const decadesQueue = [...DECADES];

        const processDecade = async (decade: string) => {
            try {
                const prompt = `Reimagine the exact same person from this photo but in the style of the ${decade}. 
CRITICAL RULES:
1. You MUST maintain the person's exact facial identity, bone structure, and facial features.
Character reference: ${desc}
2. The person must look like the EXACT SAME INDIVIDUAL, just styled differently.
3. Change their clothing, hairstyle, and the photo's grading/quality to perfectly match the ${decade} aesthetic.
4. The output must be a sharp, photorealistic photograph.`;
                const resultUrl = await generateDecadeImage(uploadedImage, prompt, desc);
                setGeneratedImages(prev => ({
                    ...prev,
                    [decade]: { status: 'done', url: resultUrl },
                }));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setGeneratedImages(prev => ({
                    ...prev,
                    [decade]: { status: 'error', error: errorMessage },
                }));
                console.error(`Failed to generate image for ${decade}:`, err);
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (decadesQueue.length > 0) {
                const decade = decadesQueue.shift();
                if (decade) {
                    await processDecade(decade);
                }
            }
        });

        await Promise.all(workers);

        playSuccessSound();
        setIsLoading(false);
        setAppState('results-shown');
    };

    const handleRegenerateDecade = async (decade: string) => {
        if (!uploadedImage) return;

        // Prevent re-triggering if a generation is already in progress
        if (generatedImages[decade]?.status === 'pending') {
            return;
        }
        
        console.log(`Regenerating image for ${decade}...`);
        playRegenerateSound();

        // Set the specific decade to 'pending' to show the loading spinner
        setGeneratedImages(prev => ({
            ...prev,
            [decade]: { status: 'pending' },
        }));

        // Call the generation service for the specific decade
        try {
            const prompt = `Reimagine the exact same person from this photo but in the style of the ${decade}. 
CRITICAL RULES:
1. You MUST maintain the person's exact facial identity, bone structure, and facial features.
Character reference: ${characterDescription}
2. The person must look like the EXACT SAME INDIVIDUAL, just styled differently.
3. Change their clothing, hairstyle, and the photo's grading/quality to perfectly match the ${decade} aesthetic.
4. The output must be a sharp, photorealistic photograph.`;
            const resultUrl = await generateDecadeImage(uploadedImage, prompt, characterDescription);
            setGeneratedImages(prev => ({
                ...prev,
                [decade]: { status: 'done', url: resultUrl },
            }));
            playSuccessSound();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({
                ...prev,
                [decade]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate image for ${decade}:`, err);
        }
    };
    
    const handleReset = () => {
        playClickSound();
        setUploadedImage(null);
        setGeneratedImages({});
        setCharacterDescription('');
        setAppState('idle');
    };

    const handleDownloadIndividualImage = (decade: string) => {
        playClickSound();
        const image = generatedImages[decade];
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `timeshift-${decade}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            playSuccessSound();
        }
    };

    const handleShareIndividualImage = async (decade: string) => {
        playClickSound();
        const image = generatedImages[decade];
        if (image?.status === 'done' && image.url) {
            try {
                setIsSharing(true);
                const thumbnail = await createThumbnail(image.url);
                const res = await fetch("/api/share", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageParams: image.url, thumbnail, type: 'polaroid' })
                });
                const data = await res.json();
                if (data.url) {
                    navigator.clipboard.writeText(window.location.origin + data.url);
                    showToast("Share link copied to clipboard!");
                    playSuccessSound();
                }
            } catch (err) {
                console.error(err);
                showToast("Failed to create share link");
            } finally {
                setIsSharing(false);
            }
        }
    };

    const handleShareAlbum = async () => {
        playClickSound();
        setIsSharing(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]) => {
                    acc[decade] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length < DECADES.length) {
                showToast("Please wait for all images to finish generating before sharing the album.");
                setIsSharing(false);
                return;
            }

            setDownloadProgress(0);
            const albumDataUrl = await createAlbumPage(imageData, setDownloadProgress, layout, effect);
            const thumbnail = await createThumbnail(albumDataUrl);

            const res = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageParams: albumDataUrl, thumbnail, type: 'album' })
            });
            const data = await res.json();
            if (data.url) {
                navigator.clipboard.writeText(window.location.origin + data.url);
                showToast("Album share link copied to clipboard!");
                playSuccessSound();
            }
        } catch (error) {
            console.error("Failed to share album:", error);
            showToast("Sorry, there was an error sharing your album. Please try again.");
        } finally {
            setIsSharing(false);
            setDownloadProgress(0);
        }
    };

    const handleDownloadAlbum = async () => {
        playClickSound();
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]) => {
                    acc[decade] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length < DECADES.length) {
                alert("Please wait for all images to finish generating before downloading the album.");
                return;
            }

            setDownloadProgress(0);
            const albumDataUrl = await createAlbumPage(imageData, setDownloadProgress, layout, effect);

            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 'timeshift-album.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            playSuccessSound();

        } catch (error) {
            console.error("Failed to create or download album:", error);
            alert("Sorry, there was an error creating your album. Please try again.");
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    if (appState === 'landing') {
        return (
            <LandingPage onStart={() => setAppState('idle')} />
        );
    }

    return (
        <main className="bg-black text-white font-sans min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-black to-black opacity-80 z-0 pointer-events-none"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>
            
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -50, x: "-50%" }}
                        className="fixed top-8 left-1/2 z-50 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-medium shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="absolute top-4 right-4 z-50 flex gap-4">
                <button 
                    onClick={toggleSound}
                    className="p-3 bg-neutral-900 border border-neutral-700/50 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shadow-lg"
                    title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                >
                    {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </button>
                <button 
                    onClick={() => setShowSettings(true)}
                    className="p-3 bg-neutral-900 border border-neutral-700/50 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shadow-lg"
                    title="Settings"
                >
                    <Settings size={24} />
                </button>
            </div>

            {showSettings && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-md p-6 max-w-sm w-full relative">
                        <button 
                            onClick={() => setShowSettings(false)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="font-bold text-2xl mb-6 text-white text-center">Settings</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Image Effect</label>
                                <select 
                                    className="w-full bg-black/50 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all"
                                    value={effect}
                                    onChange={(e) => setEffect(e.target.value as ImageEffect)}
                                >
                                    <option value="none">Original (No Effect)</option>
                                    <option value="vintage">Vintage Film</option>
                                    <option value="bw">Black & White</option>
                                    <option value="sepia">Sepia Tone</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Album Layout</label>
                                <select 
                                    className="w-full bg-black/50 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all"
                                    value={layout}
                                    onChange={(e) => setLayout(e.target.value as AlbumLayout)}
                                >
                                    <option value="grid">Classic Grid</option>
                                    <option value="collage">Scattered Collage</option>
                                    <option value="single-column">Vertical Stack</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowSettings(false)}
                            className="mt-8 w-full font-semibold text-black bg-white py-3 px-8 rounded-full hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
            
            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0 pt-8 mt-12 md:mt-0">
                <div className="text-center mb-10">
                   <motion.h1 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-5xl md:text-7xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-500"
                    >
                      TimeShift
                    </motion.h1>
                    <motion.p 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       transition={{ delay: 0.2 }}
                       className="text-neutral-400 mt-2 text-lg tracking-wide font-medium"
                    >
                      Generate yourself through the decades.
                    </motion.p>
                </div>

                {appState === 'idle' && (
                     <div className="relative flex flex-col items-center justify-center w-full">
                        {/* Ghost polaroids for intro animation */}
                        {GHOST_POLAROIDS_CONFIG.map((config, index) => (
                             <motion.div
                                key={index}
                                className="absolute w-80 h-[26rem] rounded-md p-4 bg-neutral-100/10 blur-sm"
                                initial={config.initial}
                                animate={{
                                    x: "0%", y: "0%", rotate: (Math.random() - 0.5) * 20,
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{
                                    ...config.transition,
                                    ease: "circOut",
                                    duration: 2,
                                }}
                            />
                        ))}
                        <motion.div
                             initial={{ opacity: 0, scale: 0.8 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: 2, duration: 0.8, type: 'spring' }}
                             className="flex flex-col items-center"
                        >
                            <label htmlFor="file-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                                 <PolaroidCard 
                                     caption="Click to begin"
                                     status="done"
                                 />
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                            <p className="mt-8 text-neutral-400 text-center max-w-sm text-sm md:text-base leading-relaxed">
                                Click the polaroid to upload your photo and start your journey through time.
                            </p>
                        </motion.div>
                    </div>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <div className="flex flex-col items-center gap-6">
                         <PolaroidCard 
                            imageUrl={uploadedImage} 
                            caption="Your Photo" 
                            status="done"
                         />
                         <div className="flex items-center gap-4 mt-4">
                            <button onClick={handleReset} className={secondaryButtonClasses}>
                                Different Photo
                            </button>
                            <button onClick={handleGenerateClick} className={primaryButtonClasses}>
                                Generate
                            </button>
                         </div>
                    </div>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                     <>
                        {isMobile ? (
                            <div className="w-full max-w-sm flex-1 overflow-y-auto mt-4 space-y-8 p-4">
                                {DECADES.map((decade, index) => (
                                    <motion.div 
                                        key={decade} 
                                        className="flex justify-center"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.1 }}
                                    >
                                         <PolaroidCard
                                            caption={decade}
                                            status={generatedImages[decade]?.status || 'pending'}
                                            imageUrl={generatedImages[decade]?.url}
                                            error={generatedImages[decade]?.error}
                                            onShake={handleRegenerateDecade}
                                            onDownload={handleDownloadIndividualImage}
                                            onShare={handleShareIndividualImage}
                                            isMobile={isMobile}
                                            effect={effect}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                                // Render Progress Bar below the draggable area
                                <>
                                    <div ref={dragAreaRef} className="relative w-full max-w-5xl h-[600px] mt-4 z-10 pointer-events-[none]">
                                        {DECADES.map((decade, index) => {
                                            const { top, left, rotate } = POSITIONS[index];
                                            return (
                                                <motion.div
                                                    key={decade}
                                                    className="absolute cursor-grab active:cursor-grabbing pointer-events-auto"
                                                    style={{ top, left }}
                                                    initial={{ opacity: 0, scale: 0.95, y: 50, rotate: 0 }}
                                                    animate={{ 
                                                        opacity: 1, 
                                                        scale: 1, 
                                                        y: 0,
                                                        rotate: `${rotate}deg`,
                                                    }}
                                                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
                                                >
                                            <PolaroidCard 
                                                dragConstraintsRef={dragAreaRef}
                                                caption={decade}
                                                status={generatedImages[decade]?.status || 'pending'}
                                                imageUrl={generatedImages[decade]?.url}
                                                error={generatedImages[decade]?.error}
                                                onShake={handleRegenerateDecade}
                                                onDownload={handleDownloadIndividualImage}
                                                onShare={handleShareIndividualImage}
                                                isMobile={isMobile}
                                                effect={effect}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                            </>
                        )}
                         <div className="h-20 mt-4 flex flex-col items-center justify-center relative z-20 pointer-events-auto">
                            {appState === 'results-shown' && (
                                <div className="flex flex-col items-center gap-4">
                                    {(isDownloading || isSharing) && downloadProgress > 0 && (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="text-neutral-400 text-sm font-medium tracking-wide">
                                                {Math.round(downloadProgress)}% Complete
                                            </div>
                                            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-white transition-all duration-300 ease-out shadow-[0_0_10px_white]" 
                                                    style={{ width: `${downloadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <button 
                                            onClick={handleDownloadAlbum} 
                                            disabled={isDownloading || isSharing} 
                                            className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isDownloading ? 'Creating Album...' : 'Download Album'}
                                        </button>
                                        <button 
                                            onClick={handleShareAlbum} 
                                            disabled={isDownloading || isSharing} 
                                            className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isSharing ? 'Generating Link...' : 'Share Album'}
                                        </button>
                                        <button onClick={handleReset} className={secondaryButtonClasses} disabled={isDownloading || isSharing}>
                                            Start Over
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </main>
    );
}

export default App;