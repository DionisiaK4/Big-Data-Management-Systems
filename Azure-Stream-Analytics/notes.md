# Notes

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
