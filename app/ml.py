# app/ml.py
import joblib
from pathlib import Path
from typing import Tuple, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

_model_cache = {}


def _load_joblib(path: Path):
    """Load with caching per file path."""
    key = str(path)
    if key in _model_cache:
        return _model_cache[key]
    obj = joblib.load(path)
    _model_cache[key] = obj
    return obj


def _map_model_name_to_files(model_name: str, model_version: Optional[str] = None) -> dict:
    """
    Map logical model_name to file(s) present in the `models/` folder.
    Extend this mapping when adding new models.
    Returns a dict describing how to call the model:
      - type: 'pipeline' -> a scikit-learn Pipeline that accepts raw text
      - type: 'model+vectorizer' -> model requires vectorizer.transform
    """
    name = model_name.lower()
    # simple heuristic mapping
    if "gnb" in name or "gaussian" in name:
        return {"type": "pipeline", "model": "gnb.pkl"}
    if "bnb" in name or "bernoulli" in name:
        return {"type": "pipeline", "model": "bnb.pkl"}
    if "pipeline" in name or "nb_pipeline" in name:
        return {"type": "pipeline", "model": "nb_pipeline.pkl"}
    # default fallback to model + vectorizer
    return {"type": "model+vectorizer", "model": "nb_model.pkl", "vectorizer": "count_vectorizer.pkl"}


def predict_sentiment(text: str) -> int:
    """
    Backwards-compatible default prediction using the configured default files.
    """
    mapping = {"type": "model+vectorizer", "model": "nb_model.pkl", "vectorizer": "count_vectorizer.pkl"}
    model_file = MODELS_DIR / mapping["model"]
    vec_file = MODELS_DIR / mapping["vectorizer"]
    model = _load_joblib(model_file)
    vectorizer = _load_joblib(vec_file)
    X = vectorizer.transform([text])
    pred = model.predict(X)[0]
    return int(pred)


def predict_with_model_name(text: str, model_name: str, model_version: Optional[str] = None) -> int:
    """
    Predict using a model identified by `model_name` (and optional version).
    The mapping to files is done by `_map_model_name_to_files`.
    """
    files = _map_model_name_to_files(model_name, model_version)
    if files["type"] == "pipeline":
        model_path = MODELS_DIR / files["model"]
        pipeline = _load_joblib(model_path)
        # pipeline.predict accepts raw text
        pred = pipeline.predict([text])[0]
        return int(pred)
    else:
        model_path = MODELS_DIR / files["model"]
        vec_path = MODELS_DIR / files["vectorizer"]
        model = _load_joblib(model_path)
        vectorizer = _load_joblib(vec_path)
        X = vectorizer.transform([text])
        pred = model.predict(X)[0]
        return int(pred)


def available_models() -> list:
    """Return a list of model filenames available (for diagnostics)."""
    return [p.name for p in MODELS_DIR.iterdir() if p.is_file()]
