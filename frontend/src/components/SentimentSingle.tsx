import type { PredictResponse, Game, Sentiment } from "../api";

type Props = {
  text: string;
  setText: (s: string) => void;
  result: PredictResponse | null;
  loading: boolean;
  error: string | null;
  games: Game[];
  gamesLoading: boolean;
  gamesError: string | null;
  selectedGameId: number | null;
  setSelectedGameId: (n: number | null) => void;
  reviewScoreRaw: Sentiment | null;
  setReviewScoreRaw: (n: Sentiment) => void;
  handleAnalyze: () => Promise<void>;
  handleSave: () => Promise<void>;
  saveLoading: boolean;
  saveMessage: string | null;
};

export default function SentimentSingle({
  text,
  setText,
  result,
  loading,
  error,
  games,
  gamesLoading,
  gamesError,
  selectedGameId,
  setSelectedGameId,
  reviewScoreRaw,
  setReviewScoreRaw,
  handleAnalyze,
  handleSave,
  saveLoading,
  saveMessage,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1">
          Review text
        </label>
        <textarea
          className="w-full h-40 p-3 rounded bg-slate-900 border border-slate-700 text-slate-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Type a review to analyze..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
        />
        <p className="mt-1 text-xs text-slate-500">
          The text will be sent to the API, classified by the Naive Bayes
          model and the predicted sentiment will be shown below.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Game
          </label>
          {gamesLoading && (
            <p className="text-xs text-slate-400">Loading games...</p>
          )}
          {gamesError && <p className="text-xs text-rose-400">{gamesError}</p>}
          {!gamesLoading && !gamesError && (
            <select
              className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-slate-100 text-sm"
              value={selectedGameId ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedGameId(value ? Number(value) : null);
              }}
            >
              <option value="">Select a game...</option>
              {games.map((game) => (
                <option key={game.game_id} value={game.game_id}>
                  {game.game_name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Original user score
          </label>
          <div className="flex gap-4 text-sm text-slate-100">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                className="accent-sky-500"
                checked={reviewScoreRaw === 1}
                onChange={() => setReviewScoreRaw(1)}
              />
              <span>Recommends the game (1)</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                className="accent-sky-500"
                checked={reviewScoreRaw === -1}
                onChange={() => setReviewScoreRaw(-1)}
              />
              <span>Does not recommend (-1)</span>
            </label>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            This value is stored as <code>review_score_raw</code> in{' '}
            <code>Reviews_Raw</code>.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="px-4 py-2 rounded bg-sky-500 hover:bg-sky-400 text-slate-900 font-medium disabled:opacity-50"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze sentiment"}
        </button>

        <button
          className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-medium disabled:opacity-50"
          onClick={handleSave}
          disabled={saveLoading || !result}
        >
          {saveLoading ? "Saving..." : "Save review to database"}
        </button>

        {error && <span className="text-xs text-rose-400">{error}</span>}
        {saveMessage && (
          <span className="text-xs text-emerald-400">{saveMessage}</span>
        )}
      </div>

      {result && (
        <div className="mt-4 rounded border border-slate-700 bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">
            Prediction result
          </h3>
          <p className="text-sm text-slate-100">
            <span className="font-medium">Predicted sentiment:</span>{' '}
            <span
              className={
                result.sentimento_predito === 1
                  ? "text-emerald-400 font-semibold"
                  : "text-rose-400 font-semibold"
              }
            >
              {result.sentimento_str} ({result.sentimento_predito})
            </span>
          </p>
          <div className="mt-2">
            <p className="text-xs text-slate-400 mb-1">Analyzed text:</p>
            <p className="text-sm text-slate-200 whitespace-pre-line">
              {result.review}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
