import logo from "@/assets/logo.png";
import { useAnalysisHistory } from "@/hooks/use-analysis";
import { Sidebar } from "@/components/Sidebar";
import { AnalysisCard } from "@/components/AnalysisCard";
import { Loader2, Plus, ArrowRight, FileText, Image as ImageIcon, Mic, Video, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { data: analyses, isLoading } = useAnalysisHistory();
  const recentAnalyses = analyses?.slice(0, 3) || [];

  const modules = [
    { title: "Image Analysis", icon: <ImageIcon className="w-8 h-8" />, desc: "Detect AI-generated pixels & metadata anomalies", color: "bg-blue-500/20 text-blue-400", type: "image" },
    { title: "Audio Analysis", icon: <Mic className="w-8 h-8" />, desc: "Identify voice cloning & spectral artifacts", color: "bg-purple-500/20 text-purple-400", type: "audio" },
    { title: "Text Analysis", icon: <FileText className="w-8 h-8" />, desc: "Find NLP patterns in suspicious content", color: "bg-green-500/20 text-green-400", type: "text" },
    { title: "Video Forensic", icon: <Video className="w-8 h-8" />, desc: "Frame-by-frame manipulation detection", color: "bg-orange-500/20 text-orange-400", type: "video" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64 p-4 pt-20 xxs:p-6 lg:p-12 lg:pt-12 overflow-x-hidden">
        <header className="mb-8 xxs:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 xxs:gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <img src={logo} alt="VeriSight Logo" className="w-12 h-12 xxs:w-16 xxs:h-16 object-contain" />
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl xxs:text-3xl sm:text-4xl lg:text-5xl font-display font-bold"
              >
                Digital Forensic Lab
              </motion.h1>
            </div>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm xxs:text-base sm:text-lg lg:text-xl text-muted-foreground"
            >
              Select a specialized module to begin your technical verification.
            </motion.p>
          </div>
          <div className="hidden lg:block p-4 border border-white/5 rounded-2xl bg-muted/10 text-xs font-mono text-muted-foreground">
            <p>SYSTEM STATUS: <span className="text-green-500 font-bold">OPERATIONAL</span></p>
            <p>DATABASE: <span className="text-primary font-bold">VS-REPLICA-A</span></p>
          </div>
        </header>

        {/* Specialized Modules Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href="/upload">
                <Card className="glass-panel border-white/5 hover:border-primary/50 transition-all cursor-pointer group h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className={`p-4 rounded-2xl mb-4 ${mod.color}`}>
                      {mod.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{mod.title}</h3>
                    <p className="text-sm text-muted-foreground">{mod.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-primary" /> Recent Cases
            </h2>
            <Link href="/history">
              <span className="text-sm font-medium text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1 group">
                View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : recentAnalyses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentAnalyses.map((analysis) => (
                <AnalysisCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card/30 rounded-3xl border border-dashed border-border/10">
              <h3 className="text-xl font-bold mb-2 text-muted-foreground">No cases on record</h3>
              <p className="text-sm text-muted-foreground mb-6">Your analysis history will appear here.</p>
            </div>
          )}
        </section>

        <section>
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-6 xxs:p-8 lg:p-12 relative overflow-hidden border border-white/5">
            <div className="relative z-10">
              <h2 className="text-xl xxs:text-2xl sm:text-3xl font-display font-bold mb-3 xxs:mb-4">Scientific Verification</h2>
              <p className="text-sm xxs:text-base sm:text-lg text-muted-foreground mb-6 xxs:mb-8 max-w-2xl">
                Unlike general AI, our lab uses Technical Error Level Analysis (ELA), NLP Metadata inspection, and Spectral Spectral Profiling for deterministic results.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 rounded-full bg-white/5 text-sm font-medium">Metadata Validation</div>
                <div className="px-4 py-2 rounded-full bg-white/5 text-sm font-medium">Error Level Profiling</div>
                <div className="px-4 py-2 rounded-full bg-white/5 text-sm font-medium">Signal Anomaly Detection</div>
              </div>
            </div>
            {/* Dark foreground accent for depth */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 blur-[100px] rounded-full" />
          </div>
        </section>
      </main>
    </div>
  );
}

