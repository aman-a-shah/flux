import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, sceneType } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Enhanced prompt for better quest scene generation
    const enhancedPrompt = `Create a highly detailed, cinematic fantasy illustration for a quest game scene: ${prompt}.
    Style: digital art, vibrant colors, dramatic lighting, high fantasy, detailed textures,
    atmospheric perspective, magical elements, professional game art quality, 8k resolution,
    intricate details, immersive world-building. No text, no UI elements, pure scene illustration.`;

    // Use Pollinations.ai for image generation
    // They have a simple URL-based API: https://image.pollinations.ai/prompt/{encoded_prompt}
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=576&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;

    // For Pollinations.ai, we can optionally verify the API key
    if (process.env.POLLINATIONS_API_KEY) {
      try {
        const keyCheckResponse = await fetch(
          "https://gen.pollinations.ai/account/key",
          {
            headers: {
              Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`
            }
          }
        );

        if (keyCheckResponse.ok) {
          const keyInfo = await keyCheckResponse.json();
          if (!keyInfo.valid) {
            console.warn('Pollinations API key is invalid');
          }
        }
      } catch (error) {
        console.warn('Failed to verify Pollinations API key:', error);
      }
    }

    return NextResponse.json({
      imageUrl,
      prompt: enhancedPrompt,
      sceneType
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}