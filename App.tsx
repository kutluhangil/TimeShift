/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDecadeImage, analyzeCharacterFeatures } from './services/geminiService';
import PolaroidCard from './components/PolaroidCard';
import { createAlbumPage, ImageEffect } from './lib/albumUtils';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import { playClickSound, playUploadSound, playShutterSound, playSuccessSound, playRegenerateSound } from './lib/sounds';
import { Settings, X, RotateCcw, Loader2, Edit2 } from 'lucide-react';
import { createThumbnail } from './lib/albumUtils';
import { cn, downloadDataUrlAsFile } from './lib/utils';
import { get, set, clear } from 'idb-keyval';

const DECADES = [
    '1920s Flapper', 
    '1930s Great Depression', 
    '1940s Wartime', 
    '1950s Classic', 
    '1960s Psychedelic', 
    '1970s Disco', 
    '1980s Neon', 
    '1990s Grunge', 
    '2000s Y2K',
    '2010s Early Digital'
];

// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
    { top: '2%', left: '10%', rotate: -8 },
    { top: '5%', left: '40%', rotate: 5 },
    { top: '15%', left: '70%', rotate: -3 },
    { top: '40%', left: '5%', rotate: 3 },
    { top: '45%', left: '35%', rotate: -10 },
    { top: '50%', left: '65%', rotate: 8 },
    { top: '80%', left: '15%', rotate: -5 },
    { top: '85%', left: '55%', rotate: 12 },
    { top: '25%', left: '20%', rotate: -15 },
    { top: '70%', left: '40%', rotate: 20 },
];

const GHOST_POLAROIDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
  { initial: { x: "0%", y: "-200%", rotate: 0 }, transition: { delay: 0.5 } },
  { initial: { x: "100%", y: "150%", rotate: 10 }, transition: { delay: 0.3 } },
  { initial: { x: "-50%", y: "200%", rotate: -15 }, transition: { delay: 0.7 } },
  { initial: { x: "200%", y: "0%", rotate: 35 }, transition: { delay: 0.9 } },
];


type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

export interface SavedProfile {
    id: string;
    name: string;
    imageData: string;
    characterDescription: string;
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
    const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
    const [promptHistory, setPromptHistory] = useState<string[]>([]);
    const [isMutedState, setIsMutedState] = useState<boolean>(false);

    useEffect(() => {
        get('timeshift_profiles').then((val) => {
            if (val) {
                setSavedProfiles(val);
            }
        });
        get('timeshift_history').then((val) => {
            if (val) {
                setPromptHistory(val);
            }
        });
        get('timeshift_muted').then((val) => {
            if (val !== undefined) {
                setIsMutedState(val);
                setMuted(val);
            }
        });
    }, []);

    const [profileNameInput, setProfileNameInput] = useState('');
    const [loadedProfileId, setLoadedProfileId] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [isSharing, setIsSharing] = useState<boolean>(false);
    const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
    const [appState, setAppState] = useState<'landing' | 'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('landing');
    const [effect, setEffect] = useState<ImageEffect>('none');
    const [gifInterval, setGifInterval] = useState<number>(1.0);
    const [gifSize, setGifSize] = useState<number>(600);
    const [showSettings, setShowSettings] = useState(false);
    const [characterDescription, setCharacterDescription] = useState<string>('');
    const [customPrompt, setCustomPrompt] = useState<string>('');
    const [draggingDecade, setDraggingDecade] = useState<string | null>(null);
    const [zoomedImage, setZoomedImage] = useState<{url: string, caption: string} | null>(null);
    const [colorPalette, setColorPalette] = useState<'none' | 'vivid' | 'muted' | 'sepia'>('none');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '16:9'>('1:1');
    const [cardMetadata, setCardMetadata] = useState<Record<string, { date?: string, location?: string, notes?: string }>>({});
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');


