import { translateToEnglishGemini } from "../config/gemini.js";

export const translateToEnglish = async (text) => {
  return await translateToEnglishGemini(text);
};
