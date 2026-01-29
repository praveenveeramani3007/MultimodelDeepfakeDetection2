import { Sidebar } from "@/components/Sidebar";
import { UploadZone } from "@/components/UploadZone";
import { useUploadAnalysis } from "@/hooks/use-analysis";
import { motion } from "framer-motion";

export default function Upload() {
  const { mutate: analyze, isPending } = useUploadAnalysis();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12 flex flex-col items-center justify-center min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              Upload Content
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Analyze images, audio, or video for AI manipulation and sentiment patterns.
            </p>
          </div>

          <UploadZone onAnalyze={analyze} isAnalyzing={isPending} />
        </motion.div>
      </main>
    </div>
  );
}
