import React, { useState, useEffect, useRef } from 'react';
import {
    Wallet, PlusCircle, Trash2, TrendingUp, TrendingDown,
    Target, Sparkles, Calendar, MessageSquare, Sun,
    Moon, LineChart as ChartIcon, Bell, Check, Download, Coins, Palette, Menu, X, Edit3, CreditCard, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import * as XLSX from 'xlsx';
import InputArea from './components/InputArea';
import { getFinancialAdvice } from './lib/gemini';
import confetti from 'canvas-confetti';

const CURRENCIES = [
    { symbol: '$', code: 'USD', country: 'EE.UU.' }, { symbol: '€', code: 'EUR', country: 'Europa' },
    { symbol: 'MXN', code: 'MXN', country: 'México' }, { symbol: '¥', code: 'JPY', country: 'Japón' },
    { symbol: '£', code: 'GBP', country: 'Reino Unido' }, { symbol: '₡', code: 'CRC', country: 'Costa Rica' },
    { symbol: 'S/', code: 'PEN', country: 'Perú' }, { symbol: 'Bs', code: 'BOB', country: 'Bolivia' },
    { symbol: 'R$', code: 'BRL', country: 'Brasil' }, { symbol: '₩', code: 'KRW', country: 'Corea del Sur' }
];

const THEMES = [
    { name: 'Azul', color: '#3b82f6' }, { name: 'Morado', color: '#8b5cf6' },
    { name: 'Rosa', color: '#ec4899' }, { name: 'Naranja', color: '#f97316' }, { name: 'Esmeralda', color: '#10b981' },
];

function App() {
    const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('expenses')) || []);
    const [initialBalance, setInitialBalance] = useState(() => Number(localStorage.getItem('initialBalance')) || 0);
    const [goals, setGoals] = useState(() => JSON.parse(localStorage.getItem('goals')) || []);
    const [subscriptions, setSubscriptions] = useState(() => JSON.parse(localStorage.getItem('subscriptions')) || []);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [currency, setCurrency] = useState(() => JSON.parse(localStorage.getItem('currency')) || CURRENCIES[0]);
    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || '#3b82f6');
    const [advice, setAdvice] = useState("");
    const [adviceTopic, setAdviceTopic] = useState("");
    const [loadingAdvice, setLoadingAdvice] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPcSettingsOpen, setIsPcSettingsOpen] = useState(false);
    const settingsRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('expenses', JSON.stringify(expenses));
        localStorage.setItem('initialBalance', initialBalance.toString());
        localStorage.setItem('goals', JSON.stringify(goals));
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('currency', JSON.stringify(currency));
        localStorage.setItem('accentColor', accentColor);
    }, [expenses, initialBalance, goals, subscriptions, darkMode, currency, accentColor]);

    // Cerrar menú de PC al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setIsPcSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentBalance = initialBalance + expenses.reduce((sum, item) => sum + item.amount, 0);

    const formatMoney = (amount) => {
        const value = Math.abs(amount).toLocaleString();
        return amount < 0 ? `-${currency.symbol}${value}` : `${currency.symbol}${value}`;
    };

    // --- LÓGICA DE SALDO ---
    const adjustInitialBalance = () => {
        const newVal = prompt("¿Cuál es tu saldo actual de partida?", initialBalance);
        if (newVal !== null && !isNaN(newVal)) {
            setInitialBalance(Number(newVal));
            confetti({ particleCount: 30, spread: 50 });
        }
    };

    // --- LÓGICA DE GASTOS Y EDICIÓN ---
    const handleNewItems = (items) => {
        const today = new Date();
        // Formato estándar DD/MM/YYYY
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

        const itemsWithDate = items.map(item => ({
            ...item,
            date: dateStr,
            id: Date.now() + Math.random()
        }));
        setExpenses([...expenses, ...itemsWithDate]);
    };

    const deleteExpense = (id) => setExpenses(expenses.filter(e => e.id !== id));

    const clearActivity = () => {
        if (window.confirm("¿Borrar todo el historial de actividad?")) {
            setExpenses([]);
            confetti({ particleCount: 40, spread: 50 });
        }
    };

    const editExpense = (id) => {
        const item = expenses.find(e => e.id === id);
        const newLabel = prompt("Editar descripción:", item.label);
        const newAmount = prompt("Editar monto (negativo para gastos):", item.amount);
        if (newLabel && !isNaN(newAmount)) {
            setExpenses(expenses.map(e => e.id === id ? { ...e, label: newLabel, amount: Number(newAmount) } : e));
        }
    };

    // --- LÓGICA DE SUSCRIPCIONES ---
    const editSubscription = (sub) => {
        const newName = prompt("Editar nombre del servicio:", sub.name);
        const newCost = prompt("Editar costo mensual:", sub.cost);
        if (newName && !isNaN(newCost)) {
            setSubscriptions(subscriptions.map(s =>
                s.id === sub.id ? { ...s, name: newName, cost: Number(newCost) } : s
            ));
        }
    };

    const addSubscription = () => {
        const name = prompt("Nombre del servicio (ej: Netflix):");
        const cost = prompt("Costo mensual:");
        if (name && !isNaN(cost)) {
            setSubscriptions([...subscriptions, { id: Date.now(), name, cost: Number(cost) }]);
        }
    };

    const paySubscription = (sub) => {
        handleNewItems([{ label: `Pago ${sub.name}`, amount: -sub.cost, category: 'Suscripciones' }]);
        confetti({ particleCount: 40, colors: [accentColor, '#ffffff'] });
    };

    const deleteSubscription = (id) => setSubscriptions(subscriptions.filter(s => s.id !== id));

    // --- LÓGICA DE METAS ---
    const editGoal = (goal) => {
        const newName = prompt("Editar nombre de la meta:", goal.name);
        const newTarget = prompt("Editar monto objetivo:", goal.target);
        if (newName && !isNaN(newTarget)) {
            setGoals(goals.map(g =>
                g.id === goal.id ? { ...g, name: newName, target: Number(newTarget) } : g
            ));
        }
    };

    const toggleGoal = (id) => {
        const goal = goals.find(g => g.id === id);

        // Si la meta NO está completada y queremos completarla
        if (!goal.completed) {
            // Validación de saldo suficiente
            if (currentBalance < goal.target) {
                alert(`Saldo insuficiente. Te faltan ${formatMoney(goal.target - currentBalance)} para cumplir esta meta.`);
                return;
            }

            // 1. Marcamos como completada
            setGoals(goals.map(g => g.id === id ? { ...g, completed: true } : g));

            // 2. Creamos un gasto automático vinculado a esta meta
            const completionExpense = {
                label: `Meta Cumplida: ${goal.name}`,
                amount: -goal.target,
                category: 'Metas',
                goalId: id // Importante para poder revertirlo luego
            };
            handleNewItems([completionExpense]);

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: [accentColor, '#10b981', '#ffffff']
            });

        } else {
            // Si ya estaba completada y el usuario la desmarca (REVERTIR)
            if (window.confirm("¿Quieres revertir esta meta? El dinero se devolverá a tu saldo y se borrará el registro del gasto.")) {
                // 1. Desmarcamos la meta
                setGoals(goals.map(g => g.id === id ? { ...g, completed: false } : g));

                // 2. Buscamos y eliminamos el gasto que se generó automáticamente
                setExpenses(expenses.filter(e => e.goalId !== id));
            }
        }
    };

    const deleteGoal = (id) => setGoals(goals.filter(g => g.id !== id));

    const exportToExcel = () => {
        const historyData = expenses.map(e => ({
            Fecha: e.date, Descripción: e.label, Categoría: e.category, Monto: e.amount, Tipo: e.amount > 0 ? 'Ingreso' : 'Gasto'
        }));
        const wb = XLSX.utils.book_new();
        const wsHistory = XLSX.utils.json_to_sheet(historyData);
        XLSX.utils.book_append_sheet(wb, wsHistory, "Historial");
        XLSX.writeFile(wb, `Reporte_${currency.code}_${new Date().toLocaleDateString()}.xlsx`);
        confetti({ particleCount: 100, spread: 70 });
    };

    const groupedExpenses = expenses.reduce((groups, expense) => {
        const date = expense.date || "Antiguos";
        if (!groups[date]) groups[date] = [];
        groups[date].push(expense);
        return groups;
    }, {});

    // --- LÓGICA DEL GRÁFICO CORREGIDA ---
    // Usamos useMemo para que no procese datos cada vez que muevas el mouse
    const chartData = React.useMemo(() => {
        // 1. Ordenamos por fecha (de más antigua a más reciente)
        const sortedExpenses = [...expenses].sort((a, b) => {
            const [dayA, monthA, yearA] = a.date.split('/').map(Number);
            const [dayB, monthB, yearB] = b.date.split('/').map(Number);
            return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
        });

        // 2. Calculamos el acumulado empezando desde el saldo inicial
        let runningBalance = initialBalance;
        const data = sortedExpenses.map((curr) => {
            runningBalance += curr.amount;
            return {
                name: curr.label.substring(0, 10),
                balance: runningBalance
            };
        });

        // 3. El punto de inicio del gráfico
        return [{ name: 'Inicio', balance: initialBalance }, ...data];
    }, [expenses, initialBalance]);

    return (
        <div className={`${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} min-h-screen transition-colors duration-500 font-sans`}>

            {/* --- SIDEBAR MÓVIL --- */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`fixed right-0 top-0 h-full w-[280px] z-[70] shadow-2xl p-6 lg:hidden ${darkMode ? 'bg-slate-900 border-l border-slate-800' : 'bg-white'}`}>
                            <div className="flex justify-between items-center mb-8">
                                <span className="font-black text-sm uppercase opacity-50 tracking-widest">Configuración</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2"><X /></button>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold opacity-50 uppercase flex items-center gap-2"><Wallet size={14} /> Saldo Inicial</label>
                                    <button onClick={adjustInitialBalance} className={`w-full p-3 rounded-xl border text-base font-bold flex justify-between items-center ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                                        <span>{currency.symbol}{initialBalance}</span>
                                        <PlusCircle size={14} style={{ color: accentColor }} />
                                    </button>
                                </div>
                                {/* --- SECCIÓN DE CONFIGURACIÓN EN EL SIDEBAR --- */}
                                <div className="space-y-6">
                                    {/* Selector de Moneda Visual */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold opacity-50 uppercase tracking-widest flex items-center gap-2">
                                            <Coins size={14} /> Seleccionar Divisa
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {CURRENCIES.map(c => (
                                                <button
                                                    key={c.code}
                                                    onClick={() => setCurrency(c)}
                                                    style={{ 
                                                        borderColor: currency.code === c.code ? accentColor : 'transparent',
                                                        backgroundColor: currency.code === c.code ? `${accentColor}15` : (darkMode ? '#1e293b' : '#f1f5f9')
                                                    }}
                                                    className="flex flex-col items-center p-3 rounded-2xl border-2 transition-all hover:scale-105"
                                                >
                                                    <span className="text-xl font-black" style={{ color: currency.code === c.code ? accentColor : 'inherit' }}>
                                                        {c.symbol}
                                                    </span>
                                                    <span className="text-xs font-bold opacity-60">{c.code}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Botón de Modo Oscuro Corregido */}
                                    <button 
                                        onClick={() => setDarkMode(!darkMode)} 
                                        style={{ 
                                            backgroundColor: darkMode ? `${accentColor}20` : '#f1f5f9',
                                            color: darkMode ? accentColor : '#64748b'
                                        }}
                                        className="flex items-center justify-between w-full p-4 rounded-2xl transition-all active:scale-95 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                                            <span className="font-bold text-base">Interfaz {darkMode ? 'Clara' : 'Oscura'}</span>
                                        </div>
                                        <div 
                                            style={{ backgroundColor: darkMode ? accentColor : '#cbd5e1' }}
                                            className="w-10 h-5 rounded-full relative transition-colors"
                                        >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${darkMode ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold opacity-50 uppercase flex items-center gap-2"><Palette size={14} /> Tema</label>
                                    <div className="flex flex-wrap gap-2">
                                        {THEMES.map(t => (
                                            <button key={t.name} onClick={() => setAccentColor(t.color)} className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm" style={{ backgroundColor: t.color }} />
                                        ))}
                                    </div>
                                </div>
                                <button onClick={exportToExcel} className="flex items-center gap-3 w-full p-3 rounded-xl bg-blue-500/10 text-blue-500 font-bold text-base">
                                    <Download size={20} /> Exportar Reporte
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                {/* HEADER CON ALERTA DE SALDO */}
                <header className="flex justify-between items-center sticky top-0 z-50 py-2 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div style={{ backgroundColor: accentColor }} className="p-3 rounded-2xl text-white shadow-lg transition-all"><Wallet /></div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase hidden sm:block">FinanceAI</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={adjustInitialBalance} className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-2 px-5 rounded-2xl border shadow-sm group transition-all active:scale-95`}>
                            <p className="text-[9px] font-black opacity-50 uppercase text-center tracking-widest leading-tight group-hover:text-blue-500 transition-colors">Saldo Total</p>
                            <h2 className={`text-2xl md:text-3xl font-black leading-tight ${currentBalance < 0 ? 'text-rose-500 animate-pulse' : ''}`}>
                                {formatMoney(currentBalance)}
                            </h2>
                        </button>
                        <div className="hidden lg:flex items-center gap-3">
                            <div className="relative" ref={settingsRef}>
                                <button 
                                    onClick={() => setIsPcSettingsOpen(!isPcSettingsOpen)}
                                    className={`p-3 rounded-2xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                                >
                                    <Settings size={20} style={{ color: isPcSettingsOpen ? accentColor : 'inherit' }} />
                                </button>
                                
                                <AnimatePresence>
                                    {isPcSettingsOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            exit={{ opacity: 0, y: 10 }}
                                            className={`absolute right-0 mt-3 p-6 rounded-[2rem] border shadow-2xl z-[100] min-w-[280px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
                                        >
                                            <div className="space-y-6">
                                                {/* MONEDA */}
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black opacity-40 uppercase tracking-widest flex items-center gap-2">
                                                        <Coins size={14} /> Divisa
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {CURRENCIES.map(c => (
                                                            <button
                                                                key={c.code}
                                                                onClick={() => setCurrency(c)}
                                                                style={{ 
                                                                    borderColor: currency.code === c.code ? accentColor : 'transparent',
                                                                    backgroundColor: currency.code === c.code ? `${accentColor}15` : (darkMode ? '#1e293b' : '#f1f5f9')
                                                                }}
                                                                className="flex flex-col items-center p-2 rounded-xl border-2 transition-all hover:scale-105"
                                                            >
                                                                <span className="text-sm font-black" style={{ color: currency.code === c.code ? accentColor : 'inherit' }}>
                                                                    {c.symbol}
                                                                </span>
                                                                <span className="text-[8px] font-bold opacity-50 uppercase">{c.code}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* COLORES */}
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black opacity-40 uppercase tracking-widest flex items-center gap-2">
                                                        <Palette size={14} /> Colores
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {THEMES.map(t => (
                                                            <button
                                                                key={t.name}
                                                                onClick={() => setAccentColor(t.color)}
                                                                className={`w-8 h-8 rounded-full border-4 transition-transform hover:scale-110 ${accentColor === t.color ? 'border-white dark:border-slate-700 shadow-lg' : 'border-transparent'}`}
                                                                style={{ backgroundColor: t.color }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* MODO OSCURO */}
                                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                                    <button 
                                                        onClick={() => setDarkMode(!darkMode)}
                                                        style={{ backgroundColor: darkMode ? `${accentColor}20` : '#f1f5f9', color: darkMode ? accentColor : '#64748b' }}
                                                        className="flex items-center justify-between w-full p-3 rounded-2xl transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                                                            <span className="font-bold text-[10px]">Modo {darkMode ? 'Claro' : 'Oscuro'}</span>
                                                        </div>
                                                        <div style={{ backgroundColor: darkMode ? accentColor : '#cbd5e1' }} className="w-8 h-4 rounded-full relative">
                                                            <motion.div animate={{ x: darkMode ? 16 : 2 }} className="absolute top-1 w-2.5 h-2.5 bg-white rounded-full" />
                                                        </div>
                                                    </button>
                                                </div>

                                                {/* EXPORTAR */}
                                                <button onClick={exportToExcel} className="w-full p-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 text-[9px] font-black opacity-50 hover:opacity-100 transition-all uppercase">
                                                    <Download size={12} /> Exportar
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-3 rounded-2xl border shadow-sm" style={{ color: accentColor }}><Menu size={20} /></button>
                    </div>
                </header>

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-8">
                        <section className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-6 rounded-3xl border shadow-sm`}>
                            <InputArea onExpensesFound={handleNewItems} accentColor={accentColor} />
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-4">
                                <h3 className="flex items-center gap-2 font-black opacity-40 text-sm tracking-widest uppercase"><Calendar size={14} /> Actividad</h3>
                                <button
                                    onClick={clearActivity}
                                    className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${darkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    Limpiar
                                </button>
                            </div>
                            <div className="space-y-6">
                                <AnimatePresence>
                                    {Object.keys(groupedExpenses).sort((a, b) => new Date(b) - new Date(a)).map(date => (
                                        <motion.div key={date} layout className="space-y-2">
                                            <div className="px-4 text-xs font-bold opacity-40 tracking-widest uppercase">{date}</div>
                                            {[...groupedExpenses[date]].reverse().map((e) => (
                                                <div key={e.id} className={`flex justify-between items-center p-4 rounded-2xl border group ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-lg ${e.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                            {e.amount > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                        </div>
                                                        <div>
                                                        <p className="text-base font-bold capitalize">{e.label}</p>
                                                        <p className="text-xs font-bold opacity-40 uppercase">{e.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-black text-base ${e.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatMoney(e.amount)}</span>
                                                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => editExpense(e.id)} className="p-2 text-blue-500 hover:scale-110 transition-transform"><Edit3 size={16} /></button>
                                                            <button onClick={() => deleteExpense(e.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-5 space-y-8">
                        {/* IA SECTION */}
                        <section style={{ backgroundColor: darkMode ? `${accentColor}15` : accentColor, borderColor: `${accentColor}30` }} className="p-8 rounded-[2.5rem] shadow-xl border text-white relative overflow-hidden">
                            <h3 className="font-bold mb-4 text-lg flex items-center gap-2"><Sparkles size={18} /> Pregunta a tu IA</h3>
                            <div className="relative mb-4">
                                <input type="text" placeholder="¿Cómo ahorrar más?" value={adviceTopic} onChange={(e) => setAdviceTopic(e.target.value)}
                                    className={`w-full rounded-2xl py-4 pl-5 pr-14 text-sm outline-none transition-all ${darkMode ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 shadow-inner'}`} />
                                <button
                                    onClick={async () => { if (!adviceTopic) return; setLoadingAdvice(true); setAdvice(await getFinancialAdvice(expenses, currentBalance, adviceTopic)); setLoadingAdvice(false); }}
                                    style={{ backgroundColor: accentColor }} className="absolute right-2 top-2 p-2.5 rounded-xl text-white transition-all active:scale-90 hover:brightness-110 shadow-lg">
                                    {loadingAdvice ? <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> : <MessageSquare size={20} />}
                                </button>
                            </div>
                            <AnimatePresence>{advice && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className={`p-4 rounded-2xl border text-xs leading-relaxed ${darkMode ? 'bg-slate-900/50 border-slate-700 text-blue-100' : 'bg-white/20 border-white/30 text-white'}`}>{advice}</motion.div>}</AnimatePresence>
                        </section>

                        {/* GRAFICO */}
                        <section className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-6 rounded-[2.5rem] border h-64 shadow-sm`}>
                            <h3 className="text-xs font-black opacity-40 uppercase mb-4 flex items-center gap-2"><ChartIcon size={14} /> Evolución</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <RechartsTooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-3 rounded-2xl border shadow-xl`}>
                                                        <p className="text-[10px] font-bold opacity-50 uppercase mb-1">{payload[0].payload.name}</p>
                                                        <p className="text-sm font-black" style={{ color: accentColor }}>{formatMoney(payload[0].value)}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area type="monotone" dataKey="balance" stroke={accentColor} fill={accentColor} fillOpacity={0.1} strokeWidth={4} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </section>

                        {/* SUSCRIPCIONES */}
                        <section className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-6 rounded-[2.5rem] border shadow-sm`}>
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="font-black text-xs opacity-40 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard size={14} /> Suscripciones
                                </h3>
                                <button
                                    onClick={addSubscription}
                                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }} // Fondo con 20% opacidad
                                    className="p-2 rounded-full hover:brightness-90 transition-all"
                                >
                                    <PlusCircle size={18} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {subscriptions.map(sub => (
                                    <div key={sub.id} className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'} p-4 rounded-2xl flex justify-between items-center group border`}>
                                        <div>
                                            <p className="text-xs font-bold">{sub.name}</p>
                                            <p className="text-[10px] font-black mt-0.5" style={{ color: accentColor }}>{formatMoney(sub.cost)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => editSubscription(sub)} className="p-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={14} /></button>
                                            <button onClick={() => paySubscription(sub)} className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg active:scale-90 transition-transform"><Check size={14} /></button>
                                            <button onClick={() => deleteSubscription(sub.id)} className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* OBJETIVOS */}
                        <section className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-6 rounded-[2.5rem] border shadow-sm`}>
                            <div className="flex justify-between items-center mb-6 px-2">
                                <h3 className="font-black text-[10px] opacity-40 uppercase tracking-widest flex items-center gap-2">
                                    <Target size={16} className="text-rose-500" /> Mis Objetivos
                                </h3>
                                <button
                                    onClick={() => { const n = prompt("Meta:"); const c = prompt("Costo:"); if (n && c) setGoals([...goals, { name: n, target: Number(c), id: Date.now(), completed: false }]); }}
                                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                    className="p-2 rounded-full hover:brightness-90 transition-all"
                                >
                                    <PlusCircle size={18} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {goals.map(goal => (
                                    <div key={goal.id} className={`${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'} p-5 rounded-3xl border relative group`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className={`text-sm font-bold ${goal.completed ? 'text-emerald-500' : ''}`}>
                                                    {goal.completed ? '✨ ' : ''}{goal.name}
                                                </span>
                                                <p className="text-[10px] font-black mt-1" style={{ color: accentColor }}>
                                                    {goal.completed ? '¡Completado!' : `Faltan: ${formatMoney(Math.max(0, goal.target - currentBalance))}`}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => editGoal(goal)} className="p-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={14} /></button>
                                                <button onClick={() => toggleGoal(goal.id)} className={`p-2 rounded-xl transition-all ${goal.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}><Check size={14} /></button>
                                                <button onClick={() => deleteGoal(goal.id)} className="p-2 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div className={`w-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'} h-1.5 rounded-full overflow-hidden`}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((currentBalance / goal.target) * 100, 100)}%` }} style={{ backgroundColor: goal.completed ? '#10b981' : accentColor }} className="h-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;