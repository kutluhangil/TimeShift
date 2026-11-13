<div align="center">

<img src="docs/media/hero.svg" alt="TimeShift — one portrait develops into ten polaroids from the 1920s to the 2010s" width="100%">

<p>
  <a href="https://time-shift-eight.vercel.app"><img alt="Live" src="https://img.shields.io/badge/live-take%20a%20trip-e8a35b?style=for-the-badge&labelColor=5a3b2b"></a>
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini%202.5%20Flash-image-d65f5f?style=for-the-badge&labelColor=5a3b2b">
  <img alt="React" src="https://img.shields.io/badge/React%2019-Framer%20Motion-7fb3a3?style=for-the-badge&labelColor=5a3b2b">
  <img alt="Eras" src="https://img.shields.io/badge/eras-1920s%20%E2%86%92%202010s-e8a35b?style=for-the-badge&labelColor=5a3b2b">
</p>

<p><em>Upload one portrait and see yourself across a century: ten photorealistic polaroids,<br>
from a 1920s flapper to a 2010s phone snap, to arrange, collect and share.</em></p>

</div>

<img src="docs/media/divider.svg" width="100%" alt="">

## The idea

A time machine you can hold. TimeShift takes a single photo, works out what makes the face *yours*, and then imagines you living in each decade of the last hundred years: the clothes, the hair, the film stock and the light of the era, with your face kept. The results land on the table as polaroids you can push around like real prints.

> **Identity first.** Before any image is made, Gemini describes the person's features in the uploaded photo. That description travels with every decade prompt, so the 1940s you and the 1990s you are recognisably the same person.

<img src="docs/media/divider.svg" width="100%" alt="">

## Features

| | |
|---|---|
| **Ten eras** | 1920s flapper, 1930s Great Depression, 1940s wartime, 1950s classic, 1960s psychedelic, 1970s disco, 1980s neon, 1990s grunge, 2000s Y2K and 2010s early digital. |
| **Identity lock** | A feature analysis of your photo (Gemini 2.5 Flash) is added to every era prompt. |
| **One at a time** | Decades are generated in sequence to stay under rate limits, each card developing as it arrives. |
| **Regenerate** | Not happy with one era? Re-roll just that card. |
| **Draggable polaroids** | Pick up, move and drop the prints with Framer Motion physics and soft shadows. |
| **Sound** | Shutter, upload, success and regenerate sounds, with a mute switch. |
| **Albums** | Grid and collage pages rendered on canvas with none, vintage, black-and-white or sepia effects, ready to download. |
| **GIF and ZIP** | Turn the set into an animated GIF or download every frame in a ZIP. |
| **Share links** | Save a result and get a `/share/:id` page with its own Open Graph image and title. |
| **Fast uploads** | Large photos are downsampled with WebGL before they are sent. |
| **Saved locally** | Results are kept in IndexedDB, so a refresh does not lose your trip. |

<img src="docs/media/divider.svg" width="100%" alt="">

## How it fits together

```mermaid
flowchart LR
  U[Portrait] --> DS[WebGL downsample]
  DS --> AN[Gemini 2.5 Flash<br/>describe the features to keep]
  AN --> GEN[Gemini 2.5 Flash Image<br/>one prompt per era · in sequence]
  GEN --> P[Polaroid cards<br/>drag · regenerate]
  P <--> IDB[(IndexedDB)]
  P --> AL[Album · canvas effects]
  P --> GIF[gifshot · GIF]
  P --> Z[JSZip · all frames]
  P --> SH[/api/share → /share/:id<br/>OG image/]
```

<img src="docs/media/divider.svg" width="100%" alt="">

## Türkçe özet

**TimeShift**, tek bir portre fotoğrafını 1920'lerden 2010'lara on farklı döneme ait fotogerçekçi polaroidlere dönüştüren bir deneyim. Önce Gemini yüzünün korunacak özelliklerini çıkarıyor, sonra her dönem için seni o yılların kıyafeti, saçı ve film dokusuyla yeniden çiziyor. Polaroidleri masada sürükleyebilir, beğenmediğin dönemi yeniden üretebilir, sonucu albüm, GIF ya da ZIP olarak indirebilir ve kendi önizleme görseli olan bir bağlantıyla paylaşabilirsin.

<img src="docs/media/divider.svg" width="100%" alt="">

## Development

```sh
npm install
cp .env.example .env.local   # VITE_GEMINI_API_KEY
npm run dev                  # Express (share routes) + Vite
npm run build
```

The Gemini key is read on the client as `VITE_GEMINI_API_KEY`; restrict it to your domain in Google AI Studio. The Express server stores shared results in `shares/` and renders their Open Graph tags. `DEPLOYMENT.md` covers Vercel.

```
App.tsx              upload, the decade queue, the polaroid table
components/          landing, polaroid card, share view
services/            geminiService: feature analysis and per-era generation
lib/                 album rendering, GIF, ZIP, WebGL downsample, sounds
server.ts            share API and OG pages
```

<div align="center">
<br>
<a href="https://github.com/kutluhangil"><img src="docs/media/signature.svg" width="100%" alt="Built by kutluhangil"></a>
<sub>All rights reserved · the faces in the banner are drawn placeholders, not real people.</sub>
</div>
