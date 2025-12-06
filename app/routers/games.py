from fastapi import APIRouter, HTTPException, Query
from typing import List

from ..database import get_connection
from ..schemas import GameConsistency, GameDashboard

router = APIRouter(tags=["games"])


@router.get("/games")
def list_games():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT game_id, game_name
            FROM Jogos
            ORDER BY game_name ASC
            """
        )
        rows = cursor.fetchall()
        games = [
            {"game_id": row["game_id"], "game_name": row["game_name"]}
            for row in rows
        ]
        return games
    finally:
        cursor.close()
        conn.close()


@router.get("/games/{game_id}/dashboard", response_model=GameDashboard)
def get_game_dashboard(game_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        # Verificar se o jogo existe
        cursor.execute(
            "SELECT game_name FROM Jogos WHERE game_id = %s",
            (game_id,),
        )
        game_row = cursor.fetchone()
        if game_row is None:
            raise HTTPException(status_code=404, detail="Jogo não encontrado.")

        game_name = game_row["game_name"]

        # Contar total de reviews, positivas e negativas
        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_reviews,
                SUM(CASE WHEN review_score_raw = 1 THEN 1 ELSE 0 END) AS positivas,
                SUM(CASE WHEN review_score_raw = -1 THEN 1 ELSE 0 END) AS negativas,
                AVG(COALESCE(artificial_analysis, 0)) AS avg_votes
            FROM Reviews_Raw
            WHERE game_id = %s
            """,
            (game_id,),
        )
        row = cursor.fetchone()

        total_reviews = row["total_reviews"] or 0
        positivas = row["positivas"] or 0
        negativas = row["negativas"] or 0
        avg_votes = float(row["avg_votes"] or 0)

        # Calcular percentuais
        percentual_positivas = (positivas / total_reviews) if total_reviews > 0 else 0.0
        percentual_negativas = (negativas / total_reviews) if total_reviews > 0 else 0.0

        return GameDashboard(
            game_id=game_id,
            game_name=game_name,
            total_reviews=total_reviews,
            positivas=positivas,
            negativas=negativas,
            percentual_positivas=percentual_positivas,
            percentual_negativas=percentual_negativas,
            avg_votes=avg_votes,
            fonte="review_score_raw",
        )
    finally:
        cursor.close()
        conn.close()


@router.get("/games/{game_id}/reviews")
def list_reviews_for_game(game_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT game_name FROM Jogos WHERE game_id = %s",
            (game_id,),
        )
        game_row = cursor.fetchone()
        if game_row is None:
            raise HTTPException(status_code=404, detail="Jogo não encontrado.")

        game_name = game_row["game_name"]

        cursor.execute(
            """
            SELECT
                review_id,
                review_text_raw,
                review_score_raw,
                artificial_analysis
            FROM Reviews_Raw
            WHERE game_id = %s
            ORDER BY review_id ASC
            """,
            (game_id,),
        )
        rows = cursor.fetchall()
        reviews = []
        for row in rows:
            reviews.append(
                {
                    "review_id": row["review_id"],
                    "game_id": game_id,
                    "game_name": game_name,
                    "review_text_raw": row["review_text_raw"],
                    "review_score_raw": row["review_score_raw"],
                    "artificial_analysis": row["artificial_analysis"],
                }
            )
        return reviews
    finally:
        cursor.close()
        conn.close()


