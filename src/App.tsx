import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { Upload, Play, Loader2, Video, Image as ImageIcon, Sparkles, AlertCircle, CheckCircle2, Key } from 'lucide-react';
import { cn } from './lib/utils';
import { generateVideo, checkApiKey, openApiKeySelector } from './services/geminiService';

interface GeneratedVideo {
  url: string;
  prompt: string;
  timestamp: Date;
}

const LOADING_MESSAGES = [
  "Analyzing your image...",
  "Imagining the motion...",
  "Applying cinematic physics...",
  "Rendering high-quality frames...",
  "Almost there, finishing touches...",
  "Polishing the final animation...",
];

export default function App() {
  const [image, setImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");

  useEffect(() => {
    const checkKey = async () => {
      const hasKey = await checkApiKey();
      setHasApiKey(hasKey);
    };
    checkKey();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    return () => {
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
    };
  }, [image?.preview]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        if (image?.preview) URL.revokeObjectURL(image.preview);
        setImage({
          data: base64,
          mimeType: file.type,
          preview: URL.createObjectURL(file),
        });
      };
      reader.readAsDataURL(file);
    }
  }, [image?.preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  } as any);

  const handleGenerate = async () => {
    if (!hasApiKey) {
      await openApiKeySelector();
      setHasApiKey(true);
      return;
    }

    if (!image) return;

    setIsGenerating(true);
    setError(null);
    setLoadingMessageIndex(0);

    try {
      const videoUrl = await generateVideo({
        prompt: prompt || "Animate this image with cinematic motion.",
        image: { data: image.data, mimeType: image.mimeType },
        aspectRatio,
      });

      setGeneratedVideos((prev) => [
        { url: videoUrl, prompt: prompt || "Cinematic Animation", timestamp: new Date() },
        ...prev,
      ]);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Something went wrong during video generation.";
      setError(errorMessage);
      
      // Handle permission or missing entity errors by resetting key state
      if (
        errorMessage.includes("Requested entity was not found") || 
        errorMessage.includes("permission") || 
        errorMessage.includes("403")
      ) {
        setHasApiKey(false);
        setError("API Key permission error. Please ensure you have selected a paid Google Cloud project key with Veo access.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0502] text-white font-sans selection:bg-orange-500/30">
      {/* Immersive Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/20 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-white/60">Powered by Veo 3.1</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-light tracking-tight mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              Veo Animator
            </h1>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
              Transform your static images into cinematic masterpieces with the power of generative AI.
            </p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Controls Section */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="space-y-6">
                {/* API Key Status */}
                {!hasApiKey && (
                  <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm text-orange-200/80 leading-snug">
                        To use Veo, you need to select a paid Google Cloud project API key.
                      </p>
                      <button
                        onClick={() => openApiKeySelector()}
                        className="text-xs font-semibold uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
                      >
                        <Key className="w-3 h-3" />
                        Select API Key
                      </button>
                    </div>
                  </div>
                )}

                {/* Dropzone */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-widest text-white/40 ml-1">Source Image</label>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "relative aspect-video rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden group cursor-pointer",
                      isDragActive ? "border-orange-500/50 bg-orange-500/5" : "border-white/10 hover:border-white/20 bg-white/[0.02]",
                      image ? "border-solid" : ""
                    )}
                  >
                    <input {...getInputProps()} />
                    {image ? (
                      <>
                        <img src={image.preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-sm font-medium">Change Image</p>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-white/40" />
                        </div>
                        <p className="text-sm text-white/60 mb-1">Drag & drop your image here</p>
                        <p className="text-xs text-white/30">Supports PNG, JPG, WebP</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt Input */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-widest text-white/40 ml-1">Motion Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe how you want the image to move... (e.g., 'Cinematic camera pan, slow motion water ripples')"
                    className="w-full h-32 bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40 transition-all resize-none"
                  />
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-widest text-white/40 ml-1">Aspect Ratio</label>
                    <div className="flex bg-white/[0.02] rounded-xl p-1 border border-white/10">
                      <button
                        onClick={() => setAspectRatio("16:9")}
                        className={cn(
                          "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                          aspectRatio === "16:9" ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                        )}
                      >
                        16:9
                      </button>
                      <button
                        onClick={() => setAspectRatio("9:16")}
                        className={cn(
                          "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                          aspectRatio === "9:16" ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                        )}
                      >
                        9:16
                      </button>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !image}
                  className={cn(
                    "w-full py-4 rounded-2xl font-semibold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-xl",
                    isGenerating || !image
                      ? "bg-white/5 text-white/20 cursor-not-allowed"
                      : "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/20 active:scale-[0.98]"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Animate Image
                    </>
                  )}
                </button>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-200/80 leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="min-h-[400px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-light text-white/80 flex items-center gap-2">
                  <Video className="w-5 h-5 text-orange-400" />
                  Generations
                </h2>
                <div className="text-xs font-medium text-white/30 uppercase tracking-widest">
                  {generatedVideos.length} Result{generatedVideos.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex-1 space-y-8">
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-video rounded-3xl overflow-hidden bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center text-center p-12"
                  >
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent animate-pulse" />
                    </div>
                    {image && (
                      <img src={image.preview} alt="Animating" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
                    )}
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-6 relative z-10" />
                    <h3 className="text-xl font-serif font-light mb-2 relative z-10">Creating Magic</h3>
                    <p className="text-sm text-white/40 max-w-xs relative z-10">{LOADING_MESSAGES[loadingMessageIndex]}</p>
                  </motion.div>
                )}

                {!isGenerating && image && generatedVideos.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                  >
                    <div className={cn("relative w-full overflow-hidden", aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16] max-h-[600px] mx-auto")}>
                      <img src={image.preview} alt="Current Selection" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-12 h-12 text-white/80 mb-4" />
                        <p className="text-sm font-medium">Ready to Animate</p>
                      </div>
                    </div>
                    <div className="p-6 border-t border-white/10">
                      <div className="space-y-1">
                        <p className="text-sm text-white/60 italic font-light">
                          {prompt || "No prompt specified - using default cinematic motion"}
                        </p>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest">
                          Source Image Uploaded
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <AnimatePresence mode="popLayout">
                  {generatedVideos.map((video, index) => (
                    <motion.div
                      key={video.url}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                    >
                      <div className={cn("relative w-full overflow-hidden", aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16] max-h-[600px] mx-auto")}>
                        <video
                          src={video.url}
                          controls
                          autoPlay
                          loop
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6 border-t border-white/10">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-white/80 font-medium leading-relaxed">
                              {video.prompt}
                            </p>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest">
                              Generated {video.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <a
                            href={video.url}
                            download="veo-animation.mp4"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                            title="Download Video"
                          >
                            <Upload className="w-4 h-4 text-white/60 rotate-180" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {!isGenerating && generatedVideos.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-dashed border-white/10 rounded-3xl opacity-40">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <ImageIcon className="w-8 h-8 text-white/40" />
                    </div>
                    <h3 className="text-lg font-serif font-light mb-2">No animations yet</h3>
                    <p className="text-sm text-white/40 max-w-xs">Upload an image and click animate to see the magic happen.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 mt-24">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-40">
            <Video className="w-4 h-4" />
            <span className="text-xs font-serif italic tracking-wider">Veo Animator</span>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-medium uppercase tracking-[0.2em] text-white/20">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Billing Docs</a>
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
