import { useRoute } from "wouter";
import { useAnalysisResult } from "@/hooks/use-analysis";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, ArrowLeft, ShieldCheck, ShieldAlert, Download, Share2 } from "lucide-react";
import { Link } from "wouter";
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Report() {
  const [match, params] = useRoute("/analysis/:id");
  const id = parseInt(params?.id || "0");
  const { data: result, isLoading } = useAnalysisResult(id);

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

  const isReal = result.authenticityLabel === "Real";
  
  const chartData = [
    {
      name: 'Authenticity',
      score: result.authenticityScore || 0,
      fill: isReal ? '#22c55e' : '#ef4444',
    },
    {
      name: 'Sentiment',
      score: result.sentimentScore || 0,
      fill: '#8b5cf6',
    },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/history">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to History
            </button>
          </Link>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/50 rounded-3xl p-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-display font-bold mb-2">{result.fileName}</h1>
                  <p className="text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                    Analyzed on {new Date(result.createdAt || "").toLocaleDateString()}
                  </p>
                </div>
                <div className={cn(
                  "px-4 py-2 rounded-full border flex items-center gap-2 font-bold",
                  isReal 
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                  {isReal ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  {result.authenticityLabel?.toUpperCase()}
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-lg font-semibold mb-4">AI Analysis Reasoning</h3>
                <div className="bg-secondary/30 rounded-xl p-6 border-l-4 border-primary">
                  <p className="text-gray-300 leading-relaxed">
                    {result.details?.reasoning || "No detailed reasoning provided by the model."}
                  </p>
                </div>

                {result.details?.transcript && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Transcript / Extracted Text</h3>
                    <div className="bg-secondary/30 rounded-xl p-6 max-h-60 overflow-y-auto">
                      <p className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">
                        {result.details.transcript}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border/50 rounded-3xl p-6"
            >
              <h3 className="text-lg font-bold mb-6 text-center">Confidence Scores</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    innerRadius="30%" 
                    outerRadius="100%" 
                    data={chartData} 
                    startAngle={180} 
                    endAngle={0}
                  >
                    <RadialBar
                      label={{ fill: '#fff', position: 'insideStart' }}
                      background
                      dataKey='score'
                      cornerRadius={10}
                    />
                    <Legend 
                      iconSize={10} 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-4 bg-secondary/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Authenticity</p>
                  <p className={cn("text-2xl font-bold font-mono", isReal ? "text-green-500" : "text-red-500")}>
                    {result.authenticityScore}%
                  </p>
                </div>
                <div className="text-center p-4 bg-secondary/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
                  <p className="text-2xl font-bold font-mono text-primary">
                    {result.sentimentScore}%
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border/50 rounded-3xl p-6"
            >
              <h3 className="text-lg font-bold mb-4">File Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize font-medium">{result.fileType}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-mono text-xs uppercase">{result.fileName.split('.').pop()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Detected Faces</span>
                  <span className="font-medium">{result.details?.detectedFaces || 0}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
