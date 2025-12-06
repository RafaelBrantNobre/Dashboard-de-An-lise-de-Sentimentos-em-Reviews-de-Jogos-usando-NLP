import type {
  BatchCsvResult,
  BatchCsvSaveResult,
} from "../api";

type Props = {
  csvFile: File | null;
  handleCsvChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAnalyzeCsv: () => Promise<void>;
  handleSaveCsv: () => Promise<void>;
  batchResult: BatchCsvResult | null;
  batchLoading: boolean;
  batchError: string | null;
  batchSaveLoading: boolean;
  batchSaveError: string | null;
  batchSaveResult: BatchCsvSaveResult | null;
};

export default function SentimentCsv({
  csvFile,
  handleCsvChange,
  handleAnalyzeCsv,
  handleSaveCsv,
  batchResult,
  batchLoading,
  batchError,
  batchSaveLoading,
  batchSaveError,
  batchSaveResult,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-1">
          CSV file
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleCsvChange}
          className="block w-full text-sm text-slate-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-sky-500 file:text-slate-900 hover:file:bg-sky-400"
        />
        {csvFile && (
          <p className="mt-2 text-xs text-slate-300">Selected file: <span className="font-mono">{csvFile.name}</span></p>
        )}
        <p className="mt-1 text-xs text-slate-500">
          To analyze, the file must contain at least one text column with a
          header like <code>review_text_raw</code>, <code>review</code> or{' '}
          <code>text</code>. To <span className="font-semibold">save</span> the
          reviews to the database, the CSV must also include <code>game_id</code>{' '}
          and <code>review_score_raw</code> (1 for recommends, -1 for does not
          recommend).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="px-4 py-2 rounded bg-sky-500 hover:bg-sky-400 text-slate-900 font-medium disabled:opacity-50"
          onClick={handleAnalyzeCsv}
          disabled={batchLoading}
        >
          {batchLoading ? "Analyzing CSV..." : "Analyze CSV"}
        </button>

        <button
          className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-medium disabled:opacity-50"
          onClick={handleSaveCsv}
          disabled={batchSaveLoading}
        >
          {batchSaveLoading ? "Saving to database..." : "Save reviews to database"}
        </button>

        {batchError && <span className="text-xs text-rose-400">{batchError}</span>}
        {batchSaveError && (
          <span className="text-xs text-rose-400">{batchSaveError}</span>
        )}
      </div>

      {batchResult && (
        <div className="mt-4 space-y-3">
          <div className="rounded border border-slate-700 bg-slate-900 p-4">
            <h3 className="text-sm font-semibold text-slate-100 mb-2">
              Batch summary (analysis only)
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              File:{' '}
              <span className="font-mono text-slate-200">{batchResult.arquivo}</span>
            </p>
            <ul className="text-sm text-slate-100 space-y-1">
              <li>
                <span className="font-medium">Total reviews:</span>{' '}
                {batchResult.total_reviews}
              </li>
              <li>
                <span className="font-medium">Positive:</span>{' '}
                {batchResult.positivas} ({Math.round(batchResult.percentual_positivas * 100)}%)
              </li>
              <li>
                <span className="font-medium">Negative:</span>{' '}
                {batchResult.negativas} ({Math.round(batchResult.percentual_negativas * 100)}%)
              </li>
            </ul>
          </div>

          {batchResult.detalhes && batchResult.detalhes.length > 0 && (
            <div className="rounded border border-slate-700 bg-slate-900 p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-2">
                Sample of analyzed reviews (up to 50 rows)
              </h4>
              <div className="max-h-64 overflow-auto text-xs">
                <table className="min-w-full text-left border-collapse">
                  <thead className="bg-slate-800 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 border-b border-slate-700">Line</th>
                      <th className="px-2 py-1 border-b border-slate-700">Sentiment</th>
                      <th className="px-2 py-1 border-b border-slate-700">Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResult.detalhes.map((item) => (
                      <tr key={item.linha} className="align-top">
                        <td className="px-2 py-1 border-b border-slate-800">{item.linha}</td>
                        <td className="px-2 py-1 border-b border-slate-800">
                          <span className={item.sentimento_predito === 1 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>{item.sentimento_str}</span>
                        </td>
                        <td className="px-2 py-1 border-b border-slate-800">{item.review}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {batchSaveResult && (
        <div className="mt-4 space-y-3">
          <div className="rounded border border-slate-700 bg-slate-900 p-4">
            <h3 className="text-sm font-semibold text-slate-100 mb-2">Saved reviews (database)</h3>
            <p className="text-xs text-slate-400 mb-2">File: <span className="font-mono text-slate-200">{batchSaveResult.arquivo}</span></p>
            <ul className="text-sm text-slate-100 space-y-1">
              <li><span className="font-medium">Total rows in CSV:</span> {batchSaveResult.total_rows}</li>
              <li><span className="font-medium">Inserted:</span> {batchSaveResult.inserted}</li>
              <li><span className="font-medium">Skipped (invalid/missing data):</span> {batchSaveResult.skipped}</li>
            </ul>
          </div>

          {batchSaveResult.detalhes && batchSaveResult.detalhes.length > 0 && (
            <div className="rounded border border-slate-700 bg-slate-900 p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-2">Sample of inserted reviews (up to 50 rows)</h4>
              <div className="max-h-64 overflow-auto text-xs">
                <table className="min-w-full text-left border-collapse">
                  <thead className="bg-slate-800 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 border-b border-slate-700">Review ID</th>
                      <th className="px-2 py-1 border-b border-slate-700">Game ID</th>
                      <th className="px-2 py-1 border-b border-slate-700">Score (raw)</th>
                      <th className="px-2 py-1 border-b border-slate-700">AI sentiment</th>
                      <th className="px-2 py-1 border-b border-slate-700">Review text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchSaveResult.detalhes.map((item) => (
                      <tr key={item.review_id} className="align-top">
                        <td className="px-2 py-1 border-b border-slate-800">{item.review_id}</td>
                        <td className="px-2 py-1 border-b border-slate-800">{item.game_id}</td>
                        <td className="px-2 py-1 border-b border-slate-800">{item.review_score_raw}</td>
                        <td className="px-2 py-1 border-b border-slate-800"><span className={item.artificial_analysis === 1 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>{item.artificial_analysis === 1 ? "positive" : "negative"}</span></td>
                        <td className="px-2 py-1 border-b border-slate-800">{item.review_text_raw}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
