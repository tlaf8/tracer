# tracer

## Description
A React based full stack web application for managing and tracking rentals using QR codes.

## Deploying

### Backend
To start the backend, run:

#### Windows
```
# Creates the python environment
python -m venv venv  
           
# Activates the environment                
.\venv\Scripts\activate        

# Install necessary libraries and packages                 
pip install -r requirements               

# Run the backend      
flask run --host 0.0.0.0 --port 9998
```

#### Linux
```
# Creates the python environment
python -m venv venv  
           
# Activates the environment                
source venv/bin/activate    

# Install necessary libraries and packages                 
pip install -r requirements               

# Run the backend      
flask run --host 0.0.0.0 --port 9998
```

### Frontend
```
# Install dependencies
npm install

# Start the server
npm run dev

# Note: Requests may be being made to the wrong endpoint
# You may need to update this to match your backend
# For example, if you want to deploy locally, set endpoints to localhost
# Otherwise, update endpoints to your designated backend server
```

## Help
For any support (such as obtaining a link code for the official site found [here](https://tracer.dedyn.io/)), 
issues or suggestions, email me at [21laforgth@gmail.com](mailto:21laforgth@gmail.com) and I'll get back at you as soon 
as I'm available.