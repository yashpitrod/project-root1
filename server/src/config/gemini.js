import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("GEMINI KEY:", process.env.GEMINI_API_KEY);

// 🔹 PURE TRANSLATION ONLY
export const translateToEnglishGemini = async (text) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
Translate the following text into English.
Return ONLY the translated English text.
Do NOT summarize.
Do NOT add explanations.

Text:
${text}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini Translate Error:", error);
    throw new Error("Translation failed");
  }
};
