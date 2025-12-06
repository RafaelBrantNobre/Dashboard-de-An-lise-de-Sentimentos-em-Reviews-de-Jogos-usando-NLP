from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from typing import List, Optional
import csv
import io

from ..database import get_connection
from ..ml import predict_sentiment, predict_with_model_name
from ..schemas import TextReview, PredictionResult, PredictionWithContext, SaveTextReview
from ..utils import get_or_create_model_id, MODEL_NAME, MODEL_VERSION

router = APIRouter(tags=["predictions"])


@router.get("/models")
def list_models():
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT model_id, model_name, model_version, base_accuracy FROM Modelos_IA ORDER BY model_id ASC")
        rows = cursor.fetchall()
        return rows
    finally:
        cursor.close()
        conn.close()


@router.post("/predict/review/{review_id}", response_model=PredictionResult)
def predict_for_review(review_id: int, model_id: Optional[int] = Query(None)):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT review_text_raw FROM Reviews_Raw WHERE review_id = %s", (review_id,))
        row = cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Review não encontrada.")

        review_text = row["review_text_raw"]

        # salva métricas
        from ..utils import save_review_metrics

        save_review_metrics(conn, review_id, review_text)
        # determine which model to use
        if model_id is None:
            # default model
            model_id = get_or_create_model_id(conn)

        # check if we already have a prediction for this review/model
        cursor.execute(
            "SELECT prediction_id, sentimento_predito, data_predicao FROM Predicoes_Sentimento WHERE review_id = %s AND model_id = %s LIMIT 1",
            (review_id, model_id),
        )
        existing = cursor.fetchone()
        if existing:
            # return existing prediction
            return PredictionResult(
                review=review_text,
                sentimento_predito=int(existing["sentimento_predito"]),
                sentimento_str="positivo" if int(existing["sentimento_predito"]) == 1 else "negativo",
                model_id=model_id,
                data_predicao=existing.get("data_predicao"),
            )

        # load model metadata
        cursor.execute("SELECT model_name, model_version FROM Modelos_IA WHERE model_id = %s", (model_id,))
        mrow = cursor.fetchone()
        if mrow is None:
            raise HTTPException(status_code=404, detail="Modelo não encontrado.")

        model_name = mrow["model_name"]
        model_version = mrow.get("model_version")

        # run prediction using the selected model
        try:
            pred = predict_with_model_name(review_text, model_name, model_version)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

        # insert prediction
        cursor.execute(
            "INSERT INTO Predicoes_Sentimento (review_id, sentimento_predito, model_id) VALUES (%s, %s, %s)",
            (review_id, pred, model_id),
        )

        # if the model is the default one, update Reviews_Raw artificial_analysis
        default_model_id = get_or_create_model_id(conn)
        if model_id == default_model_id:
            cursor.execute(
                "UPDATE Reviews_Raw SET artificial_analysis = %s WHERE review_id = %s",
                (pred, review_id),
            )

        conn.commit()

        # fetch inserted timestamp
        inserted_id = cursor.lastrowid
        cursor.execute("SELECT data_predicao FROM Predicoes_Sentimento WHERE prediction_id = %s", (inserted_id,))
        dtrow = cursor.fetchone()
        data_pred = dtrow.get("data_predicao") if dtrow else None

        return PredictionResult(
            review=review_text,
            sentimento_predito=pred,
            sentimento_str="positivo" if pred == 1 else "negativo",
            model_id=model_id,
            data_predicao=data_pred,
        )
    finally:
        cursor.close()
        conn.close()


