from pydexcom import Dexcom
import pymongo
from pymongo import MongoClient
from time import sleep
from datetime import datetime, timedelta
import json
from dotenv import load_dotenv
import os
error = ""

def establish_dexcom_connection():
	try:
		return Dexcom(username=os.getenv("DEXCOM_USERNAME"), password=os.getenv("DEXCOM_PASSWORD"))
	except Exception as e:
		print(f"Failed to establish Dexcom connection: {e}")
		return None

dexcom = establish_dexcom_connection()

def Within_Six_Minutes(dt1, dt2):
	difference = abs(dt1 - dt2)
	return difference <= timedelta(minutes=6)

def Upsert(collection, document):
	document['_createdDate'] = datetime.now()
	UpsertResult = collection.update_one({'_datetime': document['_datetime']},{'$set': document}, upsert=True)
	if(UpsertResult.raw_result['n'] > 0):

		if UpsertResult.upserted_id is not None:
			print('[' + str(datetime.now()) + '] Inserted: ' + str(UpsertResult.upserted_id))



def CorrectRecords():
	print("Correcting Records from past 24 hours:")
	error = ""

	#Get Glucose Readings (past 24 hours)
	try:
		glucose_readings = dexcom.get_glucose_readings()
	except:
		error += "Could not get Glucose Readings. Re-establishing connection to Dexcom after 30 seconds. "
		sleep(5)
		dexcom = establish_dexcom_connection()
		try:
			glucose_readings = dexcom.get_glucose_readings()
		except:
			error += "Could not get Glucose Readings. Could not re-establish connection to Dexcom. "

	#Connect to MongoDB Readings DB
	try:
		cluster = os.getenv("MONGODB_URI")
		client = MongoClient(cluster)
		db = client.Dexcom
		Readings = db.Readings
	except:
		error += "Could not connect to MongoDB. "

	#Upsert Readings into MongoDB Readings DB
	try:
		for reading in glucose_readings:
			try:
				Upsert(Readings, vars(reading))
			except:
				print("\tCould not Upsert record: " + str(reading))
	except:
		error += "Could not upsert all records. "

	if error != "":
		print("Failed to Correct Records. Error: " + error)

def read24Hours():
	global error
	#Get Glucose Readings (past 24 hours)
	try:
		glucose_readings = dexcom.get_glucose_readings()
	except:
		error += "Could not get Glucose Readings. Re-establishing connection to Dexcom after 30 seconds"
		sleep(30)
		dexcom = establish_dexcom_connection()
		try:
			glucose_readings = dexcom.get_glucose_readings()
		except:
			error += "Could not get Glucose Readings. Could not re-establish connection to Dexcom. "

	#Upsert Readings into MongoDB Readings DB
	try:
		for reading in glucose_readings:
			try:
				Upsert(Readings, vars(reading))
			except:
				print("\tCould not Upsert record: " + str(reading))
	except:
		error += "Could not upsert all records. "

cluster = os.getenv("MONGODB_URI")
client = MongoClient(cluster)
db = client.Dexcom

Readings = db.Readings

dexcom.get_glucose_readings()

print('Connected to DB: ' + db.name)
print(db.list_collection_names())

glucose_reading = dexcom.get_latest_glucose_reading()

last_dt = glucose_reading.datetime

loopcount = 0
while True:
	if loopcount >= 360:
		#re-establish Dexcom connection after 100 readings
		dexcom = establish_dexcom_connection()
		loopcount = 0
	try:
		read24Hours()
	except:
		print("Error reading 24 hours")
	sleep(10)
	loopcount += 1