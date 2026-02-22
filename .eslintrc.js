module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: [
        'airbnb-base',
        'plugin:security/recommended',
        'plugin:jest/recommended',
        'prettier'
    ],
    plugins: ['security', 'jest'],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    rules: {
        // Relax some strict rules for pragmatic development
        'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'consistent-return': 'off',
        'no-plusplus': 'off',
        'no-await-in-loop': 'off',
        'no-restricted-syntax': 'off',
        'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.test.js', '**/*.spec.js', 'scripts/**'] }],
        
        // Security
        'security/detect-object-injection': 'warn',
        'security/detect-non-literal-fs-filename': 'warn',
        
        // Jest
        'jest/expect-expect': 'warn',
        'jest/no-disabled-tests': 'warn'
    }
};
