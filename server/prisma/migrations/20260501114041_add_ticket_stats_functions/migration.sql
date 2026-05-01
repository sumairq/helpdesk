CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS TABLE (
  total_tickets     INT,
  open_tickets      INT,
  ai_resolved       INT,
  ai_resolved_pct   INT,
  avg_resolution_ms FLOAT8
) LANGUAGE plpgsql AS $$
DECLARE
  v_total       INT;
  v_open        INT;
  v_ai_resolved INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_total FROM "Ticket";
  SELECT COUNT(*)::INT INTO v_open  FROM "Ticket" WHERE status = 'open';
  SELECT COUNT(*)::INT INTO v_ai_resolved
  FROM "Ticket" t
  WHERE t.status = 'resolved'
    AND EXISTS (
      SELECT 1 FROM "TicketReply" r
      WHERE r."ticketId" = t.id
        AND r."senderType" = 'agent'
        AND r."authorId"  IS NULL
    );

  RETURN QUERY
  SELECT
    v_total,
    v_open,
    v_ai_resolved,
    CASE WHEN v_total > 0
      THEN ROUND((v_ai_resolved::NUMERIC / v_total::NUMERIC) * 100)::INT
      ELSE 0
    END,
    (SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) * 1000)
     FROM "Ticket" WHERE status = 'resolved')::FLOAT8;
END;
$$;

CREATE OR REPLACE FUNCTION get_daily_ticket_counts()
RETURNS TABLE (date TEXT, count INT) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
    COUNT(*)::INT
  FROM "Ticket"
  WHERE "createdAt" >= NOW() - INTERVAL '30 days'
  GROUP BY 1
  ORDER BY 1 ASC;
END;
$$;
