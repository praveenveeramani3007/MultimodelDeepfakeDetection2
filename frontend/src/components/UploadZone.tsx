import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, File, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UploadZoneProps {
  onAnalyze: (data: any) => void;
  isAnalyzing: boolean;
}

export function UploadZone({ onAnalyze, isAnalyzing }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [activeTab, setActiveTab] = useState("file");
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB");
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
    if (activeTab === "file" && file) {
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
    } else if (activeTab === "text" && textContent) {
      const base64Text = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(textContent)))}`;
      onAnalyze({
        fileName: "text_analysis.txt",
        fileType: "text",
        fileData: base64Text
      });
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs defaultValue="file" onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 w-72 mx-auto bg-secondary/50 p-1">
          <TabsTrigger value="file" className="rounded-lg">Media File</TabsTrigger>
          <TabsTrigger value="text" className="rounded-lg">Analytic Text</TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="mt-8 transition-all">
          <div
            {...getRootProps()}
            className={cn(
              "relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 text-center cursor-pointer group overflow-hidden",
              isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-secondary/30",
              file ? "bg-secondary/30 border-primary/20" : "",
              isAnalyzing ? "pointer-events-none opacity-80" : ""
            )}
          >
            <input {...getInputProps()} />
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <File className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-display">{file.name}</h3>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}</p>
                  </div>
                  {!isAnalyzing && (
                    <button onClick={removeFile} className="absolute top-4 right-4 p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                    <UploadCloud className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-display">Image, Audio, or Video</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">Drag and drop or click to browse. Supported up to 10MB.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium animate-pulse">Running Scientific Models...</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="text" className="mt-8">
          <Card className="glass-panel border-white/5 overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              <Textarea
                placeholder="Paste the text content you want to analyze for linguistic patterns, sentiment, and authenticity markers..."
                className="min-h-[250px] border-none bg-transparent resize-none p-6 text-lg focus-visible:ring-0 leading-relaxed"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={isAnalyzing}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && <p className="mt-4 text-center text-destructive font-medium">{error}</p>}

      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || (activeTab === "file" && !file) || (activeTab === "text" && !textContent)}
          className="px-10 py-7 rounded-2xl text-xl font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:-translate-y-1 active:translate-y-0"
        >
          {isAnalyzing ? "Processing..." : "Start Technical Analysis"}
        </Button>
      </div>
    </div>
  );
}
