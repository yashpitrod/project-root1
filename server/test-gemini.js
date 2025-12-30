import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

const key = process.env.GEMINI_API_KEY;

console.log("--- Diagnostic Check ---");
console.log("Key defined:", !!key);
console.log("Key length:", key ? key.length : 0);
console.log("Key starts with:", key ? key.substring(0, 7) : "N/A");
console.log("Key ends with space?:", key ? key.endsWith(" ") : "N/A");
console.log("------------------------");

async function verify() {
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log("Success! Response:", result.response.text());
    } catch (e) {
        console.error("Final Error Message:", e.message);
    }
}

verify();