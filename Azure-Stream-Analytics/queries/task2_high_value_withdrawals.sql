SELECT
    area,
    COUNT(*) AS highValueWithdrawalCount,
    System.Timestamp() AS windowEnd
INTO
    task2Output
FROM
    atmInput TIMESTAMP BY eventTime
WHERE
    transactionType = 'withdrawal'
    AND amount >= 200
GROUP BY
    area,
    HoppingWindow(minute, 10, 1)