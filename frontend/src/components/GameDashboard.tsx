// src/components/GameDashboard.tsx
import { useEffect, useState } from "react";
import {
  GameDashboard as GameDashboardData,
  getGameDashboard,
  getReviewsBySentiment,
  getReviewMetrics,
  getGameConsistency,
  Review,
  Sentiment,
  ReviewMetrics,
  GameConsistency,
} from "../api";
import { ConsistencyPie, MetricBar, SentimentPieChart } from "./GameCharts";

interface GameDashboardProps {
  gameId: number;
  gameName: string;
}

const LIMIT = 50;

// Charts are provided from GameCharts

function GameDashboard({ gameId, gameName }: GameDashboardProps) {
  const [dashboard, setDashboard] = useState<GameDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [errorDashboard, setErrorDashboard] = useState<string | null>(null);

  const [currentSentiment, setCurrentSentiment] = useState<Sentiment>(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [errorReviews, setErrorReviews] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  // RF07 - metrics state
  const [metricsByReviewId, setMetricsByReviewId] = useState<
    Record<number, ReviewMetrics | null>
  >({});
  const [metricsLoading, setMetricsLoading] = useState<Record<number, boolean>>(
    {}
  );
  const [metricsError, setMetricsError] = useState<
    Record<number, string | null>
  >({});

  // Consistency state (model vs original labels)
  const [consistency, setConsistency] = useState<GameConsistency | null>(null);
  const [loadingConsistency, setLoadingConsistency] = useState(false);
  const [errorConsistency, setErrorConsistency] = useState<string | null>(null);

  // Load game dashboard (total / positive / negative)
  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        setLoadingDashboard(true);
        const data = await getGameDashboard(gameId);
        if (!cancelled) {
          setDashboard(data);
          setErrorDashboard(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorDashboard(err.message ?? "Error loading dashboard");
          setDashboard(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingDashboard(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  // Load consistency info
  useEffect(() => {
    let cancelled = false;

    async function fetchConsistency() {
      try {
        setLoadingConsistency(true);
        const data = await getGameConsistency(gameId);
        if (!cancelled) {
          setConsistency(data);
          setErrorConsistency(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorConsistency(err.message ?? "Error loading consistency data");
        }
      } finally {
        if (!cancelled) {
          setLoadingConsistency(false);
        }
      }
    }

    fetchConsistency();

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  // Load reviews filtered by sentiment
  useEffect(() => {
    let cancelled = false;

    async function fetchReviews() {
      try {
        setLoadingReviews(true);
        const data = await getReviewsBySentiment(
          gameId,
          currentSentiment,
          LIMIT,
          offset
        );
        if (cancelled) return;

        setErrorReviews(null);

        if (offset === 0) {
          setReviews(data);
        } else {
          setReviews((prev) => [...prev, ...data]);
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorReviews(err.message ?? "Error loading reviews");
        }
      } finally {
        if (!cancelled) {
          setLoadingReviews(false);
        }
      }
    }

    fetchReviews();

    return () => {
      cancelled = true;
    };
  }, [gameId, currentSentiment, offset]);

  const handleChangeSentiment = (sent: Sentiment) => {
    if (sent === currentSentiment) return;
    setCurrentSentiment(sent);
    setOffset(0);
  };

  const handleLoadMore = () => {
    setOffset((prev) => prev + LIMIT);
  };

  const sentimentLabel = currentSentiment === 1 ? "positive" : "negative";

  // RF07 - load metrics for a specific review (lazy)
  const handleLoadMetrics = async (reviewId: number) => {
    if (metricsByReviewId[reviewId]) return;

    setMetricsLoading((prev) => ({ ...prev, [reviewId]: true }));
    setMetricsError((prev) => ({ ...prev, [reviewId]: null }));

    try {
      const data = await getReviewMetrics(reviewId);
      setMetricsByReviewId((prev) => ({ ...prev, [reviewId]: data }));
    } catch (err: any) {
      setMetricsError((prev) => ({
        ...prev,
        [reviewId]: err.message ?? "Failed to load metrics",
      }));
    } finally {
      setMetricsLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Game header */}
      <div>
        <h2 className="text-lg font-semibold">{gameName}</h2>
        <p className="text-sm text-gray-400">
          ID: {gameId} · Source: original score (
          <span className="font-mono">review_score_raw</span>)
        </p>
      </div>

      {/* Summary cards */}
      <div className="space-y-3">
        <div>
          {dashboard ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <p className="text-xs text-gray-400">Total reviews</p>
                <p className="text-2xl font-semibold mt-1">
                  {dashboard.total_reviews}
                </p>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <p className="text-xs text-gray-400">Positive</p>
                <p className="text-lg font-semibold mt-1">
                  {dashboard.positivas}
                </p>
                <p className="text-xs text-emerald-400">
                  {(dashboard.percentual_positivas * 100).toFixed(1)}%
                </p>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <p className="text-xs text-gray-400">Negative</p>
                <p className="text-lg font-semibold mt-1">
                  {dashboard.negativas}
                </p>
                <p className="text-xs text-rose-400">
                  {(dashboard.percentual_negativas * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ) : loadingDashboard ? (
            <p className="text-gray-300 text-sm">Loading dashboard...</p>
          ) : errorDashboard ? (
            <p className="text-gray-500 text-sm">
              Dashboard not available: {errorDashboard}
            </p>
          ) : null}
        </div>

        {/* Consistency + Sentiment donuts */}
        <div>
          {loadingConsistency ? (
            <p className="text-gray-300 text-xs">
              Checking model consistency...
            </p>
          ) : consistency && consistency.total_with_ai > 0 ? (
            <div className="mt-2 bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
              <p className="text-xs text-gray-400">
                Model vs original labels (only reviews with AI prediction)
              </p>

              <div className="flex flex-col md:flex-row md:items-start md:gap-8">
                {/* Donut 1: consistência do modelo */}
                <div className="flex-1">
                  <ConsistencyPie
                    consistent={consistency.consistent}
                    inconsistent={consistency.inconsistent}
                  />
                </div>

                {/* Donut 2: distribuição original pos/neg (dashboard) */}
                {dashboard && (
                  <div className="flex-1 mt-4 md:mt-0">
                    <p className="text-xs text-gray-400 mb-1">
                      Original labels (all reviews for this game)
                    </p>
                    <SentimentPieChart
                      positive={dashboard.positivas}
                      negative={dashboard.negativas}
                    />
                  </div>
                )}
              </div>

              {consistency.samples.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[11px] text-gray-400">
                    Example inconsistent reviews:
                  </p>
                  {consistency.samples.map((s) => (
                    <div
                      key={s.review_id}
                      className="text-[11px] text-gray-300 bg-slate-950/60 border border-slate-800 rounded px-2 py-1"
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-gray-500">
                          #{s.review_id}
                        </span>
                        <span>
                          Orig:{" "}
                          {s.review_score_raw === 1 ? "pos" : "neg"} · Model:{" "}
                          {s.artificial_analysis === 1 ? "pos" : "neg"}
                        </span>
                      </div>
                      <p className="line-clamp-2">
                        {s.review_text_raw}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : errorConsistency ? (
            <p className="text-xs text-gray-500">
              Consistency data not available: {errorConsistency}
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              No reviews with model prediction for this game yet.
            </p>
          )}
        </div>
      </div>

      {/* Sentiment filter + reviews list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-md font-medium">
            Game {sentimentLabel} reviews
          </h3>

          <div className="inline-flex rounded-md border border-slate-700 overflow-hidden">
            <button
              className={`px-3 py-1.5 text-xs md:text-sm ${
                currentSentiment === 1
                  ? "bg-emerald-500 text-slate-900 font-semibold"
                  : "bg-slate-900 text-gray-200 hover:bg-slate-800"
              }`}
              onClick={() => handleChangeSentiment(1)}
            >
              Positive
            </button>
            <button
              className={`px-3 py-1.5 text-xs md:text-sm ${
                currentSentiment === -1
                  ? "bg-rose-500 text-slate-900 font-semibold"
                  : "bg-slate-900 text-gray-200 hover:bg-slate-800"
              }`}
              onClick={() => handleChangeSentiment(-1)}
            >
              Negative
            </button>
          </div>
        </div>

        {errorReviews && (
          <p className="text-red-400 text-sm">Error: {errorReviews}</p>
        )}

        {reviews.length === 0 && !loadingReviews ? (
          <p className="text-gray-400 text-sm">
            No reviews found for this filter.
          </p>
        ) : (
          <div className="space-y-2">
            {reviews.map((review) => (
              <article
                key={review.review_id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">
                    Review #{review.review_id} · votes:{" "}
                    {review.review_votes}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      review.review_score_raw === 1
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {review.review_score_raw === 1
                      ? "Original: positive"
                      : "Original: negative"}
                  </span>
                </div>

                <p className="text-gray-200">
                  {review.review_text_raw}
                </p>

                {/* RF07: button + metrics */}
                <div className="flex items-center justify-between mt-2">
                  <button
                    className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                    onClick={() => handleLoadMetrics(review.review_id)}
                    disabled={metricsLoading[review.review_id]}
                  >
                    {metricsLoading[review.review_id]
                      ? "Loading metrics..."
                      : "Show metrics"}
                  </button>

                  {metricsError[review.review_id] && (
                    <span className="text-xs text-red-400">
                      {metricsError[review.review_id]}
                    </span>
                  )}
                </div>

                {metricsByReviewId[review.review_id] && (() => {
                  const m = metricsByReviewId[review.review_id]!;
                  const localMax = Math.max(
                    m.char_num,
                    m.word_num,
                    m.sent_num,
                    1
                  );

                  return (
                    <div className="mt-2 space-y-1">
                      <div className="text-[11px] text-gray-400">
                        Chars: {m.char_num} · Words: {m.word_num} · Sentences:{" "}
                        {m.sent_num}
                      </div>
                      <div className="space-y-1">
                        <MetricBar
                          label="Chars"
                          value={m.char_num}
                          max={localMax}
                          isNegative={review.review_score_raw === -1}
                        />
                        <MetricBar
                          label="Words"
                          value={m.word_num}
                          max={localMax}
                          isNegative={review.review_score_raw === -1}
                        />
                        <MetricBar
                          label="Sentences"
                          value={m.sent_num}
                          max={localMax}
                          isNegative={review.review_score_raw === -1}
                        />
                      </div>
                    </div>
                  );
                })()}
              </article>
            ))}
          </div>
        )}

        {reviews.length > 0 && (
          <div className="pt-2">
            <button
              className="px-3 py-1.5 text-xs rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
              onClick={handleLoadMore}
              disabled={loadingReviews}
            >
              {loadingReviews ? "Loading..." : "Load more"}
            </button>
          </div>
        )}

        {loadingReviews && reviews.length === 0 && (
          <p className="text-gray-300 text-sm">Loading reviews...</p>
        )}
      </div>
    </div>
  );
}

export default GameDashboard;
