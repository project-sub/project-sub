from fastapi import FastAPI
from app import db

app = FastAPI()

@app.get("/")
def root():
    return {"message":"backend running"}