@router.post("/predict/review-once/{review_id}", response_model=PredictionResult)
def predict_for_review_once(review_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT review_text_raw FROM Reviews_Raw WHERE review_id = %s", (review_id,))
        row = cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Review não encontrada.")

        review_text = row["review_text_raw"]
        model_id = get_or_create_model_id(conn)

        cursor.execute(
            "SELECT 1 FROM Predicoes_Sentimento WHERE review_id = %s AND model_id = %s LIMIT 1",
            (review_id, model_id),
        )
        already = cursor.fetchone()
        if already:
            raise HTTPException(status_code=409, detail="Já existe uma predição registrada para essa review com o modelo padrão. Reclassificação não permitida.")

        from ..utils import save_review_metrics

        save_review_metrics(conn, review_id, review_text)

        pred = predict_sentiment(review_text)
        cursor.execute(
            "INSERT INTO Predicoes_Sentimento (review_id, sentimento_predito, model_id) VALUES (%s, %s, %s)",
            (review_id, pred, model_id),
        )

        cursor.execute(
            "UPDATE Reviews_Raw SET artificial_analysis = %s WHERE review_id = %s",
            (pred, review_id),
        )

        conn.commit()

        return PredictionResult(
            review=review_text,
            sentimento_predito=pred,
            sentimento_str="positivo" if pred == 1 else "negativo",
        )
    finally:
        cursor.close()
        conn.close()


@router.post("/predict/text", response_model=PredictionResult)
def predict_free_text(payload: TextReview):
    text = payload.review
    pred = predict_sentiment(text)
    return PredictionResult(
        review=text,
        sentimento_predito=pred,
        sentimento_str="positivo" if pred == 1 else "negativo",
    )


@router.post("/predict/text/save", response_model=PredictionResult)
def predict_and_save_text(payload: SaveTextReview):
    text = payload.review
    game_id = payload.game_id
    review_score_raw = payload.review_score_raw

    if review_score_raw not in (-1, 1):
        raise HTTPException(status_code=400, detail="review_score_raw deve ser 1 (positivo) ou -1 (negativo).")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT game_id FROM Jogos WHERE game_id = %s", (game_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Jogo não encontrado.")

        pred = predict_sentiment(text)
        model_id = get_or_create_model_id(conn)

        cursor.execute(
            "INSERT INTO Reviews_Raw (game_id, review_text_raw, review_score_raw, artificial_analysis) VALUES (%s, %s, %s, %s)",
            (game_id, text, review_score_raw, pred),
        )
        review_id = cursor.lastrowid

        from ..utils import save_review_metrics

        save_review_metrics(conn, review_id, text)

        cursor.execute(
            "INSERT INTO Predicoes_Sentimento (review_id, sentimento_predito, model_id) VALUES (%s, %s, %s)",
            (review_id, pred, model_id),
        )

        conn.commit()

        return PredictionResult(
            review=text,
            sentimento_predito=pred,
            sentimento_str="positivo" if pred == 1 else "negativo",
        )
    finally:
        cursor.close()
        conn.close()


@router.post("/predict/batch-csv")
def predict_batch_csv(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Envie um arquivo CSV.")

    try:
        contents = file.file.read().decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Não foi possível decodificar o CSV como UTF-8.")

    f = io.StringIO(contents)
    reader = csv.DictReader(f)

    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="CSV sem cabeçalho. Inclua uma linha de cabeçalho.")

    fieldnames_lower = {name.lower(): name for name in reader.fieldnames}
    possible_cols = ["review_text_raw", "review", "text"]

    text_col = None
    for col in possible_cols:
        if col in fieldnames_lower:
            text_col = fieldnames_lower[col]
            break

    if text_col is None:
        raise HTTPException(status_code=400, detail=("Não foi possível encontrar coluna de texto. Use um cabeçalho como 'review_text_raw', 'review' ou 'text'."))

    total = 0
    positivas = 0
    negativas = 0
    detalhes = []

    for idx, row in enumerate(reader, start=1):
        text = (row.get(text_col) or "").strip()
        if not text:
            continue

        pred = predict_sentiment(text)
        total += 1
        if pred == 1:
            positivas += 1
        else:
            negativas += 1

        if len(detalhes) < 50:
            detalhes.append({
                "linha": idx,
                "review": text,
                "sentimento_predito": pred,
                "sentimento_str": "positivo" if pred == 1 else "negativo",
            })

    percentual_positivas = (positivas / total) if total > 0 else 0.0
    percentual_negativas = (negativas / total) if total > 0 else 0.0

    return {
        "arquivo": filename,
        "total_reviews": total,
        "positivas": positivas,
        "negativas": negativas,
        "percentual_positivas": percentual_positivas,
        "percentual_negativas": percentual_negativas,
        "detalhes": detalhes,
    }


