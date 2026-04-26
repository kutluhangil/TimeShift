import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Increase payload limit because base64 images can be quite large
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Ensure the shares directory exists
  const sharesDir = path.join(process.cwd(), 'shares');
  if (!fs.existsSync(sharesDir)) {
      fs.mkdirSync(sharesDir);
  }

  // API Route to save a shareable image
  app.post("/api/share", (req, res) => {
    try {
      const { imageParams, type, thumbnail } = req.body;
      
      if (!imageParams) {
        return res.status(400).json({ error: "No image provided" });
      }

      const id = uuidv4();
      const filePath = path.join(sharesDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify({ imageParams, type, thumbnail }));

      res.json({ id, url: `/share/${id}` });
    } catch (err) {
      console.error("Error creating share", err);
      res.status(500).json({ error: "Error handling share request" });
    }
  });

  // API Route to retrieve a shareable image
  app.get("/api/share/:id", (req, res) => {
    try {
        const id = req.params.id;
        const filePath = path.join(sharesDir, `${id}.json`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "Share not found" });
        }

        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        res.json(data);
    } catch (err) {
        console.error("Error retrieving share", err);
        res.status(500).json({ error: "Error retrieving share request" });
    }
  });

  // API Route to retrieve the raw image for a share
  app.get("/api/share/:id/image", (req, res) => {
    try {
        const id = req.params.id;
        const filePath = path.join(sharesDir, `${id}.json`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).send("Share not found");
        }

        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        
        // Extract base64
        const base64Data = data.imageParams.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");
        
        res.writeHead(200, {
          'Content-Type': 'image/jpeg',
          'Content-Length': imageBuffer.length
        });
        res.end(imageBuffer);
    } catch (err) {
        console.error("Error retrieving preview image", err);
        res.status(500).send("Error reading image data");
    }
  });

  // API Route to retrieve the thumbnail for a share (used for OG tags)
  app.get("/api/share/:id/thumbnail", (req, res) => {
    try {
        const id = req.params.id;
        const filePath = path.join(sharesDir, `${id}.json`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).send("Share not found");
        }

        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        
        // Use thumbnail if available, otherwise original image
        const imgData = data.thumbnail || data.imageParams;
        const base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");
        
        res.writeHead(200, {
          'Content-Type': 'image/jpeg',
          'Content-Length': imageBuffer.length
        });
        res.end(imageBuffer);
    } catch (err) {
        console.error("Error retrieving thumbnail image", err);
        res.status(500).send("Error reading image data");
    }
  });

  // OpenGraph SSR for bots or regular request interception
  app.get('/share/:id', async (req, res, next) => {
    // If it's a request from a known bot (Twitter, Facebook, Discord, Slack, etc.) 
    // we could serve it immediately, but actually it's fine to just inject the OG tags 
    // into the index.html for all requests to /share/:id

    const id = req.params.id;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;
    const imageUrl = `${protocol}://${host}/api/share/${id}/thumbnail`;

    try {
        let template = '';
        if (process.env.NODE_ENV !== "production") {
            // Read from dev source
            template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
            // Normally vite transformIndexHtml is used, but for simple OG tags this is enough
        } else {
            template = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf-8');
        }

        const ogTags = `
        <meta property="og:title" content="TimeShift - My Time Machine Journey" />
        <meta property="og:description" content="Check out my generation through the decades!" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:url" content="${fullUrl}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${imageUrl}" />
        <meta name="twitter:title" content="TimeShift - My Time Machine Journey" />
        <meta name="twitter:description" content="Check out my generation through the decades!" />
        `;

        // Inject before </head>
        const html = template.replace('</head>', `${ogTags}\n</head>`);

        if (process.env.NODE_ENV !== "production") {
            // Because Vite middleware processes index.html if we don't intercept it, 
            // we have to intercept it but STILL use Vite's transform to get the right module injections.
            // But wait! We can just use the vite transformIndexHtml.
            next();
        } else {
            res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        }
    } catch (e) {
        next(e);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
