from pathlib import Path
from neo4j import GraphDatabase
import pandas as pd
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent


load_dotenv()
URI = os.getenv("NEO4J_URI")
USERNAME = os.getenv("NEO4J_USERNAME")
PASSWORD = os.getenv("NEO4J_PASSWORD")
DATABASE = os.getenv("NEO4J_DATABASE")

driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))

def test_connection():
    with driver.session(database="neo4j") as session:
        result = session.run("RETURN 'Connection successful!' AS message")
        
        for record in result:
            print(record["message"])

def create_people():
    people_path = BASE_DIR / "data" / "people.csv"
    people_df = pd.read_csv(people_path)
    with driver.session(database=DATABASE) as session:

        # avoid duplicates everytime I run the script
        session.run("MATCH (n) DETACH DELETE n")

        for _, row in people_df.iterrows():

            query = """
            CREATE (:Person {
                id: $id,
                name: $name,
                age: $age,
                city: $city,
                gender: $gender
            })
            """

            session.run(
                query,
                id=int(row["id"]),
                name=row["name"],
                age=int(row["age"]),
                city=row["city"],
                gender=row["gender"]
            )

def create_hobbies():
    hobbies_path = BASE_DIR / "data" / "hobbies.csv"
    hobbies_df = pd.read_csv(hobbies_path)
    with driver.session(database=DATABASE) as session:

        session.run("MATCH (n) DETACH DELETE n")

        for _, row in hobbies_df.iterrows():

            query = """
            CREATE (:Hobby {
                id: $id,
                name: $name
            })
            """

            session.run(
                query,
                id=int(row["hobby_id"]),
                name=row["name"]
            )




create_people()
create_hobbies()


# test_connection()

driver.close()


