// src/components/ReviewInspector.tsx
import { useEffect, useState } from "react";
import {
  getReview,
  getReviewMetrics,
  predictReviewOnce,
  predictReviewWithModel,
  getModels,
  getPredictions,
  type Review,
  type ReviewMetrics,
  type PredictResponse,
  type ModelInfo,
  type PredictionSummary,
} from "../api";

export default function ReviewInspector() {
  const [reviewIdInput, setReviewIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [review, setReview] = useState<Review | null>(null);
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [predictionsByModel, setPredictionsByModel] = useState<Record<number, PredictionSummary>>({});

  async function handleLoadReview() {
    const id = Number(reviewIdInput.trim());
    if (!id || Number.isNaN(id)) {
      setError("Please enter a valid review_id (integer).");
      return;
    }

    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const [reviewData, metricsData, modelsData, preds] = await Promise.all([
        getReview(id),
        getReviewMetrics(id),
        getModels(),
        getPredictions({ reviewId: id, limit: 100 }),
      ]);
      setReview(reviewData);
      setMetrics(metricsData);
      setModels(modelsData);

      const byModel: Record<number, PredictionSummary> = {};
      preds.forEach((p) => {
        byModel[p.model_id] = p;
      });
      setPredictionsByModel(byModel);
      // set default selected model to default (model_id 1) or first available
      setSelectedModelId(modelsData.find((m) => m.model_id === 1)?.model_id ?? (modelsData[0]?.model_id ?? null));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error while fetching review.");
      }
      setReview(null);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleClassifyOnce() {
    if (!review) {
      setError("Load a review first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pred = await predictReviewOnce(review.review_id);
      setPrediction(pred);

      // reflect updated artificial_analysis in local state
      setReview({
        ...review,
        artificial_analysis: pred.sentimento_predito,
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error while classifying review.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleClassifyWithModel() {
    if (!review) return setError("Load a review first.");
    if (!selectedModelId) return setError("Select a model.");

    setLoading(true);
    setError(null);

    try {
      // if we already have prediction for this model, reuse it
      if (predictionsByModel[selectedModelId]) {
        const existing = predictionsByModel[selectedModelId];
        setPrediction({
          review: existing.review_text_raw,
          sentimento_predito: existing.sentimento_predito as any,
          sentimento_str: existing.sentimento_str,
          model_id: existing.model_id,
          data_predicao: existing.data_predicao,
        });
        return;
      }

      const pred = await predictReviewWithModel(review.review_id, selectedModelId);
      setPrediction(pred);

      // store in local map for reuse
      const newEntry: PredictionSummary = {
        prediction_id: -1,
        review_id: review.review_id,
        game_id: review.game_id,
        game_name: review.game_name,
        review_text_raw: pred.review,
        sentimento_predito: pred.sentimento_predito,
        sentimento_str: pred.sentimento_str,
        data_predicao: pred.data_predicao ?? new Date().toISOString(),
        model_name: models.find((m) => m.model_id === selectedModelId)?.model_name ?? "",
        model_version: models.find((m) => m.model_id === selectedModelId)?.model_version ?? "",
        model_id: selectedModelId,
      };
      setPredictionsByModel((prev) => ({ ...prev, [selectedModelId]: newEntry }));

      // if this was the default model, reflect in review
      if (selectedModelId === 1) {
        setReview({ ...review, artificial_analysis: pred.sentimento_predito });
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Unknown error while classifying review with selected model.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold">
        Classify existing review (only if it has no prediction yet)
      </h1>

      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={reviewIdInput}
          onChange={(e) => setReviewIdInput(e.target.value)}
          placeholder="Enter review_id"
            className="border border-slate-700 rounded px-2 py-1 w-40
             bg-slate-900 text-slate-100 placeholder:text-slate-400
             focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <button
          onClick={handleLoadReview}
          disabled={loading}
          className="px-3 py-1 rounded border"
        >
          Fetch review
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {loading && (
        <div className="text-sm text-gray-600">Loading...</div>
      )}

      {review && (
        <div className="border rounded p-3 flex flex-col gap-2">
          <div className="font-semibold">
            #{review.review_id} · {review.game_name} (game_id {review.game_id})
          </div>

          <div className="text-sm">
            <span className="font-medium">Original score:</span>{" "}
            {review.review_score_raw === null
              ? "not informed"
              : review.review_score_raw === 1
              ? "positive (1)"
              : "negative (-1)"}
          </div>

          <div className="text-sm">
            <span className="font-medium">Current AI analysis:</span>{" "}
            {review.artificial_analysis === null
              ? "not classified yet"
              : review.artificial_analysis === 1
              ? "positive (1)"
              : "negative (-1)"}
          </div>

          <div className="mt-2">
            <div className="font-medium mb-1">Review text:</div>
            <p className="text-sm whitespace-pre-wrap">
              {review.review_text_raw}
            </p>
          </div>

          {metrics && (
            <div className="mt-2 text-sm text-gray-700">
              <div>
                <span className="font-medium">Characters:</span>{" "}
                {metrics.char_num}
              </div>
              <div>
                <span className="font-medium">Words:</span>{" "}
                {metrics.word_num}
              </div>
              <div>
                <span className="font-medium">Sentences:</span>{" "}
                {metrics.sent_num}
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2 items-center">
            <button
              onClick={handleClassifyOnce}
              disabled={loading}
              className="px-3 py-1 rounded border"
            >
              Classify (default model)
            </button>

            <div className="flex items-center gap-2">
              <select
                value={selectedModelId ?? ""}
                onChange={(e) => setSelectedModelId(e.target.value ? Number(e.target.value) : null)}
                className="px-2 py-1 bg-slate-900 border border-slate-700 text-slate-100 rounded"
              >
                <option value="">Select model...</option>
                {models.map((m) => (
                  <option key={m.model_id} value={m.model_id}>
                    {m.model_name} {m.model_version}
                  </option>
                ))}
              </select>

              <button
                onClick={handleClassifyWithModel}
                disabled={loading || !selectedModelId}
                className="px-3 py-1 rounded border"
              >
                Classify with this model
              </button>
            </div>

            {prediction && (
              <span className="text-sm">
                Result ({prediction.model_id ?? 'model'}):{" "}
                <span className="font-semibold">
                  {prediction.sentimento_str} ({prediction.sentimento_predito})
                </span>
                {prediction.data_predicao && (
                  <span className="ml-2 text-xs text-slate-400">{new Date(prediction.data_predicao).toLocaleString()}</span>
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
