-- Migration: Update database schema for persistent metrics tracking
-- Date: 2026-02-26
-- Purpose: Store each analysis separately and calculate metrics from DB

-- Drop and recreate knowledge_graph table to store all analyses (not overwrite)
DROP TABLE IF EXISTS knowledge_graph CASCADE;

CREATE TABLE knowledge_graph (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    analysis JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Extracted fields for faster queries
    cyclomatic_complexity INTEGER,
    logic_depth INTEGER,
    variable_count INTEGER,
    decision_points INTEGER,
    cost_usd DECIMAL(10, 8),
    tokens_used INTEGER,
    duration_ms INTEGER,
    ai_model VARCHAR(100)
);

-- Create indexes for fast metrics queries
CREATE INDEX idx_created_at ON knowledge_graph(created_at);
CREATE INDEX idx_file_name ON knowledge_graph(file_name);
CREATE INDEX idx_file_type ON knowledge_graph(file_type);

-- Create view for realtime metrics calculation
CREATE OR REPLACE VIEW metrics_realtime AS
SELECT
    COUNT(*) as total_calls,
    COALESCE(SUM(duration_ms), 0) as total_processing_time_ms,
    COALESCE(AVG(duration_ms), 0) as average_processing_time_ms,
    COALESCE(SUM(tokens_used), 0) as total_tokens,
    COALESCE(SUM(cost_usd), 0) as total_cost_usd,
    COALESCE(AVG(cost_usd), 0) as average_cost_per_call,
    COALESCE(SUM(cyclomatic_complexity), 0) as total_cyclomatic_complexity,
    COALESCE(AVG(cyclomatic_complexity), 0) as average_cyclomatic_complexity,
    COALESCE(AVG(logic_depth), 0) as average_logic_depth,
    COALESCE(AVG(variable_count), 0) as average_variable_count,
    COALESCE(AVG(decision_points), 0) as average_decision_points,
    MIN(created_at) as first_analysis,
    MAX(created_at) as last_analysis
FROM knowledge_graph;

COMMENT ON TABLE knowledge_graph IS 'Stores all analysis results with full schema - never overwrites';
COMMENT ON VIEW metrics_realtime IS 'Real-time calculated metrics from all analyses in DB';
