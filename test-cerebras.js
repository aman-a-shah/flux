import { generateModeContent } from './src/lib/ai.ts';

async function testCerebras() {
  console.log('Testing Cerebras integration...\n');

  try {
    console.log('Testing notes mode...');
    const result = await generateModeContent('notes', 'Machine Learning', 3, 'Machine learning is a subset of AI that enables computers to learn from data.');
    console.log('✅ Success! Response length:', result.result?.toString().length);
    console.log('First 200 chars:', result.result?.toString().substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testCerebras();