    const [showComparison, setShowComparison] = useState<boolean>(false);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleSaveProfile = async () => {
        if (!uploadedImage || !characterDescription || !profileNameInput.trim()) return;
        
        setIsSavingProfile(true);
        
        // Simulating a brief delay for UX
        await new Promise(r => setTimeout(r, 600));

        if (loadedProfileId) {
            const updated = savedProfiles.map(p => p.id === loadedProfileId ? { ...p, name: profileNameInput.trim() } : p);
            setSavedProfiles(updated);
            await set('timeshift_profiles', updated);
            showToast("Profile name updated!");
        } else {
            const newProfile: SavedProfile = {
                id: Date.now().toString(),
                name: profileNameInput.trim(),
                imageData: uploadedImage,
                characterDescription
            };
            const updated = [...savedProfiles, newProfile];
            setSavedProfiles(updated);
            await set('timeshift_profiles', updated);
            setLoadedProfileId(newProfile.id);
            showToast("Profile saved successfully!");
        }
        setIsSavingProfile(false);
    };

    const handleLoadProfile = (profile: SavedProfile) => {
        setUploadedImage(profile.imageData);
        setCharacterDescription(profile.characterDescription);
        setLoadedProfileId(profile.id);
        setProfileNameInput(profile.name);
        setAppState('image-uploaded');
        playUploadSound();
    };

    const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedProfiles.filter(p => p.id !== id);
        setSavedProfiles(updated);
        await set('timeshift_profiles', updated);
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            playUploadSound();
            setIsUploading(true);
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = async () => {
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 800;

                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    let downsampledDataUrl: string;
                    try {
                        const { downsampleImageWebGL } = await import('./lib/webglUtils');
                        downsampledDataUrl = await downsampleImageWebGL(img, width, height);
                        console.log("Downsampled using WebGL");
                    } catch (e) {
                        console.warn("WebGL downsampling failed, falling back to 2D Canvas", e);
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                        }
                        downsampledDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    }
                    
                    setIsUploading(false);
                    setUploadedImage(downsampledDataUrl);
                    setAppState('image-uploaded');
                    setGeneratedImages({}); // Clear previous results
                    setCharacterDescription('');
                    setLoadedProfileId(null);
                    setProfileNameInput('');
                    
                    setIsAnalyzing(true);
                    try {
                        const desc = await analyzeCharacterFeatures(downsampledDataUrl);
                        setCharacterDescription(desc);
                    } catch (error) {
                        console.error("Failed to analyze character feature", error);
                        showToast("Failed to analyze portrait features.");
                    } finally {
                        setIsAnalyzing(false);
                    }
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const getGenerationPrompt = (decade: string, desc: string) => {
        return `Reimagine the exact same person from this photo but in the style of the ${decade}. 
CRITICAL RULES:
1. You MUST maintain the person's exact facial identity, bone structure, and facial features.
Character reference: ${desc}
2. The person must look like the EXACT SAME INDIVIDUAL, but styled in the ${decade}.
3. The background MUST be an era-appropriate setting for the ${decade} (e.g., historical architecture, retro interiors, appropriate social scenes, vintage props).
4. Change their clothing, hairstyle, and the photo's grading/quality to perfectly match the ${decade} aesthetic.
${customPrompt ? `5. Additional specific instructions: ${customPrompt}\n` : ''}${colorPalette !== 'none' ? `The overall color palette of the image MUST be ${colorPalette === 'vivid' ? 'highly vivid and saturated' : colorPalette === 'muted' ? 'muted, desaturated, and vintage' : 'sepia-toned with a brown, warm vintage wash'}.\n` : ''}${aspectRatio !== '1:1' ? `The image MUST be composed to fit a ${aspectRatio} aspect ratio perfectly.\n` : ''}The output must be a clean, sharp, photorealistic photograph without borders.`;
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage) return;

        playClickSound();
        setIsLoading(true);
        setAppState('generating');

        if (customPrompt.trim()) {
            const newHistory = [customPrompt.trim(), ...promptHistory.filter(p => p !== customPrompt.trim())].slice(0, 10);
            setPromptHistory(newHistory);
            await set('timeshift_history', newHistory);
        }
        
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

        const concurrencyLimit = 1; // Process one decade at a time to prevent rate limits
        const decadesQueue = [...DECADES];

