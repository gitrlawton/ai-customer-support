import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { BedrockEmbeddings } from "@langchain/aws";
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { NextResponse } from "next/server";

// Get the embeddings from the knowledge base at AWS Bedrock.
const embeddings = new BedrockEmbeddings({
    region: "us-west-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    model: "amazon.titan-embed-text-v1",
});

// Create a new instance of Pincecone.
const pinecone = new PineconeClient();

// Helper function to generate the context for our model.
async function getContext(query) {
    // Collect the vector data from our Pinecone Index.
    const vectorStore = await pinecone.Index(process.env.PINECONE_INDEX_NAME);
    // Take our query parameter and embed it into a vector.
    const queryEmbedding = await embeddings.embedQuery(query);
    // Search the vector data for the embedded query.
    const results = await vectorStore.query({
        vector: queryEmbedding,
        topK: 3, 
        includeMetadata: true,
    });
    // Extract the text from the metadata of each result and join them into a single 
    // string, separated by new lines.  This is our context.
    return results.matches.map(match => match.metadata.text).join("\n");
}

const systemPrompt = `
You are an AI-powered customer support bot for Headstarter AI, a platform that provides AI-based interview questions to practice for software engineering interviews.

Your goal is to assist users by providing accurate information, answering questions, and resolving issues related to their use of Headstarter AI.

1. **Welcome and Introduction:**
   - Greet the user politely and introduce yourself as a Headstarter AI support bot.
   - Offer assistance by asking how you can help them with their software engineering interview practice.

2. **Identify the User's Needs:**
   - Ask clarifying questions to understand the user's specific issue or question.
   - Determine whether the user needs help with accessing the platform, understanding features, troubleshooting technical issues, or general inquiries about the services offered.

3. **Provide Information and Solutions:**
   - Offer clear and concise explanations or solutions based on the user's needs.
   - If the user is unfamiliar with Headstarter AI's features, provide an overview of key offerings such as practice interview questions, feedback mechanisms, and subscription details.
   - Troubleshoot technical issues by guiding the user through common steps such as checking internet connectivity, clearing cache, or updating the browser.

4. **Escalate if Necessary:**
   - If you are unable to resolve the issue, offer to escalate the matter to a human support agent.
   - Provide contact information or a ticketing system link if applicable.

5. **Follow-Up and Closure:**
   - Confirm that the user’s issue has been resolved or their question answered to their satisfaction.
   - Thank the user for reaching out and encourage them to return if they need further assistance.
   - End the conversation politely.

6. **Feedback and Improvement:**
   - Ask if the user has any feedback about their support experience.
   - Record feedback for continuous improvement of the support service.

Keep interactions friendly, professional, and focused on delivering helpful assistance to ensure a positive experience for Headstarter AI users.

Important: Use no more than 200 words.
`;

// This backend is made up of 3 simple steps/parts:
// 1. Create your completion.
// 2. Once you have the completion, you begin streaming it.
// 3. Then, return the stream.

// Note: await means it doesn't hold up your code while it waits for a response.
// This means, multiple requests can be sent at the same time.

export async function POST(req) {
    const bedrockClient = new BedrockRuntimeClient({
        region: "us-west-2",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });

    try {
        const data = await req.json();
        const lastMessage = data[data.length - 1].content;
        const context = await getContext(lastMessage);

        const messages = [
            { role: "human", content: "System: " + systemPrompt },
            { role: "human", content: "Context: " + context },
            ...data.map(msg => ({
                role: msg.role === "user" ? "human" : "assistant",
                content: msg.content
            }))
        ];

        const command = new InvokeModelWithResponseStreamCommand({
            modelId: "anthropic.claude-v2",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                prompt: formatMessages(messages),
                max_tokens_to_sample: 300,
                temperature: 0.7,
                top_k: 250,
                top_p: 0.999,
            })
        });

        const response = await bedrockClient.send(command);

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                try {
                    for await (const chunk of response.body) {
                        const chunkContent = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk.chunk?.bytes);
                        const jsonChunk = JSON.parse(chunkContent);
                        const content = jsonChunk.completion;

                        if (content) {
                            const text = encoder.encode(content);
                            controller.enqueue(text);
                        }
                    }
                } catch (error) {
                    console.error("Error processing chunk:", error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream);
    } catch (error) {
        console.error("API route error:", error);
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function formatMessages(messages) {
    return messages.map(msg => 
        `${msg.role === 'human' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n\n') + '\n\nAssistant:';
}