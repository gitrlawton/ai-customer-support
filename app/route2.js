// This file is the backend.

import { NextResponse } from "next/server";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

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

    const bedrockClient = new BedrockRuntimeClient(
        { 
            region: "us-west-2", 
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        }
    );
    // Extract the data from the request.
    try {
        const data = await req.json();

        // Convert the system prompt to a user message
        const messages = [
            { role: "user", content: systemPrompt },
            ...data.map(msg => ({
                role: msg.role === "user" ? "user" : "assistant",
                content: msg.content
            }))
        ];

        const command = new InvokeModelCommand({
            modelId: "anthropic.claude-3-haiku-20240307-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 300,
                messages: messages,
                temperature: 0.7,
                top_k: 250,
                top_p: 0.999,
            })
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        return NextResponse.json(responseBody);
    } 
    catch (error) {
        console.error("API route error:", error);
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
