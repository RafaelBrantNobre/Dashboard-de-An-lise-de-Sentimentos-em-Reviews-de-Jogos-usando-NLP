# app/main.py
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import csv
import io
import re  # RF07 - métricas por review

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import games, reviews, predictions


app = FastAPI(title="Steam Reviews NLP API")

# In development it's convenient to allow all origins to avoid CORS issues from the frontend dev server.
# For production, restrict this to your frontend origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # CHANGE TO SPECIFIC ORIGINS IN PRODUCTION
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(games.router)
app.include_router(reviews.router)
app.include_router(predictions.router)