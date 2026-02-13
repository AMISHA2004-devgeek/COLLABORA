import { NextResponse } from "next/server";
import pdf from "pdf-parse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    let text = "";

    // ✅ If PDF
    if (file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const parsed = await pdf(buffer);
      text = parsed.text;
    } else {
      // ✅ If normal text file
      text = await file.text();
    }

    if (!text || text.length < 20) {
      return NextResponse.json(
        { error: "Could not extract text from file" },
        { status: 400 }
      );
    }

    // 🔥 Send to Groq
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",

          messages: [
            {
              role: "system",
              content:
                "Generate a detailed, structured, large paragraph academic-style summary of this document.",
            },
            {
              role: "user",
              content: text.slice(0, 500), // limit size
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const data = await groqRes.json();
    console.log("GROQ RESPONSE:", JSON.stringify(data, null, 2));


    const summary =
      data.choices?.[0]?.message?.content ||
      "No summary generated.";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
