SELECT
    area,
    COUNT(*) AS transactionCount,
    SUM(amount) AS totalAmount,
    System.Timestamp() AS windowEnd
INTO
    task1Output
FROM
    atmInput TIMESTAMP BY eventTime
GROUP BY
    area,
    TumblingWindow(minute, 1)