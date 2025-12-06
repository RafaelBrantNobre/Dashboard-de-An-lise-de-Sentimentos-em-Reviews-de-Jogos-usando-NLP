import re
from typing import Tuple

# Modelo padrão (mantido aqui para compatibilidade)
MODEL_NAME = "NaiveBayes_CountVectorizer"
MODEL_VERSION = "v1"


def compute_metrics(text: str) -> Tuple[int, int, int]:
    """
    Calcula métricas simples de texto:
    - número de caracteres
    - número de palavras (tokens)
    - número de sentenças
    """
    if not text:
        return 0, 0, 0

    char_num = len(text)
    tokens = re.findall(r"\w+", text, flags=re.UNICODE)
    word_num = len(tokens)
    sent_parts = re.split(r"[.!?]+", text)
    sent_num = len([s for s in sent_parts if s.strip()])

    return char_num, word_num, sent_num


def save_review_metrics(conn, review_id: int, text: str):
    """
    Calcula métricas e delega o INSERT/UPDATE para a stored procedure
    `sp_save_review_metrics`. Não comita a conexão; quem chama controla.
    """
    char_num, word_num, sent_num = compute_metrics(text)

    cursor = conn.cursor()
    try:
        cursor.execute(
            "CALL sp_save_review_metrics(%s, %s, %s, %s, %s)",
            (review_id, text, char_num, word_num, sent_num),
        )
    finally:
        cursor.close()


def get_or_create_model_id(conn):
    """
    Busca o model_id em Modelos_IA com base em MODEL_NAME/MODEL_VERSION.
    Se não existir, insere e retorna o novo id.
    """
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT model_id
            FROM Modelos_IA
            WHERE model_name = %s AND model_version = %s
            """,
            (MODEL_NAME, MODEL_VERSION),
        )
        row = cursor.fetchone()
        if row:
            return row["model_id"] if isinstance(row, dict) else row[0]

        cursor.execute(
            """
            INSERT INTO Modelos_IA (model_name, model_version)
            VALUES (%s, %s)
            """,
            (MODEL_NAME, MODEL_VERSION),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
