-- users 1000..1099 × priorities 1..5 = 500 rows

INSERT INTO project_apply
(priority, position, comment, semester, user_id, project_id)
SELECT
    p.pv                                                   AS priority,
    CASE (u.n % 8)
        WHEN 0 THEN 'FRONTEND'
        WHEN 1 THEN 'BACKEND'
        WHEN 2 THEN 'AI'
        WHEN 3 THEN 'DESIGN'
        WHEN 4 THEN 'ANDROID'
        WHEN 5 THEN 'IOS'
        WHEN 6 THEN 'PM'
        ELSE      'GAME'
        END                                                    AS position,
  CONCAT('auto apply user ', 1000 + u.n, ' priority ', p.pv) AS comment,
  '2025-02'                                               AS semester,
  1000 + u.n                                             AS user_id,
  ((u.n * 5 + p.pv - 1) % 15) + 1                        AS project_id
FROM
    -- 0..99 생성: 10×10 크로스조인 트릭
    (SELECT t.n*10 + o.n AS n
    FROM (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) t
    CROSS JOIN
    (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) o
    ) u
    CROSS JOIN
    (SELECT 1 pv UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) p;