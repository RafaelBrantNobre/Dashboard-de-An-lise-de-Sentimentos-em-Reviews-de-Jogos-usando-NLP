
// src/components/SentimentLab.tsx
import { useEffect, useState } from "react";
import SentimentSingle from "./SentimentSingle";
import SentimentCsv from "./SentimentCsv";
import {
  predictText,
  predictAndSaveText,
  predictBatchCsv,
  saveBatchCsv,
  type PredictResponse,
  type Sentiment,
  getGames,
  type Game,
  type BatchCsvResult,
  type BatchCsvSaveResult,
  type SaveTextPayload,
} from "../api";

type LabMode = "single" | "csv";

function SentimentLab() {
  const [mode, setMode] = useState<LabMode>("single");

// ----- Single text mode -----
const [text, setText] = useState("");
const [result, setResult] = useState<PredictResponse | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const [games, setGames] = useState<Game[]>([]);
const [gamesLoading, setGamesLoading] = useState(false);
const [gamesError, setGamesError] = useState<string | null>(null);
const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
const [reviewScoreRaw, setReviewScoreRaw] = useState<Sentiment | null>(null);

const [saveLoading, setSaveLoading] = useState(false);
const [saveMessage, setSaveMessage] = useState<string | null>(null);

// ----- CSV mode -----
const [csvFile, setCsvFile] = useState<File | null>(null);
  const [batchResult, setBatchResult] = useState<BatchCsvResult | null>(null);
const [batchLoading, setBatchLoading] = useState(false);
const [batchError, setBatchError] = useState<string | null>(null);

const [batchSaveLoading, setBatchSaveLoading] = useState(false);
const [batchSaveError, setBatchSaveError] = useState<string | null>(null);
  const [batchSaveResult, setBatchSaveResult] = useState<BatchCsvSaveResult | null>(null);

// Load games so user can select a game when saving a free-text review
useEffect(() => {
  const fetchGames = async () => {
    try {
      setGamesLoading(true);
      setGamesError(null);
      const data = await getGames();
      setGames(data);
    } catch (e) {
      console.error(e);
      setGamesError("Failed to load games.");
    } finally {
      setGamesLoading(false);
    }
  };

  fetchGames();
}, []);

// ----- Handlers: single text mode -----

const handleAnalyze = async () => {
  setError(null);
  setSaveMessage(null);
  setResult(null);

  if (!text.trim()) {
    setError("Type a review text to analyze.");
    return;
  }

  try {
    setLoading(true);
    const prediction = await predictText(text);
    setResult(prediction);
  } catch (e) {
    console.error(e);
    setError("Failed to analyze sentiment. Try again later.");
  } finally {
    setLoading(false);
  }
};

const handleSave = async () => {
  setSaveMessage(null);
  setError(null);

  if (!result) {
    setError("Run the sentiment analysis before saving.");
    return;
  }

  if (!selectedGameId) {
    setError("Select a game to associate with this review.");
    return;
  }

  if (reviewScoreRaw !== 1 && reviewScoreRaw !== -1) {
    setError("Select the original score (recommend or not).");
    return;
  }

  try {
    setSaveLoading(true);

    const payload: SaveTextPayload = {
      review: text,
      game_id: selectedGameId as number,
      review_score_raw: reviewScoreRaw as Sentiment,
    };

    await predictAndSaveText(payload);
    setSaveMessage("Review successfully saved to the database.");
  } catch (e) {
    console.error(e);
    setError("Could not save review. Check the backend and try again.");
  } finally {
    setSaveLoading(false);
  }
};

// ----- Handlers: CSV mode -----

const handleCsvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setBatchResult(null);
  setBatchError(null);
  setBatchSaveResult(null);
  setBatchSaveError(null);
  const file = event.target.files?.[0] ?? null;
  setCsvFile(file);
};

const handleAnalyzeCsv = async () => {
  setBatchError(null);
  setBatchResult(null);

  if (!csvFile) {
    setBatchError("Select a CSV file to analyze.");
    return;
  }

    try {
      setBatchLoading(true);
      const data = await predictBatchCsv(csvFile as File);
      setBatchResult(data);
    } catch (e) {
      console.error(e);
      setBatchError("Could not analyze the CSV file. Check the format and try again.");
    } finally {
      setBatchLoading(false);
    }
};

const handleSaveCsv = async () => {
  setBatchSaveError(null);
  setBatchSaveResult(null);

  if (!csvFile) {
    setBatchSaveError("Select a CSV file before saving.");
    return;
  }

    try {
      setBatchSaveLoading(true);
      const data = await saveBatchCsv(csvFile as File);
      setBatchSaveResult(data);
    } catch (e) {
      console.error(e);
      setBatchSaveError(
        "Could not save reviews from CSV. Check the file format and the backend."
      );
    } finally {
      setBatchSaveLoading(false);
    }
};

// ----- Render helpers -----





// ----- Main render -----

return (
  <div className="space-y-4">
    <header className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">
          Sentiment Lab
        </h2>
        <p className="text-sm text-slate-400">
          Experiment with the Naive Bayes model using free text or CSV files.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 text-xs">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-l-lg ${
            mode === "single"
              ? "bg-sky-500 text-slate-900 font-semibold"
              : "text-slate-300 hover:bg-slate-800"
          }`}
          onClick={() => setMode("single")}
        >
          Single review
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-r-lg ${
            mode === "csv"
              ? "bg-sky-500 text-slate-900 font-semibold"
              : "text-slate-300 hover:bg-slate-800"
          }`}
          onClick={() => setMode("csv")}
        >
          CSV batch
        </button>
      </div>
    </header>

    {mode === "single" ? (
      <SentimentSingle
        text={text}
        setText={setText}
        result={result}
        loading={loading}
        error={error}
        games={games}
        gamesLoading={gamesLoading}
        gamesError={gamesError}
        selectedGameId={selectedGameId}
        setSelectedGameId={setSelectedGameId}
        reviewScoreRaw={reviewScoreRaw}
        setReviewScoreRaw={setReviewScoreRaw}
        handleAnalyze={handleAnalyze}
        handleSave={handleSave}
        saveLoading={saveLoading}
        saveMessage={saveMessage}
      />
    ) : (
      <SentimentCsv
        csvFile={csvFile}
        handleCsvChange={handleCsvChange}
        handleAnalyzeCsv={handleAnalyzeCsv}
        handleSaveCsv={handleSaveCsv}
        batchResult={batchResult}
        batchLoading={batchLoading}
        batchError={batchError}
        batchSaveLoading={batchSaveLoading}
        batchSaveError={batchSaveError}
        batchSaveResult={batchSaveResult}
      />
    )}
  </div>
);
}

export default SentimentLab;