@router.get("/reviews/{review_id}")
def get_review(review_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                r.review_id,
                r.game_id,
                j.game_name,
                r.review_text_raw,
                r.review_score_raw,
                r.artificial_analysis
            FROM Reviews_Raw r
            JOIN Jogos j ON r.game_id = j.game_id
            WHERE r.review_id = %s
            """,
            (review_id,),
        )
        row = cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Review não encontrada.")

        return {
            "review_id": row["review_id"],
            "game_id": row["game_id"],
            "game_name": row["game_name"],
            "review_text_raw": row["review_text_raw"],
            "review_score_raw": row["review_score_raw"],
            "artificial_analysis": row["artificial_analysis"],
        }
    finally:
        cursor.close()
        conn.close()


@router.get("/games/{game_id}/reviews/by-sentiment")
def reviews_by_sentiment(
    game_id: int,
    sentiment: int = Query(..., description="Use 1 para positivo e -1 para negativo"),
    limit: int = 50,
    offset: int = 0,
):
    if sentiment not in (-1, 1):
        raise HTTPException(
            status_code=400,
            detail="Parâmetro 'sentiment' deve ser 1 (positivo) ou -1 (negativo).",
        )

    conn = get_connection()
    try:
        cursor = conn.cursor()

        sql = """
            SELECT
                r.review_id,
                r.game_id,
                j.game_name,
                r.review_text_raw,
                r.review_score_raw,
                r.artificial_analysis
            FROM Reviews_Raw r
            JOIN Jogos j ON r.game_id = j.game_id
            WHERE r.game_id = %s
              AND r.review_score_raw = %s
            ORDER BY r.review_id ASC
            LIMIT %s OFFSET %s
        """

        params = (game_id, sentiment, limit, offset)

        cursor.execute(sql, params)
        rows = cursor.fetchall()

        results = []
        for row in rows:
            results.append(
                {
                    "review_id": row["review_id"],
                    "game_id": row["game_id"],
                    "game_name": row["game_name"],
                    "review_text_raw": row["review_text_raw"],
                    "review_score_raw": row["review_score_raw"],
                    "artificial_analysis": row["artificial_analysis"],
                }
            )

        return results
    finally:
        cursor.close()
        conn.close()


@router.get("/games/{game_id}/consistency", response_model=GameConsistency)
def game_consistency(game_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_with_ai,
                SUM(
                    CASE
                        WHEN artificial_analysis IS NULL THEN 0
                        WHEN (review_score_raw = 1 AND artificial_analysis = 1)
                             OR (review_score_raw = -1 AND artificial_analysis = 0)
                        THEN 1 ELSE 0
                    END
                ) AS consistent,
                SUM(
                    CASE
                        WHEN artificial_analysis IS NULL THEN 0
                        WHEN (review_score_raw = 1 AND artificial_analysis = 0)
                             OR (review_score_raw = -1 AND artificial_analysis = 1)
                        THEN 1 ELSE 0
                    END
                ) AS inconsistent
            FROM Reviews_Raw
            WHERE game_id = %s
              AND artificial_analysis IS NOT NULL
            """,
            (game_id,),
        )
        row = cursor.fetchone()
        total_with_ai = row["total_with_ai"] or 0
        consistent = row["consistent"] or 0
        inconsistent = row["inconsistent"] or 0
        consistency_rate = (consistent / total_with_ai if total_with_ai > 0 else 0.0)

        cursor.execute(
            """
            SELECT
                review_id,
                review_text_raw,
                review_score_raw,
                artificial_analysis
            FROM Reviews_Raw
            WHERE game_id = %s
              AND artificial_analysis IS NOT NULL
              AND (
                    (review_score_raw = 1 AND artificial_analysis = 0) OR
                    (review_score_raw = -1 AND artificial_analysis = 1)
                  )
            ORDER BY review_id ASC
            LIMIT 10
            """,
            (game_id,),
        )
        sample_rows = cursor.fetchall()

        from ..schemas import ConsistencySample

        samples = [
            ConsistencySample(
                review_id=r["review_id"],
                review_text_raw=r["review_text_raw"],
                review_score_raw=r["review_score_raw"],
                artificial_analysis=r["artificial_analysis"],
            )
            for r in sample_rows
        ]

        return GameConsistency(
            game_id=game_id,
            total_with_ai=total_with_ai,
            consistent=consistent,
            inconsistent=inconsistent,
            consistency_rate=consistency_rate,
            samples=samples,
        )
    finally:
        cursor.close()
        conn.close()
