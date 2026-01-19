from flask import Flask

app = Flask(
    __name__, 
    static_folder="static", 
    template_folder="template"
)

# Import other modules to register routes and auth
from app import app_routes, app_auth
