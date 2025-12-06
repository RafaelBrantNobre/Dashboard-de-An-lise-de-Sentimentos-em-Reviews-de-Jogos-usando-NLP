// src/components/SentimentCharts.tsx
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

function useFadeIn() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-2";
}

export function ConsistencyPie({
  consistent,
  inconsistent,
}: {
  consistent: number;
  inconsistent: number;
}) {
  const total = consistent + inconsistent;
  const fadeClass = useFadeIn();

  if (total === 0) {
    return (
      <p className="text-xs text-gray-500">
        No reviews with model prediction for this game yet.
      </p>
    );
  }

  const size = 140;
  const strokeWidth = 18; 
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const consistentRatio = consistent / total;
  const dash = consistentRatio * circumference;

  // animação circular do arco verde
  const [animatedDash, setAnimatedDash] = useState(0);

  useEffect(() => {
    // deixa renderizar 1 frame com 0, depois anima até o valor real
    const id = requestAnimationFrame(() => {
      setAnimatedDash(dash);
    });
    return () => cancelAnimationFrame(id);
  }, [dash]);

  return (
    <div
      className={`flex items-center gap-4 transition-all duration-500 ease-out ${fadeClass}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
      >
        {/* Fundo (erros) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#fb7185"
          strokeWidth={strokeWidth}
          opacity={0.35}
        />
        {/* Acertos (arco animado) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#22c55e"
          strokeWidth={strokeWidth}
          strokeDasharray={`${animatedDash} ${Math.max(
            0,
            circumference - animatedDash
          )}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dasharray 700ms ease-out",
          }}
        />
      </svg>

      <div className="space-y-1 text-xs">
        <p className="text-gray-200">
          Accuracy:{" "}
          <span className="font-semibold">
            {(consistentRatio * 100).toFixed(1)}%
          </span>
        </p>
        <p className="text-gray-300">
          Correct:{" "}
          <span className="font-semibold text-emerald-400">
            {consistent}
          </span>{" "}
          · Wrong:{" "}
          <span className="font-semibold text-rose-400">
            {inconsistent}
          </span>
        </p>

        <div className="flex items-center gap-4 text-[10px] text-gray-400 mt-2">
          <div className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full bg-emerald-500" />
            <span>Model = original</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full bg-rose-400" />
            <span>Model ≠ original</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetricBar({
  label,
  value,
  max,
  isNegative,
}: {
  label: string;
  value: number;
  max: number;
  isNegative?: boolean;
}) {
  const fadeClass = useFadeIn();
  const targetWidth = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  // animação da barra crescendo
  const [displayWidth, setDisplayWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setDisplayWidth(targetWidth);
    });
    return () => cancelAnimationFrame(id);
  }, [targetWidth]);

  return (
    <div
      className={`flex items-center gap-3 transition-all duration-500 ease-out ${fadeClass}`}
    >
      <span className="w-28 text-[11px] text-gray-400 truncate">
        {label}
      </span>
      <div className="flex-1 h-5 rounded bg-slate-900/70 overflow-hidden">
        <div
          className={
            "h-full transition-all duration-500 " +
            (isNegative ? "bg-rose-500" : "bg-emerald-500")
          }
          style={{
            width: `${displayWidth}%`,
            borderRadius: displayWidth >= 5 ? 6 : 0,
          }}
        />
      </div>
      <span className="text-[11px] text-gray-300 tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function SentimentPieChart({
  positive,
  negative,
}: {
  positive: number;
  negative: number;
}) {
  const pos = Number.isFinite(positive) ? Number(positive) : 0;
  const neg = Number.isFinite(negative) ? Number(negative) : 0;
  const total = pos + neg;
  const fadeClass = useFadeIn();

  if (total === 0) {
    return (
      <p className="text-xs text-gray-500">
        No reviews available for sentiment analysis.
      </p>
    );
  }

  const COLORS = ["#22c55e", "#fb7185"];

  const data = [
    { name: "Positive", value: pos, color: COLORS[0] },
    { name: "Negative", value: neg, color: COLORS[1] },
  ];

  const percent = (v: number) =>
    total > 0 ? ((v / total) * 100).toFixed(1) + "%" : "0.0%";

  return (
    <div
      className={`flex items-center gap-4 transition-all duration-500 ease-out ${fadeClass}`}
    >
      <div
        className="shrink-0"
        style={{ width: 140, height: 140 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={46}
              outerRadius={70}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="transparent"
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                />
              ))}
            </Pie>
            {/* Tooltip removido pra não ter barra escura seguindo o mouse */}
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 text-xs text-gray-300">
        <p className="text-gray-200 font-medium">Sentiment split</p>

        <div className="space-y-1">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="tabular-nums text-gray-200">
                  {item.value}
                </span>
                <span className="text-gray-400">
                  {percent(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-gray-500">
          Total:{" "}
          <span className="font-semibold text-gray-300">
            {total} reviews
          </span>
        </p>
      </div>
    </div>
  );
}
