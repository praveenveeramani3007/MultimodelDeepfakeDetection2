import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
        { role: "bot", text: "FORENSIC SYSTEM ONLINE. I am your Digital Integrity Assistant. How can I facilitate your investigation?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const suggestions = [
        { label: "Check Last Result", query: "What is my last analysis result?" },
        { label: "How ELA Works", query: "Explain ELA forensics" },
        { label: "Metadata Check", query: "What is metadata analysis?" },
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (query?: string) => {
        const textToSend = query || input;
        if (!textToSend.trim()) return;

        setInput("");
        setMessages(prev => [...prev, { role: "user", text: textToSend }]);
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: textToSend }),
            });
            const data = await res.json();

            // Artificial delay for 'analysis' feel
            await new Promise(r => setTimeout(r, 800));
            setMessages(prev => [...prev, { role: "bot", text: data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", text: "COMMUNICATION ERROR: Unable to reach forensic server." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] flex flex-col items-end max-w-[calc(100vw-2rem)]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="mb-4 w-full sm:w-80 md:w-96"
                    >
                        <Card className="h-[65vh] sm:h-[32rem] flex flex-col border-none chat-glass overflow-hidden rounded-[2rem] chat-window-mobile relative">
                            <CardHeader className="p-6 pt-8 border-b border-white/5 bg-primary/5 flex flex-row items-center justify-between shrink-0">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="relative">
                                        <Bot className="w-5 h-5 text-primary" />
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                                    </div>
                                    Forensic Assistant
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full hover:bg-white/5">
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin overflow-x-hidden" ref={scrollRef}>
                                {messages.map((m, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={i}
                                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={cn(
                                            "max-w-[85%] p-4 rounded-[1.2rem] text-sm leading-relaxed shadow-sm",
                                            m.role === "user"
                                                ? "chat-bubble-user text-primary-foreground font-medium rounded-tr-none"
                                                : "chat-bubble-bot text-foreground rounded-tl-none font-mono"
                                        )}>
                                            {m.text}
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted/30 p-4 rounded-[1.2rem] rounded-tl-none border border-white/5">
                                            <div className="flex gap-1.5 px-1 py-0.5">
                                                <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            {/* Suggestions */}
                            <div className="px-5 pb-2 flex flex-wrap gap-2">
                                {suggestions.map(s => (
                                    <button
                                        key={s.label}
                                        onClick={() => handleSend(s.query)}
                                        className="text-[9px] font-black uppercase tracking-widest bg-muted/20 border border-white/5 px-3 py-1.5 rounded-full hover:bg-primary/20 hover:border-primary/40 transition-all text-muted-foreground hover:text-primary"
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 bg-muted/10 border-t border-white/5 shrink-0">
                                <div className="flex gap-2 bg-background/40 p-1.5 rounded-2xl border border-white/5 focus-within:border-primary/50 transition-all shadow-sm">
                                    <Input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Enter forensic inquiry..."
                                        onKeyDown={e => e.key === "Enter" && handleSend()}
                                        className="border-none bg-transparent focus-visible:ring-0 text-sm py-2 px-3 h-10 shadow-none flex-1 min-w-0"
                                    />
                                    <Button
                                        size="icon"
                                        onClick={() => handleSend()}
                                        disabled={isLoading}
                                        className="rounded-xl h-10 w-10 shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 flex items-center justify-center relative group shrink-0",
                    isOpen ? "" : "chat-active-indicator"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <X className="w-7 h-7" />
                ) : (
                    <>
                        <MessageSquare className="w-7 h-7" />
                        <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-background flex items-center justify-center text-[8px] font-black shadow-lg">1</div>
                    </>
                )}
            </motion.button>
        </div>
    );
}
