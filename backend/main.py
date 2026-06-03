from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware #for security which allowed request from React on specific port (ex: 5173)
from pydantic import BaseModel # validates and structures incoming data
from agent import run_agent
import uuid

#create web server
app = FastAPI()

#CORS Middleware(app)
CORSMiddleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    # what fields does request need?
    message: str
    session_id: str = "" #default if session_id is empty

class ChatResponse(BaseModel):
    # what fields does response need?
    response: str
    session_id: str


#################################
       #End Point
#################################
@app.get("/")
def health_check():
    return {"message": "Hello World"}

@app.post("/chat")
def chat(request: ChatRequest):
    # get session id from request or generate new on
    session_id = request.session_id or str(uuid.uuid4())
    message = request.message
    # Call run_agent()
    response = run_agent(message, session_id)
    #return ChatResponse
    return ChatResponse(response=response, session_id=session_id)









