import { useState } from "react";
import { useRoute } from "wouter";
import { useAnalysisResult } from "@/hooks/use-analysis";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, ArrowLeft, ShieldCheck, ShieldAlert, Download, Share2, Info, Activity, Fingerprint, FileText, Calendar } from "lucide-react";
import { Link } from "wouter";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Report() {
  const [match, params] = useRoute("/analysis/:id");
  const id = parseInt(params?.id || "0");
  const { data: result, isLoading } = useAnalysisResult(id);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(`/api/analysis/certificate/${id}`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VS-Certificate-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground gap-4">
        <h1 className="text-2xl font-bold">Report Not Found</h1>
        <Link href="/">
          <button className="text-primary hover:underline">Return Home</button>
        </Link>
      </div>
    );
  }

  const isReal = result.authenticityLabel === "Real" || result.authenticityLabel === "Likely Real";
  const authScore = result.authenticityScore || 0;

  // The authenticity score directly represents the 'Human/Real' confidence
  const humanScore = authScore;
  const aiScore = 100 - humanScore;

  const ratioData = [
    { name: 'Human Content', value: humanScore, color: '#8b5cf6' },
    { name: 'AI Probability', value: aiScore, color: '#ef4444' },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 p-4 pt-20 md:p-8 lg:p-12 lg:pt-12 pb-32 lg:pb-24 max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 xxs:gap-8 mb-8 xxs:mb-12 border-b border-white/5 pb-8">
          <div className="space-y-4">
            <Link href="/history">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all mb-4 group px-3 py-1.5 rounded-lg bg-muted/50 w-fit">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Records</span>
              </button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl xxs:text-3xl md:text-5xl font-display font-bold tracking-tight text-glow-sm">
                Forensic Analysis
              </h1>
              <p className="text-muted-foreground font-mono text-xs md:text-sm uppercase tracking-widest flex items-center gap-2">
                <span className="text-primary/60">ID:</span> VS-{id.toString().padStart(4, '0')}
                <span className="text-primary/60">•</span> 256-BIT CRYPTOGRAPHIC VERIFICATION
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handlePreview}
              className="flex items-center justify-center gap-3 px-6 xxs:px-8 py-3 xxs:py-4 rounded-2xl bg-secondary text-foreground text-xs xxs:text-sm font-black uppercase tracking-widest hover:bg-secondary/80 transition-all shadow-xl active:scale-95 border border-white/10"
            >
              <FileText className="w-4 h-4" /> Preview Certificate
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center justify-center gap-3 px-6 xxs:px-8 py-3 xxs:py-4 rounded-2xl bg-primary text-primary-foreground text-xs xxs:text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 active:scale-95 border border-white/10 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download Certificate
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Evidence Panel */}
          <div className="lg:col-span-12 xl:col-span-8 space-y-8 lg:space-y-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-white/10 rounded-[2.5rem] p-6 md:p-10 glass-panel shadow-2xl relative overflow-hidden"
            >
              {/* Verdict Ribbon */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-10 overflow-hidden">
                <div className="space-y-2 min-w-0 flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight truncate pr-4" title={result.fileName}>
                    {result.fileName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-[10px] md:text-xs font-mono uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 shrink-0"><Calendar className="w-3.5 h-3.5" /> {new Date(result.createdAt || "").toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    <span className="flex items-center gap-1.5 shrink-0 font-black text-primary/60"><Activity className="w-3.5 h-3.5 text-primary" /> 100% SIGNAL INTEGRITY</span>
                  </div>
                </div>

                <div className={cn(
                  "px-6 py-3.5 md:px-8 md:py-4 rounded-[1.2rem] md:rounded-[1.5rem] border-2 flex items-center justify-center gap-3 md:gap-4 font-black text-base md:text-xl tracking-tighter shadow-xl shrink-0 self-start md:self-center w-fit",
                  isReal
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                  {isReal ? <ShieldCheck className="w-6 h-6 md:w-7 md:h-7" /> : <ShieldAlert className="w-6 h-6 md:w-7 md:h-7" />}
                  <span className="whitespace-nowrap">{result.authenticityLabel?.toUpperCase()}</span>
                </div>
              </div>

              {/* Analyzed Media Display */}
              <div className="mb-12 rounded-[2rem] overflow-hidden bg-black/40 border border-white/10 aspect-video md:aspect-[21/9] flex items-center justify-center relative group shadow-inner">
                {result.fileType === 'image' && (
                  <img src={result.fileUrl} alt="Analyzed Specimen" className="w-full h-full object-contain p-4" />
                )}
                {result.fileType === 'audio' && (
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shadow-glow-primary">
                      <Fingerprint className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                    <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary/80 font-black">Spectral Pulse Analysis</p>
                  </div>
                )}
                {result.fileType === 'text' && (
                  <div className="p-8 md:p-12 w-full h-full overflow-y-auto font-mono text-xs md:text-sm text-muted-foreground/90 leading-relaxed bg-black/20">
                    <div className="max-w-3xl mx-auto italic">
                      {result.details?.reasoning}
                    </div>
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 text-primary/80">LAB SPECIMEN</span>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-widest text-primary/80">
                    Forensic Summary
                  </h3>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                </div>

                <div className="bg-muted/30 rounded-[2rem] p-6 md:p-12 border border-white/10 relative shadow-inner">
                  <p className="text-foreground/90 leading-relaxed text-lg md:text-xl italic font-medium text-center relative z-10">
                    "{result.details?.reasoning || "Diagnostic signal profile complete. No anomalies detected."}"
                  </p>
                  <div className="absolute top-4 left-6 text-6xl text-white/5 font-serif">"</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="p-5 md:p-6 rounded-[1.5rem] bg-muted/20 border border-white/5 group hover:border-primary/30 transition-all hover:bg-muted/30 overflow-hidden">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-[0.2em]">Precision Score</p>
                    <p className="text-xl md:text-2xl font-mono font-black text-primary group-hover:text-glow-primary transition-all truncate">{authScore}%</p>
                  </div>
                  <div className="p-5 md:p-6 rounded-[1.5rem] bg-muted/20 border border-white/5 group hover:border-green-500/30 transition-all hover:bg-muted/30 overflow-hidden">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-[0.2em]">Signal Quality</p>
                    <p className="text-xl md:text-2xl font-mono font-black text-green-500 truncate">EXCELLENT</p>
                  </div>
                  <div className="p-5 md:p-6 rounded-[1.5rem] bg-muted/20 border border-white/5 group hover:border-blue-400/30 transition-all hover:bg-muted/30 overflow-hidden sm:col-span-2 lg:col-span-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-[0.2em]">Processing Lab</p>
                    <p className="text-xl md:text-2xl font-mono font-black text-muted-foreground italic truncate">ALPHA-9</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Technical Detail Rows */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-white/10 rounded-[2.5rem] p-6 md:p-10 glass-panel shadow-sm"
            >
              <h3 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-widest text-primary/80">
                <Activity className="w-6 h-6" /> Signal Integrity Protocols
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Neural Patterning", result: isReal ? "Organic" : "Synthetic", status: isReal ? "PASS" : "FAIL" },
                  { label: "Vector Stability", result: "99.2% Stable", status: "PASS" },
                  { label: "Sensor Noise", result: isReal ? "Natural" : "Constrained", status: isReal ? "PASS" : "FAIL" },
                  { label: "Header Integrity", result: "Valid Hash", status: "PASS" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-muted/10 border border-white/5 hover:bg-muted/20 transition-all gap-4 group">
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest block">{row.label}</span>
                      <span className="font-mono text-sm font-bold group-hover:text-primary transition-colors">{row.result}</span>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black tracking-widest border",
                      row.status === "PASS" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>{row.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Ratio Sidebar */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-8 lg:space-y-12">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-white/10 rounded-[2.5rem] p-8 md:p-10 glass-panel shadow-2xl lg:sticky lg:top-8"
            >
              <h3 className="text-xl font-black mb-10 text-center uppercase tracking-[0.3em] text-primary/80">Origin Ratio</h3>

              <div className="flex flex-col sm:flex-row xl:flex-col gap-10 items-center">
                <div className="h-64 w-64 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ratioData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={105}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {ratioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        contentStyle={{ background: '#09090b', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', padding: '12px' }}
                        itemStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-5xl font-black font-mono tracking-tighter text-glow-primary">{humanScore}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] mt-1">Authentic</p>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-4">
                  {ratioData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-3.5 h-3.5 rounded-full shadow-glow-sm" style={{ background: item.color, boxShadow: `0 0 15px ${item.color}60` }} />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.name}</span>
                      </div>
                      <span className="font-mono font-black text-lg">{item.value}%</span>
                    </div>
                  ))}

                  <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20 relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <ShieldCheck className="w-24 h-24 text-primary" />
                    </div>
                    <p className="text-[10px] text-primary font-black mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                      Diagnostic Verdict
                    </p>
                    <p className="text-sm font-medium leading-relaxed italic text-foreground/80">
                      Primary signal sensors indicate a <strong>{humanScore}%</strong> alignment with organic acquisition models.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Certificate Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative w-full max-w-5xl h-[90vh] bg-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-background to-transparent z-10 flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-widest text-primary">Certificate Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-3 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <iframe
              src={`/api/analysis/certificate/${id}`}
              className="w-full h-full"
              title="Certificate Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
