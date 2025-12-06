// src/components/AnalysisHistory.tsx
import { useEffect, useState } from "react";
import { getPredictions, type PredictionSummary } from "../api";

type SentimentFilter = "all" | "positive" | "negative";

export default function AnalysisHistory() {
  const [gameIdInput, setGameIdInput] = useState("");
  const [sentimentFilter, setSentimentFilter] =
    useState<SentimentFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionSummary[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const gameId =
        gameIdInput.trim() === "" ? undefined : Number(gameIdInput.trim());

      let sentiment: number | undefined;
      if (sentimentFilter === "positive") sentiment = 1;
      if (sentimentFilter === "negative") sentiment = -1;

      const data = await getPredictions({
        gameId: gameId && !Number.isNaN(gameId) ? gameId : undefined,
        sentiment,
        limit: 50,
        offset: 0,
      });

      setPredictions(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error while loading predictions.");
      }
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // load initial data with no filters
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApplyFilters() {
    loadData();
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Analysis history</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-300">Filter by game_id</label>
          <input
            type="number"
            value={gameIdInput}
            onChange={(e) => setGameIdInput(e.target.value)}
            placeholder="Any game"
            className="border border-slate-700 rounded px-2 py-1 w-40
                       bg-slate-900 text-slate-100 placeholder:text-slate-400
                       focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-300">Sentiment</label>
          <select
            value={sentimentFilter}
            onChange={(e) =>
              setSentimentFilter(e.target.value as SentimentFilter)
            }
            className="border border-slate-700 rounded px-2 py-1
                       bg-slate-900 text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="all">All</option>
            <option value="positive">Positive only</option>
            <option value="negative">Negative only</option>
          </select>
        </div>

        <button
          onClick={handleApplyFilters}
          disabled={loading}
          className="px-3 py-1.5 rounded border border-slate-600
                     bg-slate-800 hover:bg-slate-700 text-sm"
        >
          Apply filters
        </button>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {loading && (
        <div className="text-sm text-gray-400">Loading predictions...</div>
      )}

      {!loading && predictions.length === 0 && !error && (
        <div className="text-sm text-gray-400">
          No predictions found for the current filters.
        </div>
      )}

      <div className="border border-slate-800 rounded divide-y divide-slate-800">
        {predictions.map((p) => {
          const isExpanded = expandedId === p.prediction_id;
          const dateStr = new Date(p.data_predicao).toLocaleString();

          const shortText =
            p.review_text_raw.length > 140
              ? p.review_text_raw.slice(0, 140) + "..."
              : p.review_text_raw;

          return (
            <div
              key={p.prediction_id}
              className="p-3 flex flex-col gap-1 bg-slate-950/60"
            >
              <div className="flex justify-between gap-4">
                <div className="text-sm">
                  <div className="font-semibold">
                    #{p.prediction_id} · review {p.review_id} ·{" "}
                    {p.game_name} (game_id {p.game_id})
                  </div>
                  <div className="text-xs text-gray-400">
                    Model: {p.model_name} ({p.model_version}) · {dateStr}
                  </div>
                </div>

                <div className="text-sm text-right">
                  <div className="font-medium">
                    Sentiment:{" "}
                    <span
                      className={
                        p.sentimento_predito === 1
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {p.sentimento_str} ({p.sentimento_predito})
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="mt-1 text-xs text-sky-400 hover:text-sky-300 self-start"
                onClick={() =>
                  setExpandedId(isExpanded ? null : p.prediction_id)
                }
              >
                {isExpanded ? "Hide full review text" : "Show full review text"}
              </button>

              <div className="text-xs text-gray-200 whitespace-pre-wrap mt-1">
                {isExpanded ? p.review_text_raw : shortText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