@router.post("/predict/batch-csv/save")
def predict_batch_csv_save(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Envie um arquivo CSV.")

    try:
        contents = file.file.read().decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Não foi possível decodificar o CSV como UTF-8.")

    f = io.StringIO(contents)
    reader = csv.DictReader(f)

    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="CSV sem cabeçalho. Inclua uma linha de cabeçalho.")

    fieldnames_lower = {name.lower(): name for name in reader.fieldnames}

    possible_text_cols = ["review_text_raw", "review", "text"]
    text_col = None
    for col in possible_text_cols:
        if col in fieldnames_lower:
            text_col = fieldnames_lower[col]
            break

    if text_col is None:
        raise HTTPException(status_code=400, detail=("Não foi possível encontrar coluna de texto. Use um cabeçalho como 'review_text_raw', 'review' ou 'text'."))

    if "game_id" not in fieldnames_lower or "review_score_raw" not in fieldnames_lower:
        raise HTTPException(status_code=400, detail=("Para salvar no banco, o CSV deve conter as colunas 'game_id' e 'review_score_raw'."))

    game_id_col = fieldnames_lower["game_id"]
    score_col = fieldnames_lower["review_score_raw"]

    conn = get_connection()
    cursor = conn.cursor()
    try:
        model_id = get_or_create_model_id(conn)

        total_rows = 0
        inserted = 0
        skipped = 0
        inserted_ids: list[int] = []

        for idx, row in enumerate(reader, start=1):
            total_rows += 1

            text = (row.get(text_col) or "").strip()
            if not text:
                skipped += 1
                continue

            try:
                game_id = int(row.get(game_id_col))
            except (TypeError, ValueError):
                skipped += 1
                continue

            try:
                review_score_raw = int(row.get(score_col))
            except (TypeError, ValueError):
                skipped += 1
                continue

            if review_score_raw not in (-1, 1):
                skipped += 1
                continue

            pred = predict_sentiment(text)

            cursor.execute(
                "INSERT INTO Reviews_Raw (game_id, review_text_raw, review_score_raw, artificial_analysis) VALUES (%s, %s, %s, %s)",
                (game_id, text, review_score_raw, pred),
            )
            review_id = cursor.lastrowid

            from ..utils import save_review_metrics

            save_review_metrics(conn, review_id, text)

            cursor.execute(
                "INSERT INTO Predicoes_Sentimento (review_id, sentimento_predito, model_id) VALUES (%s, %s, %s)",
                (review_id, pred, model_id),
            )

            inserted += 1
            inserted_ids.append(review_id)

        conn.commit()

        detalhes = []
        if inserted_ids:
            sample_ids = inserted_ids[:50]
            placeholders = ",".join(["%s"] * len(sample_ids))

            cursor.execute(
                f"""
                SELECT
                    review_id,
                    game_id,
                    game_name,
                    review_text_raw,
                    review_score_raw,
                    artificial_analysis
                FROM vw_reviews_with_predictions
                WHERE review_id IN ({placeholders})
                ORDER BY review_id ASC
                """,
                sample_ids,
            )
            rows = cursor.fetchall()
            for row in rows:
                detalhes.append(
                    {
                        "review_id": row["review_id"],
                        "game_id": row["game_id"],
                        "game_name": row["game_name"],
                        "review_text_raw": row["review_text_raw"],
                        "review_score_raw": row["review_score_raw"],
                        "artificial_analysis": row["artificial_analysis"],
                    }
                )

        return {
            "arquivo": filename,
            "total_rows": total_rows,
            "inserted": inserted,
            "skipped": skipped,
            "detalhes": detalhes,
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


@router.get("/predictions", response_model=List[PredictionWithContext])
def list_predictions(
    game_id: Optional[int] = None,
    sentiment: Optional[int] = None,
    review_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        where_clauses = []
        params: list = []

        if game_id is not None:
            where_clauses.append("r.game_id = %s")
            params.append(game_id)

        if sentiment is not None:
            where_clauses.append("p.sentimento_predito = %s")
            params.append(sentiment)

        if review_id is not None:
            where_clauses.append("p.review_id = %s")
            params.append(review_id)

        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)

        query = f"""
            SELECT
                p.prediction_id,
                p.review_id,
                r.game_id,
                j.game_name,
                r.review_text_raw,
                p.sentimento_predito,
                p.data_predicao,
                m.model_id,
                m.model_name,
                m.model_version
            FROM Predicoes_Sentimento p
            JOIN Reviews_Raw r ON p.review_id = r.review_id
            JOIN Jogos j ON r.game_id = j.game_id
            JOIN Modelos_IA m ON p.model_id = m.model_id
            {where_sql}
            ORDER BY p.data_predicao DESC
            LIMIT %s OFFSET %s
        """

        params.extend([limit, offset])
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        results: List[PredictionWithContext] = []
        for row in rows:
            sentimento_predito = row["sentimento_predito"]
            sent_str = "positive" if sentimento_predito == 1 else "negative"

            results.append(
                PredictionWithContext(
                    prediction_id=row["prediction_id"],
                    review_id=row["review_id"],
                    game_id=row["game_id"],
                    game_name=row["game_name"],
                    review_text_raw=row["review_text_raw"],
                    sentimento_predito=sentimento_predito,
                    sentimento_str=sent_str,
                    data_predicao=row["data_predicao"],
                    model_id=row.get("model_id") or row.get("model_id"),
                    model_name=row["model_name"],
                    model_version=row["model_version"],
                )
            )

        return results
    finally:
        cursor.close()
        conn.close()
