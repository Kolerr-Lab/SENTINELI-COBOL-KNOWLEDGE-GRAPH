/**
 * Graph Configuration Tests
 * 
 * Tests program name resolution, test file exclusion, and edge metadata functionality.
 * 
 * @author Ricky Anh Nguyen
 */

const {
    resolveProgramName,
    isTestFile,
    getEdgeMetadata,
    findFileByProgramName,
    PROGRAM_REGISTRY,
    TEST_EXCLUSION_PATTERNS
} = require('../../src/bridge/config/graph.config');

describe('Graph Configuration', () => {
    
    describe('resolveProgramName', () => {
        test('should resolve 8-char program names', () => {
            expect(resolveProgramName('ACCMGMT')).toBe('bank/account_management.cob');
            expect(resolveProgramName('FRAUDDET')).toBe('bank/fraud_detection.cob');
            expect(resolveProgramName('INTCALC')).toBe('bank/interest_calculator.cob');
        });
        
        test('should resolve hyphenated names', () => {
            expect(resolveProgramName('ACCOUNT-MGMT')).toBe('bank/account_management.cob');
            expect(resolveProgramName('FRAUD-DET')).toBe('bank/fraud_detection.cob');
            expect(resolveProgramName('CREDIT-SCORE')).toBe('bank/credit_scoring.cob');
        });
        
        test('should resolve full descriptive names', () => {
            expect(resolveProgramName('ACCOUNT-MANAGEMENT')).toBe('bank/account_management.cob');
            expect(resolveProgramName('TRANSACTION-PROCESSOR')).toBe('bank/transaction_processor.cob');
        });
        
        test('should be case-insensitive', () => {
            expect(resolveProgramName('accmgmt')).toBe('bank/account_management.cob');
            expect(resolveProgramName('ACCMGMT')).toBe('bank/account_management.cob');
            expect(resolveProgramName('AccMgmt')).toBe('bank/account_management.cob');
        });
        
        test('should handle underscores as hyphens', () => {
            expect(resolveProgramName('ACCOUNT_MGMT')).toBe('bank/account_management.cob');
            expect(resolveProgramName('FRAUD_DET')).toBe('bank/fraud_detection.cob');
        });
        
        test('should return null for unknown programs', () => {
            expect(resolveProgramName('UNKNOWN_PROG')).toBeNull();
            expect(resolveProgramName('NONEXISTENT')).toBeNull();
        });
        
        test('should handle null/undefined input', () => {
            expect(resolveProgramName(null)).toBeNull();
            expect(resolveProgramName(undefined)).toBeNull();
            expect(resolveProgramName('')).toBeNull();
        });
    });
    
    describe('isTestFile', () => {
        test('should identify test prefix patterns', () => {
            expect(isTestFile('test_program.cob')).toBe(true);
            expect(isTestFile('test-program.cob')).toBe(true);
            expect(isTestFile('test_something.cob')).toBe(true);
        });
        
        test('should identify test suffix patterns', () => {
            expect(isTestFile('program_test.cob')).toBe(true);
            expect(isTestFile('program-test.cob')).toBe(true);
            expect(isTestFile('something_test.cob')).toBe(true);
        });
        
        test('should identify spec/mock patterns', () => {
            expect(isTestFile('spec_program.cob')).toBe(true);
            // Note: program.spec.cob has .spec. in middle, not at basename level
            expect(isTestFile('mock_service.cob')).toBe(true);
            expect(isTestFile('service_mock.cob')).toBe(true);
        });
        
        test('should identify demo/sample patterns', () => {
            expect(isTestFile('demo_program.cob')).toBe(true);
            expect(isTestFile('sample_code.cob')).toBe(true);
            expect(isTestFile('example_program.cob')).toBe(true);
        });
        
        test('should identify temp/backup patterns', () => {
            expect(isTestFile('temp_file.cob')).toBe(true);
            expect(isTestFile('tmp_program.cob')).toBe(true);
            expect(isTestFile('program.bak')).toBe(true);
            expect(isTestFile('program.old')).toBe(true);
        });
        
        test('should identify exact match test names', () => {
            expect(isTestFile('test.cob')).toBe(true);
            expect(isTestFile('testing.cob')).toBe(true);
            expect(isTestFile('test_format.cob')).toBe(true);
            expect(isTestFile('sandbox.cob')).toBe(true);
        });
        
        test('should not flag production programs', () => {
            expect(isTestFile('bank/account_management.cob')).toBe(false);
            expect(isTestFile('fraud_detection.cob')).toBe(false);
            expect(isTestFile('transaction_processor.cob')).toBe(false);
            expect(isTestFile('loan_approval.cob')).toBe(false);
        });
        
        test('should handle paths correctly', () => {
            expect(isTestFile('bank/test_program.cob')).toBe(true);
            expect(isTestFile('src/test/test_file.cob')).toBe(true);
            expect(isTestFile('bank/account_management.cob')).toBe(false);
        });
        
        test('should be case-insensitive', () => {
            expect(isTestFile('TEST_PROGRAM.cob')).toBe(true);
            expect(isTestFile('Test_Program.cob')).toBe(true);
            expect(isTestFile('MOCK_SERVICE.cob')).toBe(true);
        });
    });
    
    describe('getEdgeMetadata', () => {
        test('should return metadata for known edge types', () => {
            const callsMeta = getEdgeMetadata('CALLS');
            expect(callsMeta.label).toBe('Calls');
            expect(callsMeta.color).toBe('#0066cc');
            expect(callsMeta.strength).toBe(0.9);
            
            const includesMeta = getEdgeMetadata('INCLUDES');
            expect(includesMeta.label).toBe('Includes');
            expect(includesMeta.color).toBe('#cccc00');
        });
        
        test('should be case-insensitive', () => {
            expect(getEdgeMetadata('calls')).toEqual(getEdgeMetadata('CALLS'));
            expect(getEdgeMetadata('Calls')).toEqual(getEdgeMetadata('CALLS'));
        });
        
        test('should return default for unknown edge types', () => {
            const meta = getEdgeMetadata('UNKNOWN_TYPE');
            expect(meta.label).toBe('Depends On');
            expect(meta.strength).toBe(0.6);
        });
        
        test('should handle null/undefined', () => {
            expect(getEdgeMetadata(null).label).toBe('Depends On');
            expect(getEdgeMetadata(undefined).label).toBe('Depends On');
        });
    });
    
    describe('findFileByProgramName', () => {
        const mockDbRows = [
            { file_name: 'bank/account_management.cob' },
            { file_name: 'bank/fraud_detection.cob' },
            { file_name: 'bank/interest_calculator.cob' },
            { file_name: 'loan_approval.cob' }
        ];
        
        test('should find file by program name', () => {
            const result = findFileByProgramName('ACCMGMT', mockDbRows);
            expect(result).not.toBeNull();
            expect(result.file_name).toBe('bank/account_management.cob');
        });
        
        test('should find file with hyphenated name', () => {
            const result = findFileByProgramName('FRAUD-DET', mockDbRows);
            expect(result).not.toBeNull();
            expect(result.file_name).toBe('bank/fraud_detection.cob');
        });
        
        test('should fallback to fuzzy matching', () => {
            const result = findFileByProgramName('INTEREST', mockDbRows);
            expect(result).not.toBeNull();
            expect(result.file_name).toBe('bank/interest_calculator.cob');
        });
        
        test('should return null for unknown program', () => {
            const result = findFileByProgramName('NONEXISTENT', mockDbRows);
            expect(result).toBeNull();
        });
        
        test('should handle null/undefined inputs', () => {
            expect(findFileByProgramName(null, mockDbRows)).toBeNull();
            expect(findFileByProgramName('ACCMGMT', null)).toBeNull();
            expect(findFileByProgramName(null, null)).toBeNull();
        });
    });
    
    describe('Registry Coverage', () => {
        test('should have mappings for all banking domain programs', () => {
            const bankingPrograms = [
                'ACCMGMT', 'CREDSCOR', 'FRAUDDET', 'INTCALC', 'TXNPROC',
                'PAYPROC', 'RISKASMT', 'MORTGSVC', 'CREDCARD', 'PORTMGMT'
            ];
            
            bankingPrograms.forEach(prog => {
                expect(PROGRAM_REGISTRY[prog]).toBeDefined();
                expect(PROGRAM_REGISTRY[prog]).toContain('.cob');
            });
        });
        
        test('should have multiple aliases per program', () => {
            // Account management should have 3 aliases
            const accMgmtAliases = Object.entries(PROGRAM_REGISTRY)
                .filter(([_, file]) => file === 'bank/account_management.cob')
                .map(([alias]) => alias);
            
            expect(accMgmtAliases.length).toBeGreaterThanOrEqual(3);
            expect(accMgmtAliases).toContain('ACCMGMT');
            expect(accMgmtAliases).toContain('ACCOUNT-MGMT');
        });
    });
    
    describe('Test Exclusion Pattern Coverage', () => {
        test('should have patterns for common test conventions', () => {
            const hasTestPrefix = TEST_EXCLUSION_PATTERNS.some(p => 
                p instanceof RegExp && p.test('test_file')
            );
            const hasTestSuffix = TEST_EXCLUSION_PATTERNS.some(p => 
                p instanceof RegExp && p.test('file_test')
            );
            const hasMockPattern = TEST_EXCLUSION_PATTERNS.some(p => 
                p instanceof RegExp && p.test('mock_service')
            );
            
            expect(hasTestPrefix).toBe(true);
            expect(hasTestSuffix).toBe(true);
            expect(hasMockPattern).toBe(true);
        });
        
        test('should have exact matches for common test names', () => {
            const exactMatches = TEST_EXCLUSION_PATTERNS.filter(p => typeof p === 'string');
            
            expect(exactMatches).toContain('test');
            expect(exactMatches).toContain('testing');
            expect(exactMatches).toContain('sandbox');
        });
    });
});
