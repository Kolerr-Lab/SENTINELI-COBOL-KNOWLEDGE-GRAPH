/**
 * Knowledge Graph Configuration
 * 
 * Defines program name mappings, test exclusion patterns, and edge type definitions.
 * This configuration enables robust program name resolution and graph filtering.
 * 
 * @author Ricky Anh Nguyen <ricky@orchesity.com>
 * @copyright 2026 OrchesityAI & Kolerr Lab
 */

/**
 * Program Name to File Name Mapping Registry
 * 
 * Maps COBOL CALL/INVOKE program names to actual file names.
 * Supports common mainframe naming conventions:
 * - 8-char limit (ACCMGMT)
 * - Hyphenated names (ACCOUNT-MANAGEMENT)
 * - Full descriptive names
 */
const PROGRAM_REGISTRY = {
    // Banking Domain
    'ACCMGMT': 'bank/account_management.cob',
    'ACCOUNT-MGMT': 'bank/account_management.cob',
    'ACCOUNT-MANAGEMENT': 'bank/account_management.cob',
    
    'CREDSCOR': 'bank/credit_scoring.cob',
    'CREDIT-SCORE': 'bank/credit_scoring.cob',
    'CREDIT-SCORING': 'bank/credit_scoring.cob',
    
    'FRAUDDET': 'bank/fraud_detection.cob',
    'FRAUD-DET': 'bank/fraud_detection.cob',
    'FRAUD-DETECTION': 'bank/fraud_detection.cob',
    
    'INTCALC': 'bank/interest_calculator.cob',
    'INT-CALC': 'bank/interest_calculator.cob',
    'INTEREST-CALC': 'bank/interest_calculator.cob',
    'INTEREST-CALCULATOR': 'bank/interest_calculator.cob',
    
    'TXNPROC': 'bank/transaction_processor.cob',
    'TXN-PROC': 'bank/transaction_processor.cob',
    'TRANSACTION-PROC': 'bank/transaction_processor.cob',
    'TRANSACTION-PROCESSOR': 'bank/transaction_processor.cob',
    
    'PAYPROC': 'bank/payment_processing.cob',
    'PAY-PROC': 'bank/payment_processing.cob',
    'PAYMENT-PROC': 'bank/payment_processing.cob',
    'PAYMENT-PROCESSING': 'bank/payment_processing.cob',
    
    'RISKASMT': 'bank/risk_assessment.cob',
    'RISK-ASMT': 'bank/risk_assessment.cob',
    'RISK-ASSESSMENT': 'bank/risk_assessment.cob',
    
    'MORTGSVC': 'bank/mortgage_servicing.cob',
    'MORTG-SVC': 'bank/mortgage_servicing.cob',
    'MORTGAGE-SVC': 'bank/mortgage_servicing.cob',
    'MORTGAGE-SERVICING': 'bank/mortgage_servicing.cob',
    
    'CREDCARD': 'bank/credit_card_processing.cob',
    'CRED-CARD': 'bank/credit_card_processing.cob',
    'CREDIT-CARD': 'bank/credit_card_processing.cob',
    'CREDIT-CARD-PROC': 'bank/credit_card_processing.cob',
    
    'PORTMGMT': 'bank/portfolio_management.cob',
    'PORT-MGMT': 'bank/portfolio_management.cob',
    'PORTFOLIO-MGMT': 'bank/portfolio_management.cob',
    'PORTFOLIO-MANAGEMENT': 'bank/portfolio_management.cob',
    
    'COMPLRPT': 'bank/compliance_reporting.cob',
    'COMPL-RPT': 'bank/compliance_reporting.cob',
    'COMPLIANCE-RPT': 'bank/compliance_reporting.cob',
    'COMPLIANCE-REPORTING': 'bank/compliance_reporting.cob',
    
    // Main Programs
    'LOANAPPR': 'loan_approval.cob',
    'LOAN-APPR': 'loan_approval.cob',
    'LOAN-APPROVAL': 'loan_approval.cob',
    
    'MAINPROG': 'main.cob',
    'MAIN': 'main.cob'
};

/**
 * Test Program Exclusion Patterns
 * 
 * Programs matching these patterns are excluded from production knowledge graphs.
 * Supports regex patterns and exact matches.
 */
const TEST_EXCLUSION_PATTERNS = [
    // Test prefix/suffix patterns
    /^test[_-]/i,              // test_*, test-*
    /[_-]test$/i,              // *_test, *-test
    /[_-]test[_-]/i,           // *_test_*, *-test-*
    
    // Spec/Mock patterns
    /^spec[_-]/i,              // spec_*, spec-*
    /\.spec\./i,               // *.spec.*
    /^mock[_-]/i,              // mock_*, mock-*
    /[_-]mock$/i,              // *_mock, *-mock
    
    // Demo/Sample patterns
    /^demo[_-]/i,              // demo_*, demo-*
    /^sample[_-]/i,            // sample_*, sample-*
    /^example[_-]/i,           // example_*, example-*
    
    // Temporary/Scratch patterns
    /^temp[_-]/i,              // temp_*, temp-*
    /^tmp[_-]/i,               // tmp_*, tmp-*
    /^scratch[_-]/i,           // scratch_*, scratch-*
    
    // Backup patterns
    /\.bak$/i,                 // *.bak
    /\.old$/i,                 // *.old
    /\.backup$/i,              // *.backup
    
    // Exact matches for common test programs
    'test',
    'testing',
    'test_format',
    'test_no_sql',
    'test_program',
    'sandbox'
];

