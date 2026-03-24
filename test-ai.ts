import { generateModeContent } from './src/lib/ai.js';

async function testGeneration() {
  console.log('Testing AI generation fixes...');

  try {
    // Test with a simple prompt
    const result = await generateModeContent('notes', 'Machine Learning', 3, 'This is a test document about machine learning.');
    console.log('Success! Generated content:', typeof result.result === 'string' ? result.result.substring(0, 200) + '...' : result.result);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

testGeneration();