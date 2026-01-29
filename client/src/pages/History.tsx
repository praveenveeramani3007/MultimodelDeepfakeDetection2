import { Sidebar } from "@/components/Sidebar";
import { useAnalysisHistory, useDeleteAnalysis } from "@/hooks/use-analysis";
import { Loader2, Trash2, FileImage, FileAudio, FileVideo, Shield, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function History() {
  const { data: analyses, isLoading } = useAnalysisHistory();
  const { mutate: deleteAnalysis } = useDeleteAnalysis();

  const getIcon = (type: string) => {
    switch (type) {
      case 'audio': return <FileAudio className="w-5 h-5" />;
      case 'video': return <FileVideo className="w-5 h-5" />;
      default: return <FileImage className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Analysis History</h1>
          <p className="text-muted-foreground">Manage and review your past forensic reports.</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-lg">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4 pl-4">File Name</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Authenticity</div>
              <div className="col-span-2">Sentiment</div>
              <div className="col-span-2 text-right pr-4">Actions</div>
            </div>

            <div className="divide-y divide-border/50">
              {analyses?.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 transition-colors group">
                  <div className="col-span-4 flex items-center gap-3 pl-4">
                    <div className="p-2 rounded-lg bg-secondary text-primary">
                      {getIcon(item.fileType)}
                    </div>
                    <div>
                      <p className="font-medium truncate pr-4" title={item.fileName}>{item.fileName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.fileType}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {format(new Date(item.createdAt || new Date()), 'MMM d, yyyy')}
                  </div>

                  <div className="col-span-2">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                      item.authenticityLabel === 'Real' 
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      <Shield className="w-3 h-3" />
                      {item.authenticityLabel}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", item.sentimentLabel === 'Positive' ? 'bg-green-500' : item.sentimentLabel === 'Negative' ? 'bg-red-500' : 'bg-yellow-500')}
                          style={{ width: `${item.sentimentScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono w-8">{item.sentimentScore}%</span>
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-end gap-2 pr-4">
                    <Link href={`/analysis/${item.id}`}>
                      <button className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Analysis Record?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the analysis report for "{item.fileName}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAnalysis(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              
              {(!analyses || analyses.length === 0) && (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">No analysis history found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
