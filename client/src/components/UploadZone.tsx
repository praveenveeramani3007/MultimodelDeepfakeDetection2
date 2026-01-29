import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, File, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisInput } from "@shared/routes";

interface UploadZoneProps {
  onAnalyze: (data: AnalysisInput) => void;
  isAnalyzing: boolean;
}

export function UploadZone({ onAnalyze, isAnalyzing }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected.size > 8 * 1024 * 1024) {
      setError("File size must be under 8MB");
      return;
    }
    setFile(selected);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'audio/*': [],
      'video/*': []
    },
    maxFiles: 1,
    disabled: isAnalyzing
  });

  const handleAnalyze = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      const type = file.type.split('/')[0] as 'image' | 'audio' | 'video';
      
      onAnalyze({
        fileName: file.name,
        fileType: type,
        fileData: base64String
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 text-center cursor-pointer group overflow-hidden",
          isDragActive 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-border hover:border-primary/50 hover:bg-secondary/30",
          file ? "bg-secondary/50 border-primary/20" : "",
          isAnalyzing ? "pointer-events-none opacity-80" : ""
        )}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-2">
                <File className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-medium font-display">{file.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                </p>
              </div>
              
              {!isAnalyzing && (
                <button
                  onClick={removeFile}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-black/5">
                <UploadCloud className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display text-foreground">
                  {isDragActive ? "Drop it like it's hot" : "Upload your file"}
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Drag and drop or click to browse. Supports Image, Audio, and Video files up to 8MB.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isAnalyzing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium animate-pulse">Analyzing Content...</p>
            <p className="text-sm text-muted-foreground">Running AI forensic models</p>
          </div>
        )}
      </div>

      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-destructive font-medium"
        >
          {error}
        </motion.p>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={!file || isAnalyzing}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
        >
          {isAnalyzing ? "Processing..." : "Start Analysis"}
        </button>
      </div>
    </div>
  );
}
