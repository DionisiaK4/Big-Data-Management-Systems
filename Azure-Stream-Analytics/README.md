# Intro

# The idea

Το Event Hub είναι η “ουρά/είσοδος” όπου πέφτουν συνεχώς οι ATM συναλλαγές. Το Azure Stream Analytics είναι η μηχανή που διαβάζει αυτά τα events σε πραγματικό χρόνο και τρέχει SQL-like queries πάνω σε χρονικά παράθυρα. Το Blob Storage είναι το σημείο όπου αποθηκεύονται τα αποτελέσματα ως JSON αρχεία.

Οι έννοιες
Event

Ένα event είναι μία ATM συναλλαγή.

Το script παράγει τέτοια events κάθε 0.5 δευτερόλεπτα. Το script κάνει simulate ATM events.

Event Hub

Το Event Hub είναι το ingestion layer. Δεν κάνει ανάλυση. Απλώς δέχεται πολλά events γρήγορα και τα κρατά ώστε να τα διαβάσουν άλλα services. Η Microsoft το περιγράφει ως fully managed real-time streaming platform για ingestion πολλών events με χαμηλό latency.

Stream Analytics Job

Ένα Stream Analytics job έχει τρία βασικά μέρη:

Input → Query → Output

Στη δική σου εργασία:

Event Hub → SQL-like query με windows → Blob Storage JSON files

Η Microsoft επίσης περιγράφει ότι ένα Stream Analytics job αποτελείται από input, query και output, και το output καλείται μέσα στο query με INTO.

Windowing

Επειδή τα δεδομένα έρχονται συνεχώς, δεν μπορείς απλώς να πεις “κάνε GROUP BY σε όλα”. Πρέπει να πεις “υπολόγισε κάτι για τα τελευταία Χ λεπτά/δευτερόλεπτα”. Αυτό είναι το windowing. Το Azure Stream Analytics υποστηρίζει time windows όπως Tumbling, Hopping, Sliding και Session.

Τα τρία που χρειάζεσαι:

Tumbling window: μη επικαλυπτόμενα παράθυρα.
Παράδειγμα: κάθε 1 λεπτό βγάζει ένα αποτέλεσμα για το προηγούμενο ακριβώς λεπτό.

00:00-01:00
01:00-02:00
02:00-03:00

Hopping window: επικαλυπτόμενα παράθυρα. Έχει window size και hop size.
Παράδειγμα: “τελευταία 10 λεπτά, κάθε 1 λεπτό”. Άρα κάθε λεπτό βγάζει αποτέλεσμα κοιτώντας πίσω 10 λεπτά.

00:00-10:00
01:00-11:00
02:00-12:00

Sliding window: βγάζει αποτέλεσμα όταν αλλάζει κάτι μέσα στο παράθυρο. Χρήσιμο για detection τύπου “αν μέσα σε 30 δευτερόλεπτα έγιναν 3+ transactions”.

Το generator στέλνει events σαν JSON, άρα τα queries του Azure Stream Analytics μπορούν να χρησιμοποιήσουν απευθείας αυτά τα field names.

# Set Up

Για το Event Hub (Partitions)
Η ροή είναι:
Python generator → Event Hub partitions → Stream Analytics input → Query → Output
↓
Blob ή SQL Database

Αλλά για τη δική σου εργασία, με generator που στέλνει ένα event κάθε 0.5 δευτερόλεπτα, αυτό δεν θα σου αλλάξει πρακτικά τίποτα στο output.

# Generator

# Stream Analytics jobs

# Tasks

# Outputs

# Extra

Blob Storage = αποθήκευση αποτελεσμάτων ως αρχεία. Azure SQL Database = αποθήκευση αποτελεσμάτων ως γραμμές σε πίνακες.

# GENERAL

Title Page

1. Introduction
2. Scenario and Data Description
3. Architecture

   Python ATM Generator
   ↓
   Azure Event Hub
   ↓
   Azure Stream Analytics Jobs
   ↓
   Azure Blob Storage Containers
   ↓
   JSON files + Report screenshots

4. Azure Environment Setup
5. Event Generator
6. Stream Analytics Jobs
   6.1 Task 1 – Transaction Volume per Area
   6.2 Task 2 – High-Value Withdrawals
   6.3 Task 3 – Burst Activity per Account
   6.4 Task 4 – Average Withdrawal Amount per Area
   6.5 Task 5 – Transaction Type Distribution
7. Output Validation
8. GitHub Repository
