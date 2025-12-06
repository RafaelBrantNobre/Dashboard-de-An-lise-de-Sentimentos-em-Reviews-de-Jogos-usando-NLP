// src/components/GameList.tsx
import { useEffect, useState } from "react";
import { Game, getGames } from "../api";

interface GameListProps {
  onSelectGame: (game: Game) => void;
}

function GameList({ onSelectGame }: GameListProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        const data = await getGames();
        setGames(data);
        setFilteredGames(data);
      } catch (err: any) {
        setError(err.message ?? "Erro ao carregar jogos");
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFilteredGames(
      games.filter((g) => g.game_name.toLowerCase().includes(term))
    );
  }, [search, games]);

  if (loading) {
    return <p className="text-gray-300">Carregando jogos...</p>;
  }

  if (error) {
    return <p className="text-red-400">Erro: {error}</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          className="w-full max-w-md px-3 py-2 rounded bg-slate-800 text-gray-100 border border-slate-600"
          placeholder="Buscar por nome do jogo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredGames.length === 0 ? (
        <p className="text-gray-400">Nenhum jogo encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-200">
            <thead className="bg-slate-800 text-gray-300">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Nome do jogo</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((game) => (
                <tr
                  key={game.game_id}
                  className="border-b border-slate-700 hover:bg-slate-800/70"
                >
                  <td className="px-4 py-2">{game.game_id}</td>
                  <td className="px-4 py-2">{game.game_name}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      className="px-3 py-1.5 text-xs rounded bg-sky-500 hover:bg-sky-400 text-slate-900 font-medium"
                      onClick={() => onSelectGame(game)}
                    >
                      Ver dashboard
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GameList;
