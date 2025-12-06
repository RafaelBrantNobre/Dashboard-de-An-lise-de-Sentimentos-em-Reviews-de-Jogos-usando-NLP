from fastapi import APIRouter, HTTPException

from ..database import get_connection
from ..schemas import ReviewMetrics
from ..utils import save_review_metrics

router = APIRouter(tags=["reviews"])


@router.get("/reviews/{review_id}/metrics", response_model=ReviewMetrics)
def get_review_metrics(review_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                review_id,
                char_num,
                word_num,
                sent_num
            FROM Reviews_Processadas
            WHERE review_id = %s
            """,
            (review_id,),
        )
        row = cursor.fetchone()
        if row:
            return ReviewMetrics(
                review_id=row["review_id"],
                char_num=row["char_num"],
                word_num=row["word_num"],
                sent_num=row["sent_num"],
            )

        cursor.execute(
            "SELECT review_text_raw FROM Reviews_Raw WHERE review_id = %s",
            (review_id,),
        )
        review_row = cursor.fetchone()
        if review_row is None:
            raise HTTPException(status_code=404, detail="Review not found.")

        text = review_row["review_text_raw"]

        save_review_metrics(conn, review_id, text)
        conn.commit()

        cursor.execute(
            """
            SELECT
                review_id,
                char_num,
                word_num,
                sent_num
            FROM Reviews_Processadas
            WHERE review_id = %s
            """,
            (review_id,),
        )
        row = cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=500, detail="Failed to generate metrics for this review.")

        return ReviewMetrics(
            review_id=row["review_id"],
            char_num=row["char_num"],
            word_num=row["word_num"],
            sent_num=row["sent_num"],
        )
    finally:
        cursor.close()
        conn.close()
