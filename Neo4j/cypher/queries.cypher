//Check if everything exists
MATCH (n)
RETURN labels(n) AS labels, count(n) AS count;

MATCH ()-[r]->()
RETURN type(r) AS relationship_type, count(r) AS count;


//Query a: List all people
MATCH (p:Person)
RETURN p.name AS name, p.age AS age, p.city AS city, p.gender AS gender;

//Query b: Find all friends of Alice
// - and not arrow so it included two-way friendship
MATCH (:Person {name: 'Alice'})-[:FRIENDS_WITH]-(friend:Person)
RETURN friend.name AS friend;

// Query c: Find all people living in Paris
MATCH (p:Person {city: 'Paris'})
RETURN p.name AS name, p.age AS age, p.gender AS gender;

// Query d: Find all friendship pairs with year
// p1.id < p2.id not to have duplicates
MATCH (p1:Person)-[f:FRIENDS_WITH]-(p2:Person)
WHERE p1.id < p2.id
RETURN p1.name AS name1, p2.name AS name2, f.since AS since;

// Query e: Count number of friends each person has
MATCH (p:Person)
OPTIONAL MATCH (p)-[:FRIENDS_WITH]-(friend:Person)
RETURN p.name AS person, count(friend) AS number_of_friends
ORDER BY number_of_friends DESC;

// Query f: Find all people who like Cooking
MATCH (p:Person)-[:LIKES]->(h:Hobby {name: 'Cooking'})
RETURN p.name AS person;

// Query g: Find friends who share at least one hobby
// collect(h.name) = collects all shared hobbies in a list
MATCH (p1:Person)-[:FRIENDS_WITH]-(p2:Person)
MATCH (p1)-[:LIKES]->(h:Hobby)<-[:LIKES]-(p2)
WHERE p1.id < p2.id
RETURN
    p1.name AS person1,
    p2.name AS person2,
    collect(h.name) AS shared_hobbies;

// Query h: Count hobbies by city
MATCH (p:Person)-[:LIKES]->(h:Hobby)
RETURN
    p.city AS city,
    count(h) AS total_hobbies
ORDER BY total_hobbies DESC;

// Query i: Most popular hobby
MATCH (p:Person)-[:LIKES]->(h:Hobby)
RETURN
    h.name AS hobby,
    count(p) AS likes
ORDER BY likes DESC
LIMIT 1;