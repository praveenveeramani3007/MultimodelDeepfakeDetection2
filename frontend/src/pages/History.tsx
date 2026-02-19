import { Sidebar } from "@/components/Sidebar";
import { useAnalysisHistory, useDeleteAnalysis } from "@/hooks/use-analysis";
import { Loader2, Trash2, FileImage, FileAudio, FileVideo, Shield, ArrowRight, Calendar, Activity } from "lucide-react";
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
      case 'text': return <Activity className="w-5 h-5" />;
      default: return <FileImage className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 p-3 pt-20 xxs:p-4 sm:p-6 lg:p-12 lg:pt-12 pb-24 transition-all duration-300 overflow-x-hidden">
        <header className="mb-4 xxs:mb-6 lg:mb-10">
          <h1 className="text-xl xxs:text-2xl sm:text-3xl lg:text-4xl font-display font-bold mb-1 xxs:mb-2">Forensic Archives</h1>
          <p className="text-xs xxs:text-sm sm:text-base text-muted-foreground">Historical records of verified digital specimens.</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Header - Hidden on Mobile */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5 bg-muted/20 rounded-t-2xl">
              <div className="col-span-1">Ref</div>
              <div className="col-span-4">Specimen Details</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Origin Ratio</div>
              <div className="col-span-2">Classification</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="space-y-3">
              {analyses?.map((item) => {
                const isReal = item.authenticityLabel === "Real" || item.authenticityLabel === "Likely Real";
                return (
                  <div
                    key={item.id}
                    className="group bg-card border border-white/5 rounded-2xl hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 overflow-hidden"
                  >
                    <div className="md:grid grid-cols-12 gap-4 p-3 sm:p-4 md:p-6 items-center">
                      {/* Ref ID */}
                      <div className="hidden md:block col-span-1">
                        <span className="text-xs font-mono text-muted-foreground">VS-{item.id.toString().padStart(3, '0')}</span>
                      </div>

                      {/* Name & Type */}
                      <div className="col-span-12 md:col-span-4 mb-3 md:mb-0 flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="p-2 xxs:p-2.5 sm:p-3 rounded-xl bg-secondary/50 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                          {getIcon(item.fileType)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate text-xs xxs:text-sm sm:text-base pr-2" title={item.fileName}>{item.fileName}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[9px] xxs:text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">{item.fileType}</span>
                            <span className="md:hidden text-[9px] xxs:text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {format(new Date(item.createdAt || new Date()), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Date - Desktop */}
                      <div className="hidden md:block col-span-2 text-sm text-muted-foreground font-medium">
                        {format(new Date(item.createdAt || new Date()), 'MMM d, yyyy')}
                      </div>

                      {/* Ratio */}
                      <div className="col-span-7 xxxs:col-span-6 xxs:col-span-7 sm:col-span-6 md:col-span-2 mb-3 md:mb-0 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", isReal ? 'bg-primary' : 'bg-red-500')}
                              style={{ width: `${item.authenticityScore}%` }}
                            />
                          </div>
                          <span className="text-[9px] xxs:text-[10px] font-mono font-bold">{item.authenticityScore}%</span>
                        </div>
                        <p className="text-[8px] xxs:text-[9px] text-muted-foreground uppercase font-bold mt-1">Consistency</p>
                      </div>

                      {/* Status */}
                      <div className="col-span-5 xxxs:col-span-6 xxs:col-span-5 sm:col-span-6 md:col-span-2 flex items-center mb-3 md:mb-0 justify-end md:justify-start">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2 xxs:px-2.5 py-1 rounded-full text-[9px] xxs:text-[10px] font-bold uppercase tracking-tight border whitespace-nowrap",
                          isReal
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          <Shield className="w-3 h-3" />
                          {item.authenticityLabel}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-12 md:col-span-1 flex justify-end gap-2 sm:gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                        <Link href={`/analysis/${item.id}`} className="flex-1 md:flex-none">
                          <button className="w-full md:w-auto p-2 rounded-xl bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </Link>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="flex-1 md:flex-none p-2 rounded-xl bg-muted/50 hover:bg-destructive hover:text-destructive-foreground transition-all flex items-center justify-center">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="w-[90vw] max-w-lg bg-card border-white/10 glass-panel p-4 xxs:p-6 rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-lg xxs:text-xl font-bold">Purge Evidence Record?</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs xxs:text-sm sm:text-base text-muted-foreground">
                                This action is irreversible. The forensic data for "{item.fileName}" will be permanently erased from the lab archives.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                              <AlertDialogCancel className="rounded-xl mt-0">Retain Record</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteAnalysis(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                                Confirm Purge
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(!analyses || analyses.length === 0) && (
                <div className="p-10 sm:p-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileImage className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold mb-2">No archived records</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">Complete a new analysis to populate the lab archives.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
