# Graph Databases with Neo4j

This project was developed as part of the _Big Data Mangement Systems_ course and focuses on modeling and querying graph data using **Neo4j** and **Cypher**.

The project creates a social network graph from CSV files containing information about people, friendships, hobbies, and hobby preferences (likes).

# 1. General Description of the Project and the Data

The goal of this project is to model a small social network using a graph database.

The provided CSV files are imported into Neo4j and transformed into:

- **Nodes**
  - `Person`
  - `Hobby`

- **Relationships**
  - `FRIENDS_WITH`
  - `LIKES`

---

## Dataset Description

### `people.csv`

Contains information about people.

| Column | Description       |
| ------ | ----------------- |
| id     | Unique person ID  |
| name   | Person name       |
| age    | Person age        |
| city   | City of residence |
| gender | Gender            |

---

### `friendships.csv`

Contains friendship relationships between people.

| Column     | Description             |
| ---------- | ----------------------- |
| person1_id | First person ID         |
| person2_id | Second person ID        |
| since      | Year friendship started |

---

### `hobbies.csv`

Contains hobbies.

| Column   | Description     |
| -------- | --------------- |
| hobby_id | Unique hobby ID |
| name     | Hobby name      |

---

### `likes.csv`

Contains which hobbies are liked by which people.

| Column    | Description |
| --------- | ----------- |
| person_id | Person ID   |
| hobby_id  | Hobby ID    |

# 2. Structure of the Project

```text
project-root/
│
├── data/
│   ├── people.csv
│   ├── friendships.csv
│   ├── hobbies.csv
│   └── likes.csv
│
├── src/
│   └── import_data.py
│
├── cypher/
│   └── queries.cypher
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

# 3. Requirements to Run the Project

## Install Neo4j

- Download and install Neo4j Desktop
- After installation:

1. Create a local DBMS
2. Start the database
3. Set username and password
4. Use the default database named `neo4j`

---

## Install Required Python Libraries

```bash
pip install neo4j pandas python-dotenv
```

---

## Configure Environment Variables

Create a `.env` file:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j
```

---

## Run the Import Script

```bash
python src/import_data.py
```

This script:

- clears the database,
- creates `Person` and `Hobby` nodes,
- creates `FRIENDS_WITH` relationships,
- creates `LIKES` relationships.

---

## Run Cypher Queries

Open Neo4j Browser and execute the queries from:

```text
cypher/queries.cypher
```

# 4. Results from quirements to Run the Project

## a. List all people

## b. Find all friends of Alice

## c. Find all people living in Paris

## d. Find all friendship pairs (name1, name2) with the year they became friends

## e. Count number of friends each person has

## f. Find all people who like Cooking

## g. Find friends who share at least one hobby

## h. Count hobbies by city

## i. Most popular hobby
