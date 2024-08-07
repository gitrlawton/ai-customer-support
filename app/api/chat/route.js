import { NextResponse } from "next/server";
import OpenAI from "openai";

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
`;

// This backend is made up of 3 simple steps/parts:
// 1. Create your completion.
// 2. Once you have the completion, you begin streaming it.
// 3. Then, return the stream.

// Note: await means it doesn't hold up your code while it waits for a response.
// This means, multiple requests can be sent at the same time.

export async function POST(req) {
    const openai = new OpenAI()
    // Extract the data from the request.
    const data = await req.json()

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: systemPrompt,
            },
            // Spread operator to get the rest of our messages.
            ...data,
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()

            try {
                for await (const chunk of completion) {
                    // ? are used to make sure it exists before trying to chain.
                    const content = chunk.choices[0]?.delta?.content

                    if (content) {
                        const text = encoder.encode(content)

                        controller.enqueue(text)
                    }
                }
            }
            catch (error) {
                controller.error(error)
            }
            finally {
                // Close our controller.
                controller.close()
            }
        }
    })

    // Send the stream.
    return new NextResponse(stream)
}
