import "dotenv/config";

async function run() {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });
    const data = await response.json();
    console.log("Available Groq models:");
    data.data.forEach(model => console.log(model.id));
  } catch(e) {
    console.error(e);
  }
}
run();
