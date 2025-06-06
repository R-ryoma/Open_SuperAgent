import { mastra } from '@/src/mastra'; // Import mastra instance
// import { streamText, experimental_streamText } from 'ai'; // experimental_streamText removed
// import { streamText } from 'ai'; // Only import streamText

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Get the masterControlNetwork
    const network = mastra.getNetwork('masterControlNetwork');
    if (!network) {
      console.error('[API CHAT ROUTE] Network "masterControlNetwork" not found.');
      return new Response(JSON.stringify({ error: 'Network not found.' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Get the stream from the network
    const stream = await network.stream(messages);

    // Return the network's stream as a DataStreamResponse
    return stream.toDataStreamResponse();

  } catch (error) {
    console.error('[API CHAT ROUTE] Error:', error);
    // You might want to return a more structured error response
    return new Response(JSON.stringify({ error: 'An error occurred while processing your request.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 