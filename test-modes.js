import { generateModeContent } from './src/lib/ai.js';

async function testModes() {
  console.log('Testing all study modes...\n');

  const modes = ['notes', 'flashcards', 'quiz', 'quest', 'visual', 'podcast'];
  const topic = 'Machine Learning';
  const fileContent = 'Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed. It involves algorithms that can identify patterns in data and make predictions or decisions.';

  for (const mode of modes) {
    try {
      console.log(`Testing ${mode}...`);
      const result = await generateModeContent(mode as any, topic, 3, fileContent);
      const content = typeof result.result === 'string' ? result.result : JSON.stringify(result.result);
      console.log(`✅ ${mode}: ${content.substring(0, 100)}...\n`);
    } catch (error) {
      console.log(`❌ ${mode}: Error - ${error}\n`);
    }
  }
}

testModes();