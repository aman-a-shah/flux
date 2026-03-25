# AI Image Generation Setup

Your quest mode now uses **Pollinations.ai** to generate beautiful, cinematic fantasy images for each quest scene!

## 🚀 **How to Get Started:**

### 1. **Get a Free Pollinations.ai API Key:**
   - Visit [pollinations.ai](https://pollinations.ai)
   - Sign up for a free account
   - Get your API key from the dashboard
   - Copy the API key

### 2. **Add to Your Environment:**
   - Open `.env.local` in your project
   - Replace `your_pollinations_api_key_here` with your real API key:
   ```
   POLLINATIONS_API_KEY=your_actual_api_key_here
   ```

### 3. **Free Tier Benefits:**
   - **Generous free credits** for image generation
   - **Fast generation** using FLUX model
   - **High-quality images** with no watermarks
   - **No usage restrictions** within free limits

## 🎨 **What You'll Get:**

- **Cinematic fantasy art** for every quest scene using **FLUX model**
- **Dynamic scene generation** based on your story content
- **Victory/defeat illustrations** for game endings
- **High-resolution images** (1024x576) optimized for display
- **Professional game art quality** with detailed textures and lighting

## 🔧 **Technical Details:**

- Uses **FLUX model** for best quality and speed
- Generates images with **URL-based API** for fast responses
- **16:9 aspect ratio** perfect for your UI layout
- **Fallback system** if image generation fails
- **API key verification** for authenticated requests

## 🎮 **Experience:**

When you generate a quest, you'll see:
- **Instant image generation** (faster than before)
- **Beautiful FLUX-generated fantasy art** with cinematic quality
- **Seamless integration** with your quest storytelling
- **Immersive atmosphere** that enhances the educational gaming experience

## 📋 **API Reference:**

```javascript
// Check API key validity
const response = await fetch(
  "https://gen.pollinations.ai/account/key",
  { headers: { Authorization: "Bearer YOUR_API_KEY" } },
);
const keyInfo = await response.json();
console.log(`Valid: ${keyInfo.valid}, Type: ${keyInfo.type}`);

// Generate images
const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=576&model=flux`;
```

**Ready to see some magic?** Add your Pollinations.ai API key and start generating stunning quest visuals! ✨