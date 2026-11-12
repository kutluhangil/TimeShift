<div align="center">

<img src="docs/media/hero.svg" alt="TimeShift — your face across the decades" width="100%">

<p>
  <a href="https://time-shift-eight.vercel.app"><img alt="Live" src="https://img.shields.io/badge/live-step%20into%20the%20past-e8a35b?style=for-the-badge&labelColor=0b0807"></a>
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini-image%20generation-d65f5f?style=for-the-badge&labelColor=0b0807">
  <img alt="React" src="https://img.shields.io/badge/React-Framer%20Motion-7fb3a3?style=for-the-badge&labelColor=0b0807">
  <img alt="Eras" src="https://img.shields.io/badge/eras-1950s%20%E2%86%92%202000s-e8a35b?style=for-the-badge&labelColor=0b0807">
</p>

<p><em>Upload one portrait and watch AI reimagine it as photorealistic vintage polaroids,<br>
from the 1950s to the 2000s, in authentic era-specific style.</em></p>

</div>

<img src="docs/media/divider.svg" width="100%" alt="">

## Features

| | |
|---|---|
| **Decade transformation** | One photo, six eras: the 50s, 60s, 70s, 80s, 90s and 00s. |
| **Interactive polaroids** | Drag the cards around with realistic physics, snapping and soft shadows. |
| **Sound** | Subtle shutter clicks and drag sounds. |
| **Albums** | Grid and collage layouts with vintage and sepia effects, rendered on canvas and downloadable. |
| **GIF and ZIP** | Turn the set into an animated GIF or download every frame. |
| **Sharing** | One-click links with generated Open Graph thumbnails. |
| **Premium UI** | Deep blacks, animated mesh gradients and noise textures, on desktop and mobile. |

```mermaid
flowchart LR
  U[Upload portrait] --> G[Gemini · six era prompts]
  G --> P[Polaroid cards · physics]
  P --> A[Album · canvas FX]
  P --> GIF[gifshot · animated GIF]
  P --> Z[JSZip · all frames]
  P --> S[Share link · OG image]
  P <--> IDB[(IndexedDB · local)]
```

<img src="docs/media/divider.svg" width="100%" alt="">

## Türkçe özet

**TimeShift**, tek bir portre fotoğrafını 1950'lerden 2000'lere altı farklı on yıla ait fotogerçekçi vintage polaroidlere dönüştüren yapay zekâ destekli bir deneyim. Polaroid kartları fizikle sürükleyip dizebilir, sonucu albüm, GIF ya da ZIP olarak indirebilir ve tek tıkla paylaşabilirsin.

<img src="docs/media/divider.svg" width="100%" alt="">

## Development

```sh
npm install
cp .env.example .env.local   # GEMINI_API_KEY
npm run dev                  # Express + Vite
npm run build
```

<div align="center">
<br>
<a href="https://github.com/kutluhangil"><img src="docs/media/signature.svg" width="100%" alt="Built by kutluhangil"></a>
<sub>Same face. Different decade.</sub>
</div>
