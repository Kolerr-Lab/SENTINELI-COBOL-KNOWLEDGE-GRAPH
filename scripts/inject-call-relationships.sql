-- Inject CALL relationships (simulating GPT-4o extraction)
-- This demonstrates Phase 2: Realistic banking CALL patterns

-- Update transaction_processor with its 3 CALLs
UPDATE knowledge_graph 
SET latest_analysis = jsonb_set(
  jsonb_set(latest_analysis, '{dependencies}', COALESCE(latest_analysis->'dependencies', '{}'::jsonb)),
  '{dependencies,called_programs}',
  '["FRAUD-DETECTION", "PAYMENT-PROCESSING", "ACCOUNT-MANAGEMENT"]'::jsonb
)
WHERE file_name = 'TRANSACTION-PROCESSOR';

-- Update loan_approval with its 3 CALLs
UPDATE knowledge_graph 
SET latest_analysis = jsonb_set(
  jsonb_set(latest_analysis, '{dependencies}', COALESCE(latest_analysis->'dependencies', '{}'::jsonb)),
  '{dependencies,called_programs}',
  '["INTEREST-CALCULATOR", "CREDIT-SCORING", "RISK-ASSESSMENT"]'::jsonb
)
WHERE file_name = 'loan_approval.cob';

-- Update fraud_detection with its 1 CALL
UPDATE knowledge_graph 
SET latest_analysis = jsonb_set(
  jsonb_set(latest_analysis, '{dependencies}', COALESCE(latest_analysis->'dependencies', '{}'::jsonb)),
  '{dependencies,called_programs}',
  '["RISK-ASSESSMENT"]'::jsonb
)
WHERE file_name = 'bank/fraud_detection.cob';

-- Verify
SELECT file_name, latest_analysis->'dependencies'->'called_programs' as called_programs
FROM knowledge_graph 
WHERE latest_analysis->'dependencies'->'called_programs' IS NOT NULL 
AND jsonb_array_length(latest_analysis->'dependencies'->'called_programs') > 0
ORDER BY file_name;
