import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { question, summary, chatHistory } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // ✅ Build context with chat history
    let contextPrompt = `Context: ${summary || "No summary available"}\n\n`;
    
    // ✅ Add previous conversation
    if (chatHistory && chatHistory.length > 0) {
      contextPrompt += "Previous conversation:\n";
      chatHistory.forEach((msg: any) => {
        contextPrompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
      });
      contextPrompt += "\n";
    }
    
    contextPrompt += `User's new question: ${question}\n\nProvide a helpful answer based on the context and conversation history:`;

    // ✅ Call Groq API with full context
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant. Answer questions based on the provided context and maintain conversation continuity."
          },
          {
            role: "user",
            content: contextPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("No answer received from AI");
    }

    return NextResponse.json({ answer });

  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate response", details: error.message },
      { status: 500 }
    );
  }
}