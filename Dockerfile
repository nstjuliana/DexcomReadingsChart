# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file first (if exists)
COPY requirements.txt ./

COPY dexcom.py ./

# Copy the .env file
COPY .env ./

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Command to run the script
CMD ["python", "dexcom.py"]