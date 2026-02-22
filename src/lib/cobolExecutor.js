/**
 * COBOL Program Executor
 * Secure execution of COBOL programs with validation and sandboxing
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

// Whitelist of allowed COBOL programs
const ALLOWED_PROGRAMS = new Set([
    'main',
    'credit_decision',
    'business_rule',
    'calculation'
]);

// Maximum execution timeout (milliseconds)
const EXECUTION_TIMEOUT = 30000;

class CobolExecutor {
    constructor() {
        this.binDir = path.join(__dirname, '../../bin');
        this.srcDir = path.join(__dirname, '../cobol');
    }

    /**
     * Validate program name against whitelist
     */
    validateProgram(programName) {
        if (!ALLOWED_PROGRAMS.has(programName)) {
            throw new Error(`Program '${programName}' is not in the allowed list`);
        }
    }

    /**
     * Sanitize environment variables
     */
    sanitizeInputs(inputs) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(inputs)) {
            // Only allow alphanumeric keys
            if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
                logger.warn({ key }, 'Invalid environment variable name');
                continue;
            }

            // Convert value to string and limit length
            const stringValue = String(value).substring(0, 1000);
            sanitized[key] = stringValue;
        }

        return sanitized;
    }

    /**
     * Execute a COBOL program
     * @param {string} programName - Name of the program to execute
     * @param {object} inputs - Environment variables to pass
     * @returns {Promise<object>} - Execution result
     */
    async execute(programName, inputs = {}) {
        this.validateProgram(programName);

        const executablePath = path.join(this.binDir, programName);

        // Check if executable exists
        try {
            await fs.access(executablePath, fs.constants.X_OK);
        } catch (error) {
            throw new Error(`Program '${programName}' not compiled or not executable`);
        }

        // Sanitize inputs
        const sanitizedInputs = this.sanitizeInputs(inputs);

        // Prepare environment
        const env = {
            ...process.env,
            ...sanitizedInputs,
            // Restrict environment
            PATH: '/usr/local/bin:/usr/bin:/bin',
            HOME: '/tmp'
        };

        logger.info({ program: programName, inputs: Object.keys(sanitizedInputs) }, 'Executing COBOL program');

        return new Promise((resolve, reject) => {
            const child = spawn(executablePath, [], {
                env,
                timeout: EXECUTION_TIMEOUT,
                cwd: this.binDir
            });

            let stdout = '';
            let stderr = '';
            let timedOut = false;

            const timeout = setTimeout(() => {
                timedOut = true;
                child.kill('SIGTERM');
                setTimeout(() => child.kill('SIGKILL'), 1000);
            }, EXECUTION_TIMEOUT);

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                clearTimeout(timeout);

                if (timedOut) {
                    logger.error({ program: programName }, 'COBOL execution timed out');
                    reject(new Error('Execution timed out'));
                    return;
                }

                logger.info({ program: programName, exitCode: code }, 'COBOL program completed');

                resolve({
                    exitCode: code,
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                });
            });

            child.on('error', (error) => {
                clearTimeout(timeout);
                logger.error({ err: error, program: programName }, 'COBOL execution error');
                reject(error);
            });
        });
    }

    /**
     * Load COBOL source code
     * @param {string} fileName - Name of the source file
     * @returns {Promise<string>} - Source code content
     */
    async loadSource(fileName) {
        // Prevent directory traversal
        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
            throw new Error('Invalid file name');
        }

        const filePath = path.join(this.srcDir, fileName);

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return content;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Source file '${fileName}' not found`);
            }
            throw error;
        }
    }

    /**
     * Get list of available programs
     */
    getAvailablePrograms() {
        return Array.from(ALLOWED_PROGRAMS);
    }
}

module.exports = new CobolExecutor();
