import { useState, useRef, useEffect } from "react";
// Cache bust: Force rebuild for Auth handler fix 2
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, UserPlus, LogIn, Loader2, Cpu, Globe, Lock, Shield } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import * as api from "@/lib/api";

function VerisightLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* Outer Shield/Hexagon Frame */}
            <motion.path
                d="M50 5L85 20V50C85 75 50 95 50 95C50 95 15 75 15 50V20L50 5Z"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 1.5 }}
            />
            {/* Inner Digital Eye/Iris */}
            <motion.circle
                cx="50"
                cy="50"
                r="18"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="4 2"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
            />
            <motion.circle
                cx="50"
                cy="50"
                r="8"
                fill="currentColor"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-primary"
            />
            {/* Scanning Line */}
            <motion.line
                x1="25" y1="50" x2="75" y2="50"
                stroke="currentColor"
                strokeWidth="1"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 0.8 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                style={{ originX: "0.5" }}
                className="text-primary"
            />
            {/* Digital Particles/Nodes */}
            <motion.circle cx="30" cy="30" r="1.5" fill="currentColor" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} />
            <motion.circle cx="70" cy="30" r="1.5" fill="currentColor" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
            <motion.circle cx="70" cy="70" r="1.5" fill="currentColor" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} />
            <motion.circle cx="30" cy="70" r="1.5" fill="currentColor" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 1.5 }} />
        </svg>
    );
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-10deg", "10deg"]);

    function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXRelative = event.clientX - rect.left;
        const mouseYRelative = event.clientY - rect.top;

        x.set(mouseXRelative / width - 0.5);
        y.set(mouseYRelative / height - 0.5);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            style={{
                perspective: "1200px",
                rotateX,
                rotateY,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    // Admin Fields
    const [adminName, setAdminName] = useState("");
    const [adminDob, setAdminDob] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [adminError, setAdminError] = useState("");

    const { loginMutation, registerMutation, user } = useAuth();
    const [, setLocation] = useLocation();

    const isLoading = loginMutation.isPending || registerMutation.isPending;

    // Server Config State
    const [showServerConfig, setShowServerConfig] = useState(false);
    const [serverUrl, setServerUrl] = useState("");

    useEffect(() => {
        // Load existing server URL
        setServerUrl(api.getApiUrl());
    }, []);

    useEffect(() => {
        if (user) {
            setLocation("/");
        }
    }, [user, setLocation]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLogin) {
            loginMutation.mutate({ username, password });
        } else {
            registerMutation.mutate({ username, password, firstName, lastName });
        }
    };

    const handleAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAdminError("");

        // UNIQUE CREDENTIALS CHECK
        if (adminName === "praveenV" && adminDob === "300704" && adminPassword === "Vpraveen6374416934") {
            // Store admin state in session storage (simple for this case)
            sessionStorage.setItem("isAdminAuthenticated", "true");
            setLocation("/admin-portal");
        } else {
            setAdminError("ACCESS DENIED: Credentials mismatch. Initiating failure protocol.");
        }
    };

    const handleSaveServer = () => {
        let url = serverUrl.trim();
        // Remove trailing slash
        url = url.replace(/\/$/, "");
        api.setApiUrl(url);
        setShowServerConfig(false);
        window.location.reload(); // Reload to apply changes
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center lg:justify-end overflow-y-auto relative lg:pr-[8%] px-4 xxs:px-6 py-6 transition-all">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 blur-[160px] rounded-full animate-pulse" />
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-600/10 blur-[160px] rounded-full animate-pulse " style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30 grainy-gradient" />
            </div>

            {/* Visual Section - Desktop */}
            <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[55%] flex-col items-center justify-center p-12 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative w-full max-w-lg aspect-square"
                >
                    {/* Floating 3D Assets Placeholder (using icons and circles for premium look) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[80%] h-[80%] border-2 border-dashed border-white/10 rounded-full"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[100%] h-[100%] border border-white/5 rounded-full"
                        />

                        {/* BRAND ICON: VeriSight - High-fidelity Forensic Mark */}
                        <div className="relative z-10 w-[420px] h-[420px] flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="w-full h-full p-8 text-white relative z-10 drop-shadow-[0_0_50px_rgba(124,58,237,0.4)]"
                            >
                                <VerisightLogo className="w-full h-full" />
                            </motion.div>
                        </div>

                        {/* Floating elements */}
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-0 right-10 p-5 bg-secondary/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl"
                        >
                            <Cpu className="w-8 h-8 text-primary" />
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, 20, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute bottom-10 left-10 p-5 bg-secondary/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl"
                        >
                            <Globe className="w-8 h-8 text-purple-400" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* ICONIC BRANDING: VeriSight - Restored to original project title */}
                <div className="relative z-30 text-center -mt-12 space-y-6 max-w-xl">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-7xl font-display font-black text-white tracking-tighter leading-none"
                    >
                        VERI<span className="text-gradient-primary">SIGHT</span>
                    </motion.h2>
                    <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto opacity-50" />
                    <p className="text-xl text-slate-400 max-w-md mx-auto leading-relaxed font-medium tracking-tight">
                        Powering the frontier of digital truth. <br />
                        <span className="text-white/60">Forensic intelligence for a new era.</span>
                    </p>
                </div>

                {/* Integration partners/Trust indicators */}
                <div className="absolute bottom-12 flex gap-8 opacity-40 grayscale hover:grayscale-0 transition-all">
                    <Shield className="w-8 h-8" />
                    <Lock className="w-8 h-8" />
                    <ShieldCheck className="w-8 h-8" />
                </div>
            </div>

            {/* Form Section */}
            <div className="w-full lg:w-[45%] flex items-center justify-center py-6 xxs:py-8 lg:p-12 z-20">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-6 xxs:mb-10 w-full flex flex-col items-center">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="lg:hidden w-24 h-24 mb-6 text-primary drop-shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                        >
                            <VerisightLogo className="w-full h-full" />
                        </motion.div>
                        <div className="space-y-2 text-center">
                            <h1 className="text-3xl xxs:text-4xl sm:text-5xl font-display font-black text-white tracking-tighter">VERISIGHT</h1>
                            <p className="text-slate-400 font-bold tracking-[0.4em] text-[8px] xxs:text-[10px] uppercase">Forensic System Access</p>
                        </div>
                    </div>

                    <TiltCard className="w-full">
                        <Card className="glass-panel border-white/10 bg-slate-900/60 backdrop-blur-3xl shadow-[0_32px_128px_-16px_rgba(0,0,0,0.7)] overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                            <CardHeader className="space-y-2 pt-8">
                                <CardTitle className="text-2xl xxs:text-3xl font-display font-bold text-white">
                                    {showServerConfig ? "Network Protocol" : (isAdminMode
                                        ? "Master Control Protocol"
                                        : (isLogin ? "Welcome Analyst" : "Initialize Account"))
                                    }
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-base">
                                    {showServerConfig ? "Configure secure uplink to backend forensic core" : (isAdminMode
                                        ? "Enter privileged credentials to override system restrictions"
                                        : (isLogin
                                            ? "Securely sign in to your forensic environment"
                                            : "Register for a workspace in the laboratory"))
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AnimatePresence mode="wait">
                                    {showServerConfig ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col gap-6"
                                        >
                                            <div className="space-y-2 group">
                                                <Label className="text-slate-300">Backend Server URL</Label>
                                                <Input
                                                    value={serverUrl}
                                                    onChange={(e) => setServerUrl(e.target.value)}
                                                    placeholder="https://your-backend.onrender.com"
                                                    className="bg-slate-800/50 border-white/5 focus:border-primary/50 transition-all font-mono text-sm"
                                                />
                                                <p className="text-xs text-slate-500">
                                                    Enter the full URL of your active Render deployment.
                                                </p>
                                            </div>
                                            <Button
                                                onClick={handleSaveServer}
                                                className="w-full mt-2 h-12 bg-primary hover:bg-primary/90"
                                            >
                                                <Globe className="w-4 h-4 mr-2" />
                                                Establish Uplink
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() => setShowServerConfig(false)}
                                                className="text-sm text-center text-slate-400 hover:text-white"
                                            >
                                                Cancel Connection
                                            </button>
                                        </motion.div>
                                    ) : !isAdminMode ? (
                                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                            <div className="space-y-2 group">
                                                <Label htmlFor="username" className="text-slate-300 group-focus-within:text-primary transition-colors">Username</Label>
                                                <Input
                                                    id="username"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    placeholder="Enter your handle"
                                                    required
                                                    className="bg-slate-800/50 border-white/5 focus:border-primary/50 transition-all"
                                                />
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {!isLogin && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="grid grid-cols-2 gap-4"
                                                    >
                                                        <div className="space-y-2 group">
                                                            <Label htmlFor="firstName" className="text-slate-300 group-focus-within:text-primary transition-colors">First Name</Label>
                                                            <Input
                                                                id="firstName"
                                                                value={firstName}
                                                                onChange={(e) => setFirstName(e.target.value)}
                                                                placeholder="John"
                                                                className="bg-slate-800/50 border-white/5 focus:border-primary/50 transition-all"
                                                            />
                                                        </div>
                                                        <div className="space-y-2 group">
                                                            <Label htmlFor="lastName" className="text-slate-300 group-focus-within:text-primary transition-colors">Last Name</Label>
                                                            <Input
                                                                id="lastName"
                                                                value={lastName}
                                                                onChange={(e) => setLastName(e.target.value)}
                                                                placeholder="Doe"
                                                                className="bg-slate-800/50 border-white/5 focus:border-primary/50 transition-all"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="space-y-2 group">
                                                <Label htmlFor="password" title="Password must be at least 8 characters" className="text-slate-300 group-focus-within:text-primary transition-colors">Password</Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    className="bg-slate-800/50 border-white/5 focus:border-primary/50 transition-all"
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full mt-4 h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98]"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                ) : isLogin ? (
                                                    <LogIn className="w-5 h-5 mr-2" />
                                                ) : (
                                                    <UserPlus className="w-5 h-5 mr-2" />
                                                )}
                                                {isLogin ? "Access System" : "Create Account"}
                                            </Button>

                                            <div className="text-center flex flex-col gap-4 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsLogin(!isLogin)}
                                                    className="text-sm text-primary hover:text-primary/80 transition-colors font-medium border-b border-transparent hover:border-primary"
                                                >
                                                    {isLogin ? "Need a workspace? Register here" : "Return to analyst portal"}
                                                </button>

                                                <div className="flex justify-center gap-4">
                                                    {!isAdminMode && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAdminMode(true)}
                                                            className="text-[10px] text-slate-500 hover:text-red-400 transition-all uppercase tracking-[0.3em] font-bold opacity-50 hover:opacity-100"
                                                        >
                                                            [ Internal Override Access ]
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowServerConfig(true)}
                                                        className="text-[10px] text-slate-500 hover:text-blue-400 transition-all uppercase tracking-[0.3em] font-bold opacity-50 hover:opacity-100"
                                                    >
                                                        [ Network Config ]
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    ) : (
                                        <motion.form
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onSubmit={handleAdminSubmit}
                                            className="flex flex-col gap-6"
                                        >
                                            <div className="space-y-2 group">
                                                <Label htmlFor="adminName" className="text-slate-300 group-focus-within:text-red-400 transition-colors">Admin Handle</Label>
                                                <Input
                                                    id="adminName"
                                                    value={adminName}
                                                    onChange={(e) => setAdminName(e.target.value)}
                                                    placeholder="Name:praveenV"
                                                    required
                                                    className="bg-slate-800/50 border-red-500/20 focus:border-red-500/50 transition-all font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2 group">
                                                <Label htmlFor="adminDob" className="text-slate-300 group-focus-within:text-red-400 transition-colors">Date of Birth</Label>
                                                <Input
                                                    id="adminDob"
                                                    value={adminDob}
                                                    onChange={(e) => setAdminDob(e.target.value)}
                                                    placeholder="Format: 300704"
                                                    required
                                                    className="bg-slate-800/50 border-red-500/20 focus:border-red-500/50 transition-all font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2 group">
                                                <Label htmlFor="adminPassword" title="Secure admin passphrase" className="text-slate-300 group-focus-within:text-red-400 transition-colors">Master Password</Label>
                                                <Input
                                                    id="adminPassword"
                                                    type="password"
                                                    value={adminPassword}
                                                    onChange={(e) => setAdminPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    className="bg-slate-800/50 border-red-500/20 focus:border-red-500/50 transition-all"
                                                />
                                            </div>

                                            {adminError && (
                                                <p className="text-red-400 text-xs font-mono animate-pulse">{adminError}</p>
                                            )}

                                            <Button
                                                type="submit"
                                                className="w-full mt-4 h-12 text-lg font-semibold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20 transition-all transform active:scale-[0.98]"
                                            >
                                                <ShieldCheck className="w-5 h-5 mr-2" />
                                                Authenticate Master
                                            </Button>

                                            <div className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAdminMode(false);
                                                        setAdminError("");
                                                    }}
                                                    className="text-sm text-slate-400 hover:text-white transition-colors font-medium border-b border-transparent hover:border-white"
                                                >
                                                    Exit Command Override
                                                </button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </TiltCard>

                    <div className="mt-8">
                        <p className="text-center text-xs text-slate-500 uppercase tracking-widest font-semibold">
                            &copy; 2026 VeriSight Forensic Lab. All rights reserved.
                        </p>
                    </div>
                </motion.div>
            </div>

            <style>{`
                .grainy-gradient {
                    background: radial-gradient(circle at center, transparent 0%, #020617 100%),
                                url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3F%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                    background-repeat: repeat;
                    mix-blend-mode: overlay;
                }
            `}</style>
        </div>
    );
}
