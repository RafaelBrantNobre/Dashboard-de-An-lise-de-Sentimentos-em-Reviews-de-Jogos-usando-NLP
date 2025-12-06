// src/api/index.ts

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// ---- Types ----

export interface ConsistencySample {
  review_id: number;
  review_text_raw: string;
  review_score_raw: Sentiment;
  artificial_analysis: number; // 0 or 1
}

export interface GameConsistency {
  game_id: number;
  total_with_ai: number;
  consistent: number;
  inconsistent: number;
  consistency_rate: number; // 0 to 1
  samples: ConsistencySample[];
}


export type Sentiment = 1 | -1;

export interface Game {
  game_id: number;
  game_name: string;
}

export interface Review {
  review_id: number;
  game_id: number;
  game_name: string;
  review_text_raw: string;
  review_score_raw: Sentiment | null;
  review_votes?: number;
  artificial_analysis: Sentiment | null;
}

export interface GameDashboard {
  game_id: number;
  game_name: string;
  total_reviews: number;
  positivas: number;
  negativas: number;
  percentual_positivas: number; // 0 to 1
  percentual_negativas: number; // 0 to 1
  avg_votes: number;
  fonte: string; // "review_score_raw"
}

export interface PredictResponse {
  review: string;
  sentimento_predito: Sentiment;
  sentimento_str: string; // "positivo" | "negativo"
  model_id?: number;
  data_predicao?: string; // ISO datetime
}

export interface ModelInfo {
  model_id: number;
  model_name: string;
  model_version: string;
  base_accuracy?: number | null;
}

// RF07 - review metrics
export interface ReviewMetrics {
  review_id: number;
  char_num: number;
  word_num: number;
  sent_num: number;
}

// Text + save payload
export interface SaveTextPayload {
  review: string;
  game_id: number;
  review_score_raw: Sentiment;
}

// Batch CSV (analyze only)
export interface BatchCsvDetail {
  linha: number;
  review: string;
  sentimento_predito: Sentiment;
  sentimento_str: string;
}

export interface BatchCsvResult {
  arquivo: string;
  total_reviews: number;
  positivas: number;
  negativas: number;
  percentual_positivas: number;
  percentual_negativas: number;
  detalhes: BatchCsvDetail[];
}

// Batch CSV (analyze + save)
export interface BatchCsvSavedReview {
  review_id: number;
  game_id: number;
  game_name: string;
  review_text_raw: string;
  review_score_raw: Sentiment;
  artificial_analysis: Sentiment;
}

export interface BatchCsvSaveResult {
  arquivo: string;
  total_rows: number;
  inserted: number;
  skipped: number;
  detalhes: BatchCsvSavedReview[];
}

// ---- Generic helper ----

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) {
        msg = data.detail;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// ---- API functions ----

// Games

export async function getGames(): Promise<Game[]> {
  const res = await fetch(`${BASE_URL}/games`);
  return handleResponse<Game[]>(res);
}

export async function getGameReviews(gameId: number): Promise<Review[]> {
  const res = await fetch(`${BASE_URL}/games/${gameId}/reviews`);
  return handleResponse<Review[]>(res);
}

export async function getGameDashboard(
  gameId: number
): Promise<GameDashboard> {
  const res = await fetch(`${BASE_URL}/games/${gameId}/dashboard`);
  return handleResponse<GameDashboard>(res);
}

export async function getReviewsBySentiment(
  gameId: number,
  sentiment: Sentiment,
  limit = 50,
  offset = 0
): Promise<Review[]> {
  const params = new URLSearchParams({
    sentiment: String(sentiment),
    limit: String(limit),
    offset: String(offset),
  });

  const res = await fetch(
    `${BASE_URL}/games/${gameId}/reviews/by-sentiment?${params.toString()}`
  );
  return handleResponse<Review[]>(res);
}

// Single review

export async function getReview(reviewId: number): Promise<Review> {
  const res = await fetch(`${BASE_URL}/reviews/${reviewId}`);
  return handleResponse<Review>(res);
}

// RF07 - review metrics

export async function getReviewMetrics(
  reviewId: number
): Promise<ReviewMetrics> {
  const res = await fetch(`${BASE_URL}/reviews/${reviewId}/metrics`);
  return handleResponse<ReviewMetrics>(res);
}

// Predictions

export async function predictReview(
  reviewId: number
): Promise<PredictResponse> {
  const res = await fetch(`${BASE_URL}/predict/review/${reviewId}`, {
    method: "POST",
  });
  return handleResponse<PredictResponse>(res);
}

export async function predictReviewWithModel(
  reviewId: number,
  modelId: number
): Promise<PredictResponse> {
  const res = await fetch(`${BASE_URL}/predict/review/${reviewId}?model_id=${modelId}`, {
    method: "POST",
  });
  return handleResponse<PredictResponse>(res);
}

export async function getModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${BASE_URL}/models`);
  return handleResponse<ModelInfo[]>(res);
}

export async function predictReviewOnce(
  reviewId: number
): Promise<PredictResponse> {
  const res = await fetch(`${BASE_URL}/predict/review-once/${reviewId}`, {
    method: "POST",
  });
  return handleResponse<PredictResponse>(res);
}

export interface PredictionSummary {
  prediction_id: number;
  review_id: number;
  game_id: number;
  game_name: string;
  review_text_raw: string;
  sentimento_predito: number;
  sentimento_str: string;
  data_predicao: string; // ISO string
  model_name: string;
  model_version: string;
  model_id: number;
}

export async function predictText(
  review: string
): Promise<PredictResponse> {
  const res = await fetch(`${BASE_URL}/predict/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ review }),
  });
  return handleResponse<PredictResponse>(res);
}

// Predict + save single text

export async function predictAndSaveText(
  payload: SaveTextPayload
): Promise<PredictResponse> {
  const res = await fetch(`${BASE_URL}/predict/text/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<PredictResponse>(res);
}

// Batch CSV (analyze only)

export async function predictBatchCsv(file: File): Promise<BatchCsvResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/predict/batch-csv`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<BatchCsvResult>(res);
}

// Batch CSV (analyze + save)

export async function saveBatchCsv(file: File): Promise<BatchCsvSaveResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/predict/batch-csv/save`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<BatchCsvSaveResult>(res);
}


export async function getGameConsistency(
  gameId: number
): Promise<GameConsistency> {
  const res = await fetch(`${BASE_URL}/games/${gameId}/consistency`);
  return handleResponse<GameConsistency>(res);
}

export async function getPredictions(params?: {
  gameId?: number;
  sentiment?: number; // 1 or -1
  reviewId?: number;
  limit?: number;
  offset?: number;
}): Promise<PredictionSummary[]> {
  const searchParams = new URLSearchParams();

  if (params?.gameId !== undefined) {
    searchParams.set("game_id", String(params.gameId));
  }
  if (params?.sentiment !== undefined) {
    searchParams.set("sentiment", String(params.sentiment));
  }
  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  if (params?.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }
  if (params?.reviewId !== undefined) {
    searchParams.set("review_id", String(params.reviewId));
  }

  const qs = searchParams.toString();
  const url =
    qs.length > 0 ? `${BASE_URL}/predictions?${qs}` : `${BASE_URL}/predictions`;

  const res = await fetch(url);
  return handleResponse<PredictionSummary[]>(res);
}