from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
import os
from dotenv import load_dotenv

from tools import calculate
from tools import get_weather
from tools import check_time


load_dotenv()

llm = ChatGroq(
   model = 'llama-3.3-70b-versatile',
   api_key= os.getenv('GROQ_API_KEY')
)

tools = [get_weather, calculate, check_time]
memory = MemorySaver()
agent = create_react_agent(llm, tools, checkpointer=memory)



def run_agent(mess: str, session_id: str) -> str:
   try:
      config = {"configurable": {"thread_id": session_id}}
      response_weather = agent.invoke({
         "messages": [("human", mess)]
      }, config=config)
      return response_weather["messages"][-1].content
   except Exception as e:
      return(f"Error: {e}")


if __name__ == "__main__":
   while True:
      user_input = input("Enter the question here:  ")
      if user_input == "exit" or user_input == "quit" or user_input == "stop":
         print("AI AGENT STOP WORKING")
         break
      else:
         result = run_agent(user_input, "Robben_Session_1")
         print(result)

