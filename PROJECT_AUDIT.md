# TimeShift - Project Audit & Final Roadmap

## 1. Project Status Overview
**The project is fundamentally complete and fully functional.**
- **Completed:** 
  - Core user flow from Landing Page to Generation and Results.
  - Integration with Gemini 2.5 Flash for image analysis and sequential decade-based generation.
  - Beautiful UI/UX with Framer Motion animations (Polaroid cards, ghost-card intro, zooming, shaking).
  - Robust export options: single downloads, GIF generation (`gifshot`), ZIP bulk download (`JSZip`), and Album composition (HTML Canvas).
  - Custom full-stack capability: A Node/Express server handling backend share routes and OpenGraph metadata rendering.
  - Image generation robustness: Retries, 429 quota handling, single concurrency to prevent sudden rate-mapping spikes on Gemini API.

- **Partially Done:**
  - `lib/sounds.ts` contains empty functions (`playClickSound`, etc.). Sounds are referenced globally throughout the app but produce no audio.
  - Local caching of generated user profiles is implemented via `localStorage` directly using base64. 

- **Missing Details:**
  - Fallback mechanisms for users who deny/block clipboard access when copying share links (currently partially addressed, but can be improved visually).
  - Memory & Performance handling for very large image assets within GIF and ZIP features.

---

## 2. Critical Issues (Must Fix Before Finish)

**1. `localStorage` Quota Exceeded (Silent Failure Risk)**
- **Issue:** The app saves user 'profiles' by storing the original uploaded photo as a `base64` string directly into `localStorage`. `localStorage` has a strict ~5MB limit in most browsers. Saving 2-3 high-resolution phone photos will immediately exceed this quota and crash the save function.
- **Impact:** High. Breaks the "Save Profile" feature entirely after a few uses.

**2. Main Thread Blocking on Async Exports**
- **Issue:** Generating the Album Canvas (`createAlbumPage`), GIF (`createGifFromImages`), and ZIP files process synchronously or heavily on the main thread.
- **Impact:** Medium. On mobile devices, this might cause the entire UI framework (button states, etc.) to freeze for several seconds until the file is presented.

**3. JSZip Memory Pressure**
- **Issue:** Adding 10 high-resolution Base64 Gemini images into JSZip and triggering `.generateAsync()` buffers the entire uncompressed/compressed ZIP in memory. Small RAM devices (like older iOS/Android) will auto-refresh/crash the webpage (OOM kill).
- **Impact:** Medium-High. 

---

## 3. Improvements (High Impact)

**1. Switch to IndexedDB for Profile Storage**
- Using a library like `localforage` or `idb-keyval` will unlock hundreds of megabytes for storing user base64 images without locking up local storage limits.

**2. Image Downsampling Before Upload**
- Use an invisible canvas to resize the user's uploaded photo (e.g. max `1024x1024`) before passing it to Gemini and saving it to local storage. This drastically reduces API payload sizes and memory overhead.

**3. Off-loaded Web Workers**
- Shift `gifshot` and ZIP compression processes to Web Workers so the "Processing..." state doesn't freeze the DOM tree.

**4. Implement Real Sounds**
- The app has great visual feedback, but the sound hooks are empty. Adding short, royalty-free audio clips for "Shutter", "Swoosh" (Drag/Drop), and "Pop" (Click) will elevate this from a web app to a native-feeling experience.

---

## 4. Final Features to Add (To Call it "Done")

1. **Clear Storage Option:** Add a button in Settings to "Clear Saved Profiles and Data" so users can reset their local storage state.
2. **Audio UI Toggle Realization:** Add accurate UI (like a speaker icon in the footer/header) to enable/disable the sounds (once actual MP3/WAV files are wired into `sounds.ts`).
3. **Empty State UI for Grid:** While generations are running sequentially, show users exactly which ones are pending and which one is actively generating. Right now, it handles it fine, but a subtle "Generating..." text overlay specific to the active card helps set expectations.

---

## 5. Manual Tasks (For You To Do)

Follow these step-by-step tasks to finalize the project completely:

### Task 1: Fix Profile Storage Limit
- [ ] Run `npm install idb-keyval`.
- [ ] Update `App.tsx` state `savedProfiles`. Instead of `localStorage.setItem`, import `set` / `get` from `idb-keyval`.
- [ ] Make the initialization of `savedProfiles` an `useEffect` that loads asynchronously from `idb-keyval` on mount.

### Task 2: Compress Uploaded Images
- [ ] In `handleImageUpload` (`App.tsx`), read the file into an `HTMLImageElement` and draw it on an `HTMLCanvasElement` restricted to `800px` max width/height.
- [ ] Run `canvas.toDataURL('image/jpeg', 0.8)` and save *that* lightweight string into state and IndexedDB.

### Task 3: Load Actual Audio Effects
- [ ] Put 4-5 `.mp3` sound files into the `public/sounds/` folder (e.g., `shutter.mp3`, `click.mp3`, `success.mp3`).
- [ ] Update `lib/sounds.ts` to instantiate `new Audio('/sounds/filename.mp3')` and `.play()` them in those empty functions.
- [ ] Ensure `play()` is wrapped in a `try/catch` as varying browsers block autoplaying audio without direct user interaction (drag, click).

### Task 4: Add Mobile-Friendly Download Handlers
- [ ] Provide explicit fallbacks that display the finalized exported Album/GIF in a full-screen Modal alongside a direct "Download/Save" link. On mobile, `document.body.appendChild(link)` and `.click()` frequently fail or act unreliably on iOS Safari. Presenting the user with the actual generated file to "Long Press -> Save Image" is 100x more stable on mobile devices.

---

## 6. Optional Enhancements (Nice-to-Haves)

- **AI Prompt Exposing:** Allow the user to "View Prompt" on the zoomed Card metadata tab to see exactly what instructions Gemini was given.
- **Watermark Toggling:** Allow paying or registered users to remove the "Generated with TimeShift" text from the Album exports.
- **Service Worker / PWA:** Add a basic Web App Manifest and Service Worker so users can "Add to Home Screen" on mobile.
- **Dynamic Decades:** Turn the hardcoded `DECADES` array into a user-selectable list before generation starts (e.g., let them uncheck "1930s" if they want to save tokens and time).
