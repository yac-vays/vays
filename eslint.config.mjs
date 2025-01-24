// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
const pluginSecurity = require('eslint-plugin-security');

export default tseslint.config(
  eslint.configs.recommended,
  //   tseslint.configs.recommended,
  tseslint.configs.strict,
  pluginSecurity.configs.recommended
);
