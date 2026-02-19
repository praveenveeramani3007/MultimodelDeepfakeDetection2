import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    Activity,
    ShieldAlert,
    LogOut,
    Clock,
    ShieldCheck,
    Search,
    ChevronLeft,
    Database,
    Cpu
} from "lucide-react";
import { motion } from "framer-motion";

interface UserActivity {
    id: number;
    userId: number;
    username: string;
    fullName: string;
    action: 'login' | 'logout';
    timestamp: string;
}

interface User {
    id: number;
    username: string;
    fullName: string;
    createdAt: string;
}

export default function AdminDashboard() {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'activity' | 'directory'>('activity');
    const [, setLocation] = useLocation();

    useEffect(() => {
        const isAdmin = sessionStorage.getItem("isAdminAuthenticated");
        if (!isAdmin) {
            setLocation("/auth");
            return;
        }

        fetchSummary();
    }, [setLocation]);

    const fetchSummary = async () => {
        try {
            const res = await fetch("/api/admin/summary");
            const data = await res.json();
            setActivities(data.activities || []);
            setUsers(data.users || []);
        } catch (error) {
            console.error("Failed to fetch summary", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("isAdminAuthenticated");
        setLocation("/auth");
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-4 xxs:p-6 lg:p-12 font-sans selection:bg-red-500/30">
            {/* Background Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 text-red-500 mb-2">
                            <ShieldAlert className="w-5 h-5 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Classified Admin Access</span>
                        </div>
                        <h1 className="text-3xl xxs:text-4xl lg:text-5xl font-display font-black text-white tracking-tighter">
                            Activity <span className="text-gradient-primary">Intelligence</span>
                        </h1>
                        <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                            Monitoring real-time user session dynamics and forensic system interactions.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setLocation("/")}
                            className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/5"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Laboratory
                        </Button>
                        <Button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-900/20 px-6"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Terminate Session
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
                    {/* Stats Cards */}
                    <Card className="glass-panel border-white/5 bg-white/5 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Total Surveillance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white">
                                {users.length} Users
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-panel border-white/5 bg-white/5 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Session Count
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-primary">
                                {activities.filter(a => a.action === 'login').length} Logins
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-panel border-white/5 bg-white/5 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Last Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white">
                                {activities[0] ? new Date(activities[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-panel border-white/5 bg-white/5 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                Total Logs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white">
                                {activities.length} Entries
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-6 p-1 bg-white/5 w-fit rounded-xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'activity' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        Session Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('directory')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'directory' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        User Directory
                    </button>
                </div>

                {/* Content */}
                <Card className="glass-panel border-white/10 bg-slate-950/40 backdrop-blur-3xl overflow-hidden rounded-[2rem] shadow-2xl">
                    <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-display font-bold text-white mb-1">
                                {activeTab === 'activity' ? "Intelligence Feed" : "Forensic Analysts"}
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                {activeTab === 'activity'
                                    ? "Chronological log of forensic analysts accessing the terminal."
                                    : "Comprehensive directory of all personnel registered in the Verisight infrastructure."
                                }
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/5">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            {activeTab === 'activity' ? "Analyst" : "Personnel"}
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            {activeTab === 'activity' ? "Action" : "Handle"}
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            {activeTab === 'activity' ? "Timestamp" : "Registered Since"}
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center">
                                                <Cpu className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                                                <p className="text-slate-400 font-mono text-sm tracking-tight">Accessing encrypted archives...</p>
                                            </td>
                                        </tr>
                                    ) : activeTab === 'activity' ? (
                                        activities.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                                                    No activity trails detected in the current sector.
                                                </td>
                                            </tr>
                                        ) : (
                                            activities.map((a, i) => (
                                                <motion.tr
                                                    key={a.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                                                >
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-900/40 flex items-center justify-center text-primary font-black border border-white/10 group-hover:border-primary/40 transition-all">
                                                                {a.username[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-white font-bold text-sm tracking-tight">{a.fullName}</div>
                                                                <div className="text-slate-500 text-[10px] font-mono tracking-tighter">@{a.username}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${a.action === 'login'
                                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                            : 'bg-red-500/10 text-red-300 border border-red-500/20'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${a.action === 'login' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                                            {a.action}
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-sm text-slate-400 font-mono">
                                                        {new Date(a.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-2 text-primary/60">
                                                            <ShieldCheck className="w-4 h-4" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )
                                    ) : (
                                        users.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                                                    No registered analysts found in the database.
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((u, i) => (
                                                <motion.tr
                                                    key={u.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                                                >
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-900/40 flex items-center justify-center text-primary font-black border border-white/10 group-hover:border-primary/40 transition-all">
                                                                {u.username[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-white font-bold text-sm tracking-tight">{u.fullName}</div>
                                                                <p className="text-[10px] text-slate-500 font-mono">SEC-LEVEL: ANALYST</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className="text-slate-400 font-mono text-sm tracking-tight">@{u.username}</span>
                                                    </td>
                                                    <td className="p-6 text-sm text-slate-400 font-mono">
                                                        {new Date(u.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-2 text-green-400/60">
                                                            <ShieldCheck className="w-4 h-4" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Active</span>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <footer className="mt-12 text-center text-[10px] font-bold text-slate-600 uppercase tracking-[0.5em]">
                    Verisight Internal Security Infrastructure // Sector 7G
                </footer>
            </div>
        </div>
    );
}
