import requests
from langchain_core.tools import tool
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import os
from dotenv import load_dotenv
import pytz
from datetime import datetime

load_dotenv()

##############################################################
        #Check Weather
##############################################################
def is_real_city(city_name, country=None):
    #check if city_name is string and without white space
    if not isinstance(city_name, str) or not city_name.strip():
        return False

    try:
        geolocator = Nominatim(user_agent="city_checker")
        query = city_name.strip()
        if country:
            query += f", {country}"

        location = geolocator.geocode(query, exactly_one=True, timeout=10)

        # If location is found and has a city/town/village in its address
        if location and location.raw.get("display_name"):
            address = location.raw.get("display_name").lower()
            return city_name.lower() in address
        return False

    except (GeocoderTimedOut, GeocoderServiceError):
        print("Geocoding service error or timeout.")
        return False

@tool(description="Retrieve Live Weather forecast Of City, Use it when you want to now the temperature of specific city, input should be a string city name")
def get_weather(city_name: str) -> str:

    try:
        if is_real_city(city_name):
           api_key = os.getenv("WEATHER_API_KEY")
           response = requests.get(f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={city_name}", timeout=5)
           data = response.json()
           return f"{data["location"]["name"]}: {data['current']['temp_c']}"
        else:
            return("City not found.")

    except Exception as e:
        return(f"Cannot Load The Weather {e}")


##############################################################
        #Calculate Expression
##############################################################
@tool(description="Calculate any math expression. Use when user sends numbers with operators like '15 + 8' or asks to calculate something. Input should be a valid math expression like '2 + 2' or '15 * 8 / 3'")
def calculate(expression:  str) -> str:
    allowed_charecter = ("+-*/0123456789")

    #check the expression format
    for char in expression:
        if char not in allowed_charecter:
            return("Invalid Expression")

    try:
        result = eval(expression)
        return f"{expression} = {result}"
    except ZeroDivisionError:
        return("Cannot Divide by Zero")
    except Exception as e:
        return(f"Error: {e}")


##############################################################
        #Time Zone Specific Area
##############################################################
@tool(description="Get the timezone of specific city, use it when you want to get the timezone of specific city, input should be a string format like this city name Europe/Amsterdam")
def check_time(time_zone: str) -> str:
    #Get Specific timezone
    try:
        tz = pytz.timezone(time_zone)
        now = datetime.now(tz)
        return f"{time_zone} : {now.strftime('%d %B %Y')} {now.strftime('%I:%M %p')}"
    except pytz.UnknownTimeZoneError:
        return f"'{time_zone}' is not a valid timezone. Try formats like 'Europe/Amsterdam' or 'America/New_York'"







