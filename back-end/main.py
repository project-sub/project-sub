from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from routers import auth, document


import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers = ["Content-Disposition"]
)

app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("8a9c7127e40925f18e43051a7e594bff22663efb4d0ebcbf450c1ccfcf91e2c6"),
    same_site="lax",
    https_only=False, 
    
    )

app.include_router(auth.router)
app.include_router(document.router)



@app.get("/")
def root():
    return {
        "message": "Back-end server is running"
    }