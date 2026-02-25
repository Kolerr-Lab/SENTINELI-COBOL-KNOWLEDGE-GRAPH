/**
 * Multi-Language Mainframe Analyzer Router
 * Routes analysis requests to appropriate language-specific analyzers
 */

const cobolAnalyzer = require('./cobol_analyzer');
const jclAnalyzer = require('./jcl_analyzer');
const db2Analyzer = require('./db2_analyzer');
const vsamAnalyzer = require('./vsam_analyzer');
const cicsAnalyzer = require('./cics_analyzer');
const copybookAnalyzer = require('./copybook_analyzer');

const FILE_TYPE_MAPPING = {
  'COBOL': cobolAnalyzer,
  'JCL': jclAnalyzer,
  'DB2': db2Analyzer,
  'VSAM': vsamAnalyzer,
  'CICS': cicsAnalyzer,
  'COPYBOOK': copybookAnalyzer
};

/**
 * Analyze source code based on file type
 * @param {string} code - Source code to analyze
 * @param {string} fileType - Type of file (COBOL, JCL, DB2, etc.)
 * @param {string} program - Program name
 * @param {object} options - Additional options (openai client, logger, etc.)
 * @returns {Promise<object>} - Standardized analysis result
 */
async function analyzeByType(code, fileType, program, options = {}) {
  const analyzer = FILE_TYPE_MAPPING[fileType];
  
  if (!analyzer) {
    throw new Error(`Unsupported file type: ${fileType}. Supported types: ${Object.keys(FILE_TYPE_MAPPING).join(', ')}`);
  }

  const startTime = Date.now();
  
  try {
    // All analyzers must return the same schema:
    // {
    //   fileType: string,
    //   propagator_network: object,
    //   decision_tree: object,
    //   business_rules: array,
    //   complexity_metrics: object,
    //   dependencies: array,
    //   metadata: object
    // }
    const result = await analyzer.analyze(code, program, options);
    
    const duration = Date.now() - startTime;
    
    return {
      ...result,
      fileType: fileType,
      metadata: {
        ...result.metadata,
        duration_ms: duration,
        analyzer_version: '1.0.0'
      }
    };
  } catch (error) {
    throw new Error(`${fileType} analysis failed: ${error.message}`);
  }
}

/**
 * Auto-detect file type from filename extension
 * @param {string} filename - Filename with extension
 * @returns {string} - Detected file type or 'COBOL' as default
 */
function detectFileType(filename) {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  
  const extensionMap = {
    '.cbl': 'COBOL',
    '.cob': 'COBOL',
    '.cobol': 'COBOL',
    '.jcl': 'JCL',
    '.db2': 'DB2',
    '.sql': 'DB2',
    '.vsam': 'VSAM',
    '.cics': 'CICS',
    '.cpy': 'COPYBOOK',
    '.copy': 'COPYBOOK'
  };
  
  return extensionMap[ext] || 'COBOL';
}

module.exports = {
  analyzeByType,
  detectFileType,
  supportedTypes: Object.keys(FILE_TYPE_MAPPING)
};
