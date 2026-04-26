<div align="center">

<br />

<img src="https://img.shields.io/badge/TimeShift-v1.0-000000?style=for-the-badge&logoColor=white" alt="version" />
<img src="https://img.shields.io/badge/Built_with-TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript" />
<img src="https://img.shields.io/badge/React-18-000000?style=for-the-badge&logo=react&logoColor=white" alt="react" />
<img src="https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="vite" />
<img src="https://img.shields.io/badge/TailwindCSS-v3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="tailwind" />
<img src="https://img.shields.io/badge/Framer_Motion-Animated-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="framer" />

<br /><br />

```text
 ████████╗██╗███╗   ███╗███████╗███████╗██╗  ██╗██╗███████╗████████╗
 ╚══██╔══╝██║████╗ ████║██╔════╝██╔════╝██║  ██║██║██╔════╝╚══██╔══╝
    ██║   ██║██╔████╔██║█████╗  ███████╗███████║██║█████╗     ██║   
    ██║   ██║██║╚██╔╝██║██╔══╝  ╚════██║██╔══██║██║██╔══╝     ██║   
    ██║   ██║██║ ╚═╝ ██║███████╗███████║██║  ██║██║██║        ██║   
    ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   
```

### **Your Face. Across the Decades.** — AI-Powered Time Travel in seconds.

[Live App](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## ✦ What is TimeShift?

**TimeShift** is an AI-powered experience that transforms your portrait into photorealistic vintage polaroids across different decades (from the 1950s to the 2000s).

Step into the ultimate time machine journey. Simply upload a single photo, and watch the AI reimagine your face in authentic, era-specific classical styles. Built for seamless interactivity, immersive audio, and a visually striking **"Premium Dark"** aesthetic.

---

<details>
<summary><strong>🇹🇷 Türkçe Açıklama</strong></summary>

<br />

**TimeShift**, portrenizi 1950'lerden 2000'lere kadar farklı on yıllara ait fotogerçekçi vintage polaroidlere dönüştüren yapay zeka destekli bir deneyimdir.

Sıradan filtrelerin ötesine geçerek en üst düzey zaman makinesi yolculuğuna adım atın. Sadece tek bir fotoğraf yükleyin ve yapay zekanın yüzünüzü o dönemin otantik stilleriyle yeniden hayal etmesini izleyin. Akıcı bir etkileşim, sürükleyici ses efektleri ve göz alıcı **"Premium Dark"** karanlık arayüz ile tasarlandı.

</details>

---

## ⚡ Features

| Feature | Description |
|---------|-------------|
| ⏳ **Decade Transformation** | Reimagines a single uploaded photo across 6 distinct eras (50s, 60s, 70s, 80s, 90s, 00s) |
| 📸 **Interactive Polaroids** | Drag-and-drop polaroid cards with realistic physics, snap-to-grid, and subtle spatial shadows |
| 🎵 **Immersive Audio** | Thematic, non-intrusive sound effects for shutter clicks, drag & drop interactions, and UI toggles |
| 🎨 **Dynamic Albums** | Generate downloadable multi-layout (Grid, Collage) albums with vintage/sepia FX on HTML Canvas |
| 🔗 **Social Sharing** | One-click share links with auto-generated optimal thumbnails for OpenGraph (Twitter/Discord) previews |
| 🌑 **Premium UI** | Deep black aesthetics featuring animated mesh gradients, noise textures, and Framer Motion orchestrations |
| 📱 **Responsive Design** | Custom desktop physics and mobile-first scrolling lists tailored perfectly to your device view |

---

## 🖼️ Screenshots

> *(Coming soon — High-quality mockups of the TimeShift interface)*

---

## 🛠️ Tech Stack

```text
Frontend        →  React 18 · TypeScript (strict) · Tailwind CSS v3 · Framer Motion
Build Tool      →  Vite (Fast HMR & Optimized Bundling)
UI Elements     →  Lucide React Icons · Headless structure
Animations      →  Framer Motion (Drag elasticity, Layout transisitons, Spring physics)
Rendering       →  HTML5 Canvas API (Thumbnails & Album Compositing)
Audio Engine    →  Web Audio API (Synthesized & Spatial sound generation)
Server          →  Express.js (Share link proxy & OG meta-tag injection)
```

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                         TIMESHIFT APP                            │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐ │
│  │  React 18     │  │  Vite Build   │  │    Framer Motion      │ │
│  │  Client SPA   │  │  Optimized    │  │  Physics & Animations │ │
│  └───────────────┘  └───────────────┘  └───────────────────────┘ │
└───────────────────────────┬──────────────────────────────────────┘
                            │ (Client Rendered + Animations)
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌────────────────┐  ┌───────────────┐  ┌───────────────────┐
│   Images Gen   │  │ Express Node  │  │   Canvas Engine   │
│  (API Proxies  │  │ (Share Links  │  │ (Album Creation & │
│   & Prompts)   │  │  & OG Tags)   │  │   Thumbnails)     │
└────────────────┘  └───────────────┘  └───────────────────┘
```

---

## 📐 Project Structure

```text
TimeShift/
├── public/                 # Static assets
├── src/
│   ├── components/         # React Components
│   │   ├── ui/             # Reusable base elements (DraggableCard)
│   │   ├── Footer.tsx      # Application footer
│   │   ├── LandingPage.tsx # Premium animated intro screen
│   │   ├── PolaroidCard.tsx# Interactive image cards
│   │   └── ShareView.tsx   # Public timeline viewer
│   ├── lib/                # Utilities and core logic
│   │   ├── albumUtils.ts   # Canvas layout generation & filters
│   │   ├── sounds.ts       # Web Audio API synthesizers
│   │   └── utils.ts        # Tailwind `cn` helper
│   ├── App.tsx             # Main view orchestration mapping
│   ├── index.css           # Tailwind injection & global fonts
│   └── main.tsx            # React application entry point
├── server.ts               # Express server (SSR OG Tags + file proxy)
├── package.json            # Scripts & Dependencies
├── tailwind.config.js      # Styling configuration
├── tsconfig.json           # TS rules
└── vite.config.ts          # Vite bundler settings
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18`
- npm or yarn

### Local Development

```bash
# Clone the repository
git clone https://github.com/kutluhangil/TimeShift.git
cd TimeShift

# Install dependencies
npm install

# Start the dev server
npm run dev
```

App runs at `http://localhost:3000`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server via `tsx` (Starts Express + Vite middleware) |
| `npm run build` | Optimizes assets and prepares production build in `/dist` |
| `npm run lint` | ESLint static code analysis |

---

## 🔒 State & Asset Management

| Layer | Implementation |
|-------|----------------|
| **Asset Storage** | Rendered memories are saved server-side using the `fs` API and mapped to UUIDs |
| **OG Proxying** | Express intercepts `/share/:id` to inject rich meta tags based on the generated thumbnail |
| **Canvas** | High-resolution compositing prevents CORS taint by properly handling `crossOrigin` bounds |
| **Audio** | Safe `AudioContext` booting requires explicit user gestures to bypass standard browser autoplay blockers |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">

Built with precision by [kutluhangil](https://github.com/kutluhangil)

<br />

*If you find this useful, consider giving it a ⭐*

</div>
