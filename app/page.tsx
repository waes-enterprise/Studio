"use client";

import { useState } from "react";

interface Scene {
  sceneNumber: number;
  duration: string;
  camera: string;
  action: string;
  dialogue: string;
  engagement: string;
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState("comedy");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"cards" | "text">("cards");
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedScene, setCopiedScene] = useState<number | null>(null);

  const tones = [
    { value: "comedy", label: "😂 Comedy" },
    { value: "drama", label: "🎭 Drama" },
    { value: "thriller", label: "😱 Thriller" },
    { value: "romance", label: "❤️ Romance" },
    { value: "horror", label: "👻 Horror" },
    { value: "inspirational", label: "✨ Inspirational" },
    { value: "street", label: "🔥 Street/Real" },
    { value: "educational", label: "📚 Educational" },
  ];

  const generate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError("");
    setScenes([]);
    setRawText("");
    setCopiedAll(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim(), tone }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();

      if (data.scenes && data.scenes.length > 0) {
        setScenes(data.scenes);
      }

      if (data.rawText) {
        setRawText(data.rawText);
      }

      if (data.formatted) {
        setRawText(data.formatted);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    let text = "";
    if (rawText) {
      text = rawText;
    } else if (scenes.length > 0) {
      text = scenes
        .map(
          (s) =>
            `--- SCENE ${s.sceneNumber} (${s.duration}) ---\n📹 Camera: ${s.camera}\n🎬 Action: ${s.action}\n💬 Dialogue: ${s.dialogue}\n📊 Engagement: ${s.engagement}`
        )
        .join("\n\n");
    }
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const copyScene = (scene: Scene) => {
    const text = `--- SCENE ${scene.sceneNumber} (${scene.duration}) ---\n📹 Camera: ${scene.camera}\n🎬 Action: ${scene.action}\n💬 Dialogue: ${scene.dialogue}\n📊 Engagement: ${scene.engagement}`;
    navigator.clipboard.writeText(text);
    setCopiedScene(scene.sceneNumber);
    setTimeout(() => setCopiedScene(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/30 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-black text-lg">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                ViralScript AI
              </h1>
              <p className="text-xs text-gray-400">African Short-Form Video Scripts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView("cards")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === "cards"
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  : "text-gray-400 hover:text-white border border-white/10"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setView("text")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === "text"
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  : "text-gray-400 hover:text-white border border-white/10"
              }`}
            >
              Text
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Input Section */}
        <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6 mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            💡 Your Video Idea
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. A guy tries to impress his girlfriend's Nigerian mom by cooking jollof rice but everything goes wrong..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 resize-none mb-4"
            rows={3}
          />

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🎭 Tone / Vibe
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {tones.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      tone === t.value
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                        : "bg-black/30 text-gray-400 border border-white/5 hover:border-white/20"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={loading || !idea.trim()}
              className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-orange-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap text-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                "⚡ Generate Script"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Results */}
        {(scenes.length > 0 || rawText) && (
          <div className="space-y-6">
            {/* Copy All Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                🎬 Your Script{" "}
                <span className="text-gray-500 font-normal text-sm">
                  ({scenes.length > 0 ? `${scenes.length} scenes` : "ready to copy"})
                </span>
              </h2>
              <button
                onClick={copyAll}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  copiedAll
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {copiedAll ? "✅ Copied!" : "📋 Copy All"}
              </button>
            </div>

            {/* Card View */}
            {view === "cards" && scenes.length > 0 && (
              <div className="space-y-4">
                {scenes.map((scene) => (
                  <div
                    key={scene.sceneNumber}
                    className="bg-gray-900/60 border border-white/10 rounded-2xl p-5 hover:border-yellow-500/20 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                          SCENE {scene.sceneNumber}
                        </span>
                        <span className="text-gray-500 text-xs">⏱ {scene.duration}</span>
                      </div>
                      <button
                        onClick={() => copyScene(scene)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all opacity-0 group-hover:opacity-100 ${
                          copiedScene === scene.sceneNumber
                            ? "bg-green-500/20 text-green-400"
                            : "bg-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {copiedScene === scene.sceneNumber ? "✅ Copied" : "📋 Copy"}
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300">
                        <span className="text-gray-500 font-medium">📹 Camera:</span>{" "}
                        {scene.camera}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-500 font-medium">🎬 Action:</span>{" "}
                        {scene.action}
                      </p>
                      <p className="text-gray-200 font-medium">
                        <span className="text-gray-500">💬 Dialogue:</span> {scene.dialogue}
                      </p>
                      <p className="text-gray-400">
                        <span className="text-gray-500 font-medium">📊 Engagement:</span>{" "}
                        {scene.engagement}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Text View */}
            {view === "text" && rawText && (
              <div className="relative">
                <pre className="bg-gray-900/60 border border-white/10 rounded-2xl p-6 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed select-all">
                  {rawText}
                </pre>
              </div>
            )}

            {/* Text View fallback when only scenes exist */}
            {view === "text" && !rawText && scenes.length > 0 && (
              <div className="relative">
                <pre className="bg-gray-900/60 border border-white/10 rounded-2xl p-6 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed select-all">
                  {scenes
                    .map(
                      (s) =>
                        `--- SCENE ${s.sceneNumber} (${s.duration}) ---\n📹 Camera: ${s.camera}\n🎬 Action: ${s.action}\n💬 Dialogue: ${s.dialogue}\n📊 Engagement: ${s.engagement}`
                    )
                    .join("\n\n")}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && scenes.length === 0 && !rawText && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">
              Ready to Create Viral Scripts
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Drop your video idea above, pick a tone, and hit Generate. Your
              60-second African-style script will be ready in seconds.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 py-6 text-center text-xs text-gray-600">
        ViralScript AI — Built for African Creators 🌍
      </footer>
    </div>
  );
}
