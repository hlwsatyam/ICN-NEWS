import OpenAI from 'openai';

// Emergent Universal LLM Gateway (OpenAI-compatible)
const client = new OpenAI({
  apiKey: process.env.EMERGENT_LLM_KEY,
  baseURL: 'https://integrations.emergentagent.com/llm'
});

export async function generateText(prompt, system = 'You are a helpful assistant.') {
  try {
    const r = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    return r.choices[0]?.message?.content || '';
  } catch (e) {
    console.error('LLM error:', e.message);
    throw e;
  }
}
