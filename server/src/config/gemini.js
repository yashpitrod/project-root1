import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const summarizeText = async (text) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
Translate the following text into English and summarize it in one short sentence.
Do NOT give medical advice or diagnosis.

Text:
${text}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();

  } catch (error) {
    console.error("Gemini error:", error);
    return "Summary unavailable";
  }
};
