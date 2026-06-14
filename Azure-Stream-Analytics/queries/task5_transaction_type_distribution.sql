SELECT
    area,
    transactionType,
    COUNT(*) AS transactionTypeCount,
    System.Timestamp() AS windowEnd
INTO
    task5Output
FROM
    atmInput TIMESTAMP BY eventTime
GROUP BY
    area,
    transactionType,
    HoppingWindow(minute, 15, 5)