/**
 * Edge Type Definitions
 * 
 * Defines all supported edge types with metadata for visualization and analysis.
 */
const EDGE_TYPES = {
    // Program-to-Program
    CALLS: {
        label: 'Calls',
        color: '#0066cc',
        strength: 0.9,
        description: 'COBOL CALL statement'
    },
    INVOKES: {
        label: 'Invokes',
        color: '#00cccc',
        strength: 0.85,
        description: 'CICS transaction invocation'
    },
    EXECUTES: {
        label: 'Executes',
        color: '#00cc66',
        strength: 0.95,
        description: 'JCL EXEC PGM'
    },
    
    // Data Dependencies
    INCLUDES: {
        label: 'Includes',
        color: '#cccc00',
        strength: 0.7,
        description: 'COPY/INCLUDE copybook'
    },
    QUERIES: {
        label: 'Queries',
        color: '#cc00cc',
        strength: 0.8,
        description: 'SQL SELECT statement'
    },
    READS: {
        label: 'Reads',
        color: '#ff9900',
        strength: 0.75,
        description: 'File/VSAM READ'
    },
    WRITES: {
        label: 'Writes',
        color: '#ff0000',
        strength: 0.85,
        description: 'File/Database WRITE'
    },
    
    // Workflow
    TRIGGERS: {
        label: 'Triggers',
        color: '#9900cc',
        strength: 0.65,
        description: 'Workflow/Event trigger'
    },
    DEPENDS_ON: {
        label: 'Depends On',
        color: '#666666',
        strength: 0.6,
        description: 'Generic dependency'
    }
};

/**
 * Resolve program name to file name
 * 
 * @param {string} programName - Program name from CALL statement (e.g., 'ACCMGMT', 'FRAUD-DET')
 * @returns {string|null} - Resolved file name or null if not found
 */
function resolveProgramName(programName) {
    if (!programName) return null;
    
    // Normalize: uppercase and trim
    const normalized = programName.toUpperCase().trim();
    
    // Direct lookup in registry
    if (PROGRAM_REGISTRY[normalized]) {
        return PROGRAM_REGISTRY[normalized];
    }
    
    // Try without hyphens (ACCOUNT-MGMT -> ACCOUNTMGMT)
    const noHyphens = normalized.replace(/-/g, '');
    if (PROGRAM_REGISTRY[noHyphens]) {
        return PROGRAM_REGISTRY[noHyphens];
    }
    
    // Try with hyphens instead of underscores
    const withHyphens = normalized.replace(/_/g, '-');
    if (PROGRAM_REGISTRY[withHyphens]) {
        return PROGRAM_REGISTRY[withHyphens];
    }
    
    return null;
}

/**
 * Check if a file name matches test exclusion patterns
 * 
 * @param {string} fileName - File name to check (e.g., 'test_program.cob', 'bank/account_mgmt.cob')
 * @returns {boolean} - True if file should be excluded from graph
 */
function isTestFile(fileName) {
    if (!fileName) return false;
    
    // Extract base name without path and extension
    const baseName = fileName.split('/').pop().replace(/\.(cob|cbl|jcl|cpy)$/i, '');
    
    // Check exact matches first (case-insensitive)
    const exactMatches = TEST_EXCLUSION_PATTERNS.filter(p => typeof p === 'string');
    if (exactMatches.some(pattern => baseName.toLowerCase() === pattern.toLowerCase())) {
        return true;
    }
    
    // Check regex patterns
    const regexPatterns = TEST_EXCLUSION_PATTERNS.filter(p => p instanceof RegExp);
    if (regexPatterns.some(pattern => pattern.test(baseName))) {
        return true;
    }
    
    return false;
}

/**
 * Get edge type metadata
 * 
 * @param {string} edgeType - Edge type identifier (e.g., 'CALLS', 'INCLUDES')
 * @returns {Object} - Edge metadata with label, color, strength, description
 */
function getEdgeMetadata(edgeType) {
    const normalized = edgeType ? edgeType.toUpperCase() : 'DEPENDS_ON';
    return EDGE_TYPES[normalized] || EDGE_TYPES.DEPENDS_ON;
}

/**
 * Find file in database by program name
 * 
 * @param {string} programName - Program name to search for
 * @param {Array} dbRows - Database rows from knowledge_graph table
 * @returns {Object|null} - Matching row or null
 */
function findFileByProgramName(programName, dbRows) {
    if (!programName || !dbRows) return null;
    
    // Try direct resolution first
    const resolvedFile = resolveProgramName(programName);
    if (resolvedFile) {
        const match = dbRows.find(row => 
            row.file_name === resolvedFile || 
            row.file_name.endsWith('/' + resolvedFile)
        );
        if (match) return match;
    }
    
    // Fallback to fuzzy matching (case-insensitive contains)
    const normalized = programName.toUpperCase();
    return dbRows.find(row => 
        row.file_name.toUpperCase().includes(normalized)
    ) || null;
}

module.exports = {
    PROGRAM_REGISTRY,
    TEST_EXCLUSION_PATTERNS,
    EDGE_TYPES,
    resolveProgramName,
    isTestFile,
    getEdgeMetadata,
    findFileByProgramName
};
