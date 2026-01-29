import { motion } from "framer-motion";
import { ShieldCheck, BrainCircuit, Activity, Lock, ArrowRight } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Deepfake Detection",
      desc: "Advanced forensic analysis to verify authenticity of video and audio content."
    },
    {
      icon: Activity,
      title: "Sentiment Analysis",
      desc: "Understand emotional context across multimodal inputs with precision."
    },
    {
      icon: BrainCircuit,
      title: "AI-Powered",
      desc: "Built on state-of-the-art Gemini models for multimodal reasoning."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl">VeriSight</span>
          </div>
          <a href="/api/login">
            <button className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
              Login
            </button>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary border border-border text-xs font-semibold text-primary mb-6">
              AI-Powered Forensic Analysis
            </span>
            <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-8">
              Verify Truth in a <br />
              <span className="text-gradient-primary">Digital World</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Detect deepfakes, analyze sentiment, and verify content authenticity with our advanced multimodal forensic dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/api/login">
                <button className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  Get Started <ArrowRight className="w-5 h-5" />
                </button>
              </a>
              <button className="px-8 py-4 rounded-xl bg-secondary text-foreground font-bold text-lg hover:bg-secondary/80 border border-border transition-all">
                View Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-secondary/20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 text-center text-muted-foreground text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground text-lg">VeriSight</span>
          </div>
          <p>© 2024 VeriSight Analytics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
