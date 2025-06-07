import { researchNetwork } from '@/src/mastra/networks';
import { type Message, type CoreMessage } from 'ai';

// export const runtime = 'edge'; // Edge Runtimeではfs/pathが使えないため、Node.jsランタイムに戻す

export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    const stream = await researchNetwork.stream(messages as CoreMessage[]);

    return stream.toDataStreamResponse();
  } catch (error) {
    console.error('[Multi-Agent Chat Error]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: 'Failed to process request', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
