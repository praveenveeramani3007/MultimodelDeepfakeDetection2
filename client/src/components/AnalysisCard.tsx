import { motion } from "framer-motion";
import { FileAudio, FileImage, FileVideo, ShieldAlert, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { AnalysisResult } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  analysis: AnalysisResult;
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const isReal = analysis.authenticityLabel === "Real";
  const isPositive = analysis.sentimentLabel === "Positive";
  
  const Icon = analysis.fileType === "audio" ? FileAudio : analysis.fileType === "video" ? FileVideo : FileImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative flex justify-between items-start mb-4">
        <div className="p-3 bg-secondary rounded-xl text-primary">
          <Icon className="w-6 h-6" />
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
          isReal 
            ? "bg-green-500/10 text-green-500 border-green-500/20"
            : "bg-red-500/10 text-red-500 border-red-500/20"
        )}>
          {isReal ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
          {analysis.authenticityLabel?.toUpperCase()}
        </div>
      </div>

      <div className="relative space-y-1 mb-6">
        <h3 className="font-display font-semibold text-lg truncate" title={analysis.fileName}>
          {analysis.fileName}
        </h3>
        <p className="text-sm text-muted-foreground capitalize">
          {analysis.fileType} Analysis
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Authenticity</p>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-xl font-bold font-mono", isReal ? "text-green-500" : "text-red-500")}>
              {analysis.authenticityScore}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-xl font-bold font-mono",
              isPositive ? "text-green-500" : analysis.sentimentLabel === "Negative" ? "text-red-500" : "text-yellow-500"
            )}>
              {analysis.sentimentScore}%
            </span>
            <span className="text-xs text-muted-foreground/80">{analysis.sentimentLabel}</span>
          </div>
        </div>
      </div>

      <Link href={`/analysis/${analysis.id}`}>
        <button className="w-full relative py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-primary hover:text-white transition-all duration-200 group-hover:shadow-lg flex items-center justify-center gap-2">
          View Full Report
          <ArrowRight className="w-4 h-4" />
        </button>
      </Link>
    </motion.div>
  );
}
