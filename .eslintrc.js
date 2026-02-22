module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true,
        commonjs: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'commonjs'
    },
    rules: {
        // Relax for tests and scripts
        'no-console': 'off',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-undef': 'error'
    },
    ignorePatterns: [
        'node_modules/',
        'coverage/',
        'dist/',
        'bin/',
        '*.min.js'
    ]
};
