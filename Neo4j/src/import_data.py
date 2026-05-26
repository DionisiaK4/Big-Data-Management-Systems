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

def clear_database():
    with driver.session(database=DATABASE) as session:
        # avoid duplicates everytime I run the script
        session.run("MATCH (n) DETACH DELETE n")
        print("Database cleared.")

def create_people():
    people_path = BASE_DIR / "data" / "people.csv"
    people_df = pd.read_csv(people_path)
    with driver.session(database=DATABASE) as session:
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
            print("People created.")

def create_hobbies():
    hobbies_path = BASE_DIR / "data" / "hobbies.csv"
    hobbies_df = pd.read_csv(hobbies_path)
    with driver.session(database=DATABASE) as session:
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
            print("Hobbies created.")


def create_friendships():
    friendships_path = BASE_DIR / "data" / "friendships.csv"
    friendships_df = pd.read_csv(friendships_path)
    with driver.session(database=DATABASE) as session:
        for _, row in friendships_df.iterrows():

            query = """
            MATCH (p1:Person {id: $person1_id})
            MATCH (p2:Person {id: $person2_id})
            CREATE (p1)-[:FRIENDS_WITH {since: $since}]->(p2)
            """

            session.run(
                query,
                person1_id=int(row["person1_id"]),
                person2_id=int(row["person2_id"]),
                since=int(row["since"])
            )
            print("Friendships created.")

def create_likes():
    likes_path = BASE_DIR / "data" / "likes.csv"
    likes_df = pd.read_csv(likes_path)
    with driver.session(database=DATABASE) as session:
        for _, row in likes_df.iterrows():

            query = """
            MATCH (p:Person {id: $person_id})
            MATCH (h:Hobby {id: $hobby_id})
            CREATE (p)-[:LIKES]->(h)
            """

            session.run(
                query,
                person_id=int(row["person_id"]),
                hobby_id=int(row["hobby_id"])
            )

    print("Likes created.")

# test_connection()

clear_database()
create_people()
create_hobbies()
create_friendships()
create_likes()

driver.close()