        const processDecade = async (decade: string) => {
            try {
                const prompt = getGenerationPrompt(decade, desc);
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
            const prompt = getGenerationPrompt(decade, characterDescription);
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
        setCustomPrompt('');
        setLoadedProfileId(null);
        setProfileNameInput('');
        setAppState('idle');
    };

    const handleDownloadIndividualImage = async (decade: string) => {
        const image = generatedImages[decade];
        if (image?.status === 'done' && image.url) {
            await downloadDataUrlAsFile(image.url, `timeshift-${decade}.jpg`);
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
                    try {
                        await navigator.clipboard.writeText(window.location.origin + data.url);
                        showToast("Share link copied to clipboard!");
                    } catch {
                        showToast("Share link: " + window.location.origin + data.url);
                        console.info("Share Link:", window.location.origin + data.url);
                    }
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
            const albumDataUrl = await createAlbumPage(imageData, setDownloadProgress, effect);
            const thumbnail = await createThumbnail(albumDataUrl);

            const res = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageParams: albumDataUrl, thumbnail, type: 'album' })
            });
            const data = await res.json();
            if (data.url) {
                // Clipboard API might be blocked, let's catch it.
                try {
                    await navigator.clipboard.writeText(window.location.origin + data.url);
                    showToast("Album share link copied to clipboard!");
                } catch {
                    showToast("Share album link: " + window.location.origin + data.url);
                    console.log("Link:", window.location.origin + data.url);
                }
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
        const imageData = Object.entries(generatedImages)
            .filter(([, image]) => image.status === 'done' && image.url)
            .reduce((acc, [decade, image]) => {
                acc[decade] = image!.url!;
                return acc;
            }, {} as Record<string, string>);

        if (Object.keys(imageData).length < DECADES.length) {
            showToast("Please wait for all images to finish generating before downloading the album.");
            return;
        }

        setIsDownloading(true);
        try {

            setDownloadProgress(0);
            const albumDataUrl = await createAlbumPage(imageData, setDownloadProgress, effect);
            await downloadDataUrlAsFile(albumDataUrl, 'timeshift-album.jpg');

        } catch (error) {
            console.error("Failed to create or download album:", error);
            showToast("Sorry, there was an error creating your album. Please try again.");
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    const handleDownloadGif = async () => {
        const imageUrls = DECADES.map(decade => generatedImages[decade]?.url).filter(Boolean) as string[];
        
        if (imageUrls.length < DECADES.length) {
            showToast("Please wait for all images to finish generating before downloading the GIF.");
            return;
        }

        setIsDownloading(true);
        try {

            setDownloadProgress(0);
            
            // dynamically import gifUtils to avoid loading unused packages
            const { createGifFromImages } = await import('./lib/gifUtils');
            const gifDataUrl = await createGifFromImages(imageUrls, setDownloadProgress, gifInterval, gifSize);
            await downloadDataUrlAsFile(gifDataUrl, 'timeshift.gif');

        } catch (error) {
            console.error("Failed to create or download GIF:", error);
            showToast("Sorry, there was an error creating your GIF. Please try again.");
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            
            if (e.key.toLowerCase() === 's') {
                if (!isDownloading && !isSharing) handleReset();
            } else if (e.key.toLowerCase() === 'd') {
                if (appState === 'results-shown' && !isDownloading && !isSharing) handleDownloadAlbum();
            } else if (e.key.toLowerCase() === 'r') {
                if (zoomedImage && zoomedImage.caption !== 'Your Photo' && zoomedImage.caption !== 'Click to begin') {
                    handleRegenerateDecade(zoomedImage.caption);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [appState, isDownloading, isSharing, zoomedImage]);

    const [isRecording, setIsRecording] = useState<boolean>(false);

    const handleVoiceRecord = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast("Voice input is not supported in your browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsRecording(true);
            playClickSound();
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setCharacterDescription((prev) => (prev.trim() ? prev + " " + transcript : transcript));
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            showToast("Speech recognition error.");
        };

        recognition.onend = () => {
            setIsRecording(false);
            playClickSound();
        };

        recognition.start();
    };

    const LoadingOverlay = () => {
        if (!isDownloading && !isSharing) return null;
        return (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                <div className="bg-neutral-900 border border-neutral-700/50 p-8 rounded-2xl flex flex-col items-center shadow-2xl relative max-w-sm w-full text-center">
                    <Loader2 size={48} className="animate-spin text-amber-500 mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">{isDownloading ? "Preparing File(s)" : "Generating Share Link"}</h3>
                    <p className="text-neutral-400 text-sm mb-4">Please wait while we process the images.</p>
                    {downloadProgress > 0 && downloadProgress < 100 && (
                        <div className="w-full bg-neutral-800 rounded-full h-2.5 mt-2">
                           <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (appState === 'landing') {
        return (
            <LandingPage onStart={() => setAppState('idle')} />
        );
    }

    return (
        <main className="bg-black text-white font-sans min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative">
            <LoadingOverlay />
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
                    onClick={() => setShowSettings(true)}
                    className="p-3 bg-neutral-900 border border-neutral-700/50 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shadow-lg"
                    title="Settings"
                    aria-label="Settings"
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
                            aria-label="Close settings"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="font-bold text-2xl mb-6 text-white text-center">Settings</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block flex items-center text-sm font-medium text-neutral-300 mb-2">
                                    Image Effect
                                    <span className="ml-2 text-neutral-500 cursor-help" title="Apply a visual filter to the entire generated album grid and polaroid borders.">ⓘ</span>
                                </label>
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
                                <label className="block flex items-center text-sm font-medium text-neutral-300 mb-2">
                                    GIF Speed (Seconds per Frame)
                                    <span className="ml-2 text-neutral-500 cursor-help" title="Controls how fast the animated GIF transitions between decades.">ⓘ</span>
                                </label>
                                <select 
                                    className="w-full bg-black/50 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all"
                                    value={gifInterval}
                                    onChange={(e) => setGifInterval(parseFloat(e.target.value))}
                                >
                                    <option value={0.5}>Fast (0.5s)</option>
                                    <option value={1.0}>Normal (1.0s)</option>
                                    <option value={1.5}>Slow (1.5s)</option>
                                    <option value={2.0}>Very Slow (2.0s)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block flex items-center text-sm font-medium text-neutral-300 mb-2">
                                    GIF Resolution
                                    <span className="ml-2 text-neutral-500 cursor-help" title="Select the output dimensions for the animated GIF. Higher resolutions make files larger.">ⓘ</span>
                                </label>
                                <select 
                                    className="w-full bg-black/50 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all"
                                    value={gifSize}
                                    onChange={(e) => setGifSize(parseInt(e.target.value, 10))}
                                >
                                    <option value={400}>Small (400x400)</option>
                                    <option value={600}>Medium (600x600)</option>
                                    <option value={800}>Large (800x800)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block flex items-center text-sm font-medium text-neutral-300 mb-2">
                                    Color Palette
                                    <span className="ml-2 text-neutral-500 cursor-help" title="Directs the AI to focus heavily on a specific color mood during generation.">ⓘ</span>
                                </label>
                                <select 
                                    className="w-full bg-black/50 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all"
                                    value={colorPalette}
                                    onChange={(e) => setColorPalette(e.target.value as any)}
                                >
                                    <option value="none">Original/Natural</option>
                                    <option value="vivid">Vivid</option>
                                    <option value="muted">Muted</option>
                                    <option value="sepia">Sepia Toned</option>
                                </select>
                            </div>

                            <div>
                                <label className="block flex items-center text-sm font-medium text-neutral-300 mb-2">
                                    Aspect Ratio
                                    <span className="ml-2 text-neutral-500 cursor-help" title="The crop/shape of the generated images. Note that polaroids look best with 1:1.">ⓘ</span>
                                </label>
                                <select 
                                    className="w-full bg-black/50 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all"
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value as any)}
                                >
                                    <option value="1:1">Square (1:1)</option>
                                    <option value="4:3">Portrait (4:3)</option>
                                    <option value="16:9">Widescreen (16:9)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block flex items-center text-sm font-medium text-neutral-300 mb-2">
                                    Custom Generation Prompt (Optional)
                                    <span className="ml-2 text-neutral-500 cursor-help" title="Add extra instructions to customize your generations, like 'wearing a cowboy hat'.">ⓘ</span>
                                </label>
                                <textarea
                                    className="w-full bg-black/50 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-white/20 outline-none transition-all resize-none"
                                    placeholder="e.g. In a cyberpunk futuristic city, holding a glowing orb"
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    rows={3}
                                />
                                {promptHistory.length > 0 && (
                                    <div className="mt-3">
                                        <label className="block flex items-center text-xs font-medium text-neutral-500 mb-2">
                                            Recent Prompts
                                            <span className="ml-2 text-neutral-600 cursor-help" title="Click a previous prompt to reuse it.">ⓘ</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {promptHistory.map((prompt, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCustomPrompt(prompt)}
                                                    className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded transition-colors text-left max-w-full truncate"
                                                    title={prompt}
                                                >
                                                    {prompt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <label className="flex items-center text-sm font-medium text-neutral-300">
                                    App Sounds
                                    <span className="ml-2 text-neutral-500 cursor-help" title="Enable or disable UI sound effects globally.">ⓘ</span>
                                </label>
                                <button
                                    onClick={async () => {
                                        const newMuted = !isMutedState;
                                        setIsMutedState(newMuted);
                                        setMuted(newMuted);
                                        await set('timeshift_muted', newMuted);
                                        playClickSound(); // If we just unmuted, this will play.
                                    }}
                                    className={cn("p-2 rounded-full transition-colors", isMutedState ? "bg-red-500/20 text-red-400" : "bg-neutral-800 text-white")}
                                    aria-label="Toggle Sounds"
                                >
                                    {isMutedState ? "Muted" : "On"}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-neutral-700/50">
                            <button 
                                onClick={async () => {
                                    if (window.confirm("Are you sure you want to clear all saved profiles and local data?")) {
                                        await clear();
                                        setSavedProfiles([]);
                                        setPromptHistory([]);
                                        setUploadedImage(null);
                                        setAppState('landing');
                                        setShowSettings(false);
                                        showToast("All data cleared successfully.");
                                    }
                                }}
                                className="w-full font-medium text-red-500 bg-red-500/10 py-3 px-4 rounded-lg hover:bg-red-500/20 transition-all text-sm"
                            >
                                Clear All Saved Data
                            </button>
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
                <div className="text-center mb-10 p-6 rounded-2xl backdrop-blur-md bg-black/20 border border-white/5 inline-block w-fit mx-auto max-w-xl">
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
                            <label htmlFor="file-upload" className={cn("cursor-pointer group transform transition-transform duration-300", !isUploading && "hover:scale-105")}>
                                 <PolaroidCard 
                                     caption={isUploading ? "Uploading..." : "Click to begin"}
                                     status={isUploading ? "pending" : "done"}
                                 />
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} disabled={isUploading} />
                            <p className="mt-8 text-neutral-400 text-center max-w-sm text-sm md:text-base leading-relaxed">
                                Click the polaroid to upload your photo and start your journey through time.
                            </p>
                            
                            {savedProfiles.length > 0 && (
                                <div className="mt-12 w-full max-w-2xl px-4 pointer-events-auto">
                                    <h3 className="text-xl font-medium text-white mb-4 text-center">Or choose a saved profile</h3>
                                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                                        {savedProfiles.map(profile => (
                                            <div 
                                                key={profile.id}
                                                onClick={() => handleLoadProfile(profile)}
                                                className="snap-center shrink-0 w-32 h-40 bg-white p-2 rounded-sm cursor-pointer shadow-lg transform transition-transform hover:-translate-y-2 hover:shadow-xl group relative"
                                            >
                                                <div className="w-full h-24 bg-neutral-200 overflow-hidden relative">
                                                    <img src={profile.imageData} alt={profile.name} className="w-full h-full object-cover" />
                                                </div>
                                                <p className="mt-2 text-center text-black font-medium text-xs truncate uppercase tracking-widest">{profile.name}</p>
                                                <button 
                                                    onClick={(e) => handleDeleteProfile(profile.id, e)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete Profile"
                                                    aria-label={`Delete profile ${profile.name}`}
                                                >
                                                    <X size={14} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleLoadProfile(profile); }}
                                                    className="absolute -top-2 right-6 bg-blue-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Edit Profile"
                                                    aria-label={`Edit profile ${profile.name}`}
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <div className="flex flex-col items-center gap-6 w-full max-w-lg z-20 pointer-events-auto">
                         <PolaroidCard 
                            imageUrl={uploadedImage} 
                            caption="Your Photo" 
                            status="done"
                         />
                         
                         {isAnalyzing && (
                            <div className="flex items-center gap-3 text-neutral-300 bg-black/40 px-6 py-3 rounded-full border border-white/10 backdrop-blur-md">
                                <Loader2 size={18} className="animate-spin text-amber-500" />
                                <span className="text-sm font-medium tracking-wide">Analyzing subjects...</span>
                            </div>
                         )}

                         {characterDescription && (
                            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 backdrop-blur-md">
                                <div className="flex items-start gap-2">
                                    <textarea 
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white/80 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-white/30"
                                        rows={3}
                                        value={characterDescription}
                                        onChange={(e) => setCharacterDescription(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleVoiceRecord}
                                        className={cn("p-3 rounded-lg flex-shrink-0 transition-all", isRecording ? "bg-red-500/20 text-red-500 animate-pulse" : "bg-black/50 border border-white/10 text-white/60 hover:text-white hover:bg-white/10")}
                                        title={isRecording ? "Recording..." : "Dictate modifications"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Profile Name (e.g., Me)" 
                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-white/30"
                                        value={profileNameInput}
                                        onChange={(e) => setProfileNameInput(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleSaveProfile}
                                        disabled={!profileNameInput.trim() || isSavingProfile}
                                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                                    >
                                        {isSavingProfile ? (
                                            <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</>
                                        ) : loadedProfileId ? "Update Name" : "Save Profile"}
                                    </button>
                                </div>
                            </div>
                         )}

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
                                            onZoom={(url, caption) => setZoomedImage({url, caption})}
                                            isMobile={isMobile}
                                            effect={effect}
                                            aspectRatio={aspectRatio}
                                            progressPlaceholderUrl={uploadedImage}
                                            metadata={cardMetadata[decade]}
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
                                                onZoom={(url, caption) => setZoomedImage({url, caption})}
                                                isMobile={isMobile}
                                                effect={effect}
                                                dragSnapToOrigin={false}
                                                onDragStartApp={() => setDraggingDecade(decade)}
                                                onDragEndApp={() => setDraggingDecade(null)}
                                                isDimmed={draggingDecade !== null && draggingDecade !== decade}
                                                aspectRatio={aspectRatio}
                                                progressPlaceholderUrl={uploadedImage}
                                                metadata={cardMetadata[decade]}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                            </>
                        )}
                             <div className="h-20 mt-4 flex flex-col items-center justify-center relative z-20 pointer-events-auto w-full max-w-4xl mx-auto">
                                {appState === 'results-shown' && (
                                    <div className="flex flex-col items-center gap-6 w-full">
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            <button 
                                                onClick={handleDownloadAlbum} 
                                                disabled={isDownloading || isSharing} 
                                                className={`${primaryButtonClasses} px-6 py-3 whitespace-nowrap text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {isDownloading ? 'Processing...' : 'Save Album'}
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    const images = DECADES.map(decade => ({
                                                        decade,
                                                        url: generatedImages[decade]?.url
                                                    })).filter(i => i.url) as { decade: string, url: string }[];
                                                    
                                                    if (images.length < DECADES.length) {
                                                        showToast("Please wait for all images to finish generating before bulk downloading.");
                                                        return;
                                                    }

                                                    setIsDownloading(true);
                                                    try {
                                                        const { downloadBulkImages } = await import('./lib/zipUtils');
                                                        await downloadBulkImages(images, cardMetadata);
                                                    } catch (error) {
                                                        console.error("Failed to download zip", error);
                                                        showToast("Sorry, there was an error creating your zip. Please try again.");
                                                    } finally {
                                                        setIsDownloading(false);
                                                    }
                                                }}
                                                disabled={isDownloading || isSharing} 
                                                className={`${secondaryButtonClasses} bg-white/5 border border-white/10 px-6 py-3 whitespace-nowrap text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                Download ZIP
                                            </button>
                                            <button 
                                                onClick={handleDownloadGif} 
                                                disabled={isDownloading || isSharing} 
                                                className={`${secondaryButtonClasses} bg-white/5 border border-white/10 px-6 py-3 whitespace-nowrap text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                Download GIF
                                            </button>
                                            <button 
                                                onClick={handleShareAlbum} 
                                                disabled={isDownloading || isSharing} 
                                                className={`${secondaryButtonClasses} bg-white/5 border border-white/10 px-6 py-3 whitespace-nowrap text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {isSharing ? 'Sharing...' : 'Share Web'}
                                            </button>
                                            <button onClick={handleReset} className={`${secondaryButtonClasses} !border-red-500/50 hover:!bg-red-500/10 text-red-100 flex items-center justify-center gap-2`} disabled={isDownloading || isSharing}>
                                                <RotateCcw size={16} />
                                                Start Over
                                            </button>
                                        </div>

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

                                        {characterDescription && !savedProfiles.find(p => p.characterDescription === characterDescription) && (
                                            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 backdrop-blur-md mt-4">
                                                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest text-center">Save This Persona</p>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Profile Name (e.g., Me)" 
                                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-white/30"
                                                        value={profileNameInput}
                                                        onChange={(e) => setProfileNameInput(e.target.value)}
                                                    />
                                                    <button 
                                                        onClick={handleSaveProfile}
                                                        disabled={!profileNameInput.trim() || isSavingProfile}
                                                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                                                    >
                                                        {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                    </>
                )}
            </div>
            <Footer />
            <AnimatePresence>
                {zoomedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setZoomedImage(null)}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row items-center justify-center gap-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                    {showComparison && uploadedImage && (
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-white/60 text-sm uppercase tracking-wider">Original</p>
                                            <img 
                                                src={uploadedImage} 
                                                alt="Original" 
                                                className="w-auto h-auto max-w-[80vw] md:max-w-[40vw] max-h-[35vh] md:max-h-[70vh] object-contain rounded-sm shadow-2xl opacity-80"
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center gap-2">
                                        {showComparison && <p className="text-white/60 text-sm uppercase tracking-wider">Generated</p>}
                                        <img 
                                            src={zoomedImage.url} 
                                            alt={zoomedImage.caption} 
                                            className={cn("w-auto h-auto max-w-full object-contain rounded-sm shadow-2xl", showComparison ? "max-h-[35vh] md:max-h-[70vh] max-w-[80vw] md:max-w-[40vw]" : "max-h-[70vh]")}
                                        />
                                    </div>
                                </div>
                                {!showComparison && <p className="text-white text-xl md:text-2xl font-medium tracking-widest uppercase">{zoomedImage.caption}</p>}
                            </div>
                            
                            <div className="flex flex-col gap-4 bg-neutral-900/80 p-6 rounded-xl border border-white/10 w-full max-w-sm shrink-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-white/80 uppercase tracking-widest text-sm font-semibold">Photo Metadata</h3>
                                    {uploadedImage && (
                                        <button 
                                            onClick={() => setShowComparison(!showComparison)}
                                            className="text-xs text-amber-500 hover:text-amber-400 border border-amber-500/30 hover:border-amber-400/50 px-2 py-1 rounded transition-colors"
                                        >
                                            {showComparison ? 'Hide Original' : 'Compare Original'}
                                        </button>
                                    )}
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-neutral-400 block mb-1">Date</label>
                                        <input 
                                            type="text"
                                            placeholder="e.g., Summer 1985"
                                            className="w-full bg-black/50 border border-neutral-700 rounded-md px-3 py-2 text-white text-sm focus:ring-1 focus:ring-white/30 outline-none"
                                            value={cardMetadata[zoomedImage.caption]?.date || ''}
                                            onChange={e => setCardMetadata(prev => ({
                                                ...prev,
                                                [zoomedImage.caption]: { ...prev[zoomedImage.caption], date: e.target.value }
                                            }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-400 block mb-1">Location</label>
                                        <input 
                                            type="text"
                                            placeholder="e.g., Paris, France"
                                            className="w-full bg-black/50 border border-neutral-700 rounded-md px-3 py-2 text-white text-sm focus:ring-1 focus:ring-white/30 outline-none"
                                            value={cardMetadata[zoomedImage.caption]?.location || ''}
                                            onChange={e => setCardMetadata(prev => ({
                                                ...prev,
                                                [zoomedImage.caption]: { ...prev[zoomedImage.caption], location: e.target.value }
                                            }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-400 block mb-1">Notes</label>
                                        <textarea 
                                            placeholder="Memory details..."
                                            className="w-full bg-black/50 border border-neutral-700 rounded-md px-3 py-2 text-white text-sm focus:ring-1 focus:ring-white/30 outline-none resize-none h-24"
                                            value={cardMetadata[zoomedImage.caption]?.notes || ''}
                                            onChange={e => setCardMetadata(prev => ({
                                                ...prev,
                                                [zoomedImage.caption]: { ...prev[zoomedImage.caption], notes: e.target.value }
                                            }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => setZoomedImage(null)}
                                className="absolute top-0 right-0 p-3 m-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all"
                                aria-label="Close zoomed image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </main>
    );
}

export default App;