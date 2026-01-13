import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true 
});

// Función para extraer gastos (la que ya tenías)
export const analyzeExpense = async (text) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres un extractor de datos financieros. Responde con un array JSON: [{"category": "comida", "amount": -10, "label": "pizza"}]. Gastos negativos, ingresos positivos.`
        },
        { role: "user", content: text }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });
    const parsed = JSON.parse(chatCompletion.choices[0].message.content);
    if (Array.isArray(parsed)) return parsed;
    const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
    return key ? parsed[key] : (parsed.amount ? [parsed] : []);
  } catch (error) { return []; }
};

//función getFinancialAdvice para obtener consejos financieros
export const getFinancialAdvice = async (history, balance, topic) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Eres un asesor financiero experto. Analiza el historial y el balance del usuario basándote en el TEMA específico que te pida. Da un consejo corto, directo y accionable."
        },
        {
          role: "user",
          content: `TEMA DE CONSULTA: ${topic}. 
                    SALDO ACTUAL: ${balance}. 
                    HISTORIAL: ${JSON.stringify(history.slice(-10))}`
        }
      ],
      model: "llama-3.1-8b-instant", 
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    return "No pude conectar con el asesor. Intenta de nuevo.";
  }
};