SELECT
    area,
    AVG(amount) AS averageWithdrawalAmount,
    -- COUNT(*) AS withdrawalCount,
    System.Timestamp() AS windowEnd
INTO
    task4Output
FROM
    atmInput TIMESTAMP BY eventTime
WHERE
    transactionType = 'withdrawal'
GROUP BY
    area,
    TumblingWindow(minute, 5)