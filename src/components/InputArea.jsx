import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { analyzeExpense } from '../lib/gemini';

const InputArea = ({ onExpensesFound, accentColor }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const results = await analyzeExpense(text);
    if (results && results.length > 0) {
      onExpensesFound(results);
      setText("");
    }
    setLoading(false);
  };

  return (
    <div className="relative flex flex-col gap-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ej: Cobré mi salario de 2000 y pagué 50 de internet..."
        className={`w-full p-5 rounded-3xl border outline-none focus:ring-2 transition-all h-36 md:h-32 resize-none text-sm leading-relaxed ${
          // Cambiamos bg-slate-50 por bg-white para que sea realmente blanco en modo claro
          "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
        }`}
        style={{ '--tw-ring-color': accentColor }}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        style={{ 
          backgroundColor: loading ? '#cbd5e1' : accentColor,
          boxShadow: `0 10px 15px -3px ${accentColor}33` 
        }}
        className="w-full md:w-auto md:absolute md:bottom-4 md:right-4 flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 hover:brightness-110 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
        ) : (
          <>
            <Sparkles size={18} />
            <span>Analizar con IA</span>
          </>
        )}
      </button>
    </div>
  );
};

export default InputArea;