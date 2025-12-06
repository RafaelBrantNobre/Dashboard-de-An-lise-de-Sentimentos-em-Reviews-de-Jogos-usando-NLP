// src/App.tsx
import { useState } from "react";
import GameList from "./components/GameList";
import GameDashboard from "./components/GameDashboard";
import SentimentLab from "./components/SentimentLab";
import ReviewInspector from "./components/ReviewInspector";
import AnalysisHistory from "./components/AnalysisHistory";
import type { Game } from "./api";

type View = "games" | "dashboard" | "lab" | "reviewInspector" | "analysisHistory";

function App() {
  const [view, setView] = useState<View>("games");
  const [selectedGame, setSelectedGame] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleSelectGame = (game: Game) => {
    setSelectedGame({ id: game.game_id, name: game.game_name });
    setView("dashboard");
  };

  const handleGoToDashboard = () => {
    if (!selectedGame) {
      setView("games");
      return;
    }
    setView("dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Steam Reviews NLP Dashboard
            </h1>
            <p className="text-sm text-gray-400">
              Database Seminar · Statistical summary of Steam game reviews
            </p>
          </div>

          <nav className="flex flex-wrap gap-2 text-sm">
            <button
              className={`px-3 py-1.5 rounded border ${
                view === "games"
                  ? "bg-slate-100 text-slate-900 border-slate-100"
                  : "bg-slate-800 border-slate-700 hover:bg-slate-700"
              }`}
              onClick={() => setView("games")}
            >
              Games
            </button>

            <button
              className={`px-3 py-1.5 rounded border ${
                view === "dashboard"
                  ? "bg-slate-100 text-slate-900 border-slate-100"
                  : "bg-slate-800 border-slate-700 hover:bg-slate-700"
              } ${!selectedGame ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleGoToDashboard}
              disabled={!selectedGame}
            >
              Game dashboard
            </button>

            <button
              className={`px-3 py-1.5 rounded border ${
                view === "lab"
                  ? "bg-slate-100 text-slate-900 border-slate-100"
                  : "bg-slate-800 border-slate-700 hover:bg-slate-700"
              }`}
              onClick={() => setView("lab")}
            >
              Sentiment lab
            </button>

            <button
              className={`px-3 py-1.5 rounded border ${
                view === "reviewInspector"
                  ? "bg-slate-100 text-slate-900 border-slate-100"
                  : "bg-slate-800 border-slate-700 hover:bg-slate-700"
              }`}
              onClick={() => setView("reviewInspector")}
            >
              Review inspector
            </button>

            <button
              className={`px-3 py-1.5 rounded border ${
                view === "analysisHistory"
                  ? "bg-slate-100 text-slate-900 border-slate-100"
                  : "bg-slate-800 border-slate-700 hover:bg-slate-700"
              }`}
              onClick={() => setView("analysisHistory")}
            >
              Analysis history
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {view === "games" && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium mb-2">Registered games</h2>
            <GameList onSelectGame={handleSelectGame} />
          </section>
        )}

        {view === "dashboard" && (
          <section className="space-y-4">
            {!selectedGame ? (
              <p className="text-gray-400">
                No game selected. Go back to the &quot;Games&quot; tab and
                choose a game.
              </p>
            ) : (
              <GameDashboard
                gameId={selectedGame.id}
                gameName={selectedGame.name}
              />
            )}
          </section>
        )}

        {view === "lab" && (
          <section className="space-y-4">
            <SentimentLab />
          </section>
        )}

        {view === "reviewInspector" && (
          <section className="space-y-4">
            <ReviewInspector />
          </section>
        )}

        {view === "analysisHistory" && (
          <section className="space-y-4">
            <AnalysisHistory />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
