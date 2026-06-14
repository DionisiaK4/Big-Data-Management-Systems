SELECT
    accountId,
    COUNT(*) AS transactionCount,
    System.Timestamp() AS windowEnd
INTO
    task3Output
FROM
    atmInput TIMESTAMP BY eventTime
GROUP BY
    accountId,
    SlidingWindow(second, 30)
HAVING
    COUNT(*) >= 3