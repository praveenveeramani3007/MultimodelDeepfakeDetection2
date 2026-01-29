import { useAnalysisHistory } from "@/hooks/use-analysis";
import { Sidebar } from "@/components/Sidebar";
import { AnalysisCard } from "@/components/AnalysisCard";
import { Loader2, Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  const { data: analyses, isLoading } = useAnalysisHistory();

  // Get recent 3 items
  const recentAnalyses = analyses?.slice(0, 3) || [];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 lg:p-12">
        <header className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl lg:text-5xl font-display font-bold mb-4"
          >
            Welcome Back
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground"
          >
            Your forensic dashboard is ready. Start a new analysis or review recent cases.
          </motion.p>
        </header>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold font-display">Recent Activity</h2>
            <Link href="/history">
              <span className="text-sm font-medium text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1 group">
                View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : recentAnalyses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentAnalyses.map((analysis) => (
                <AnalysisCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/50 rounded-3xl border border-dashed border-border">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No analyses yet</h3>
              <p className="text-muted-foreground mb-6">Upload your first file to get started</p>
              <Link href="/upload">
                <button className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
                  New Analysis
                </button>
              </Link>
            </div>
          )}
        </section>
        
        <section>
          <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5 mask-image-gradient" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-display font-bold mb-4">Start New Analysis</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Use our advanced multimodal AI models to detect deepfakes, analyze sentiment, and verify content authenticity.
              </p>
              <Link href="/upload">
                <button className="px-8 py-4 rounded-xl bg-foreground text-background font-bold text-lg hover:bg-white/90 shadow-xl transition-all hover:scale-105 active:scale-95">
                  Launch Analyzer
                </button>
              </Link>
            </div>
            {/* Abstract visual element */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/30 blur-[100px] rounded-full pointer-events-none" />
          </div>
        </section>
      </main>
    </div>
  );
}
