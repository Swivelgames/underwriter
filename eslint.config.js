import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import globals from "globals";

const compat = new FlatCompat({
	baseDirectory: import.meta.dirname,
	recommendedConfig: js.configs.recommended,
});

export default [
	...compat.extends("airbnb"),
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: {
				...globals["shared-node-browser"],
				...globals.es2020,
				...globals.browser,
				...globals.node,
				...globals.mocha,
			},
		},
		rules: {
			indent: [2, "tab", { SwitchCase: 1, VariableDeclarator: 1 }],
			quotes: ["error", "double"],
			"no-tabs": 0,
			"no-void": 0,
			"no-console": 0,
			"no-underscore-dangle": 0,
			"comma-dangle": 0,
			"import/no-dynamic-require": 0,
			"import/extensions": 0,
			"function-paren-newline": 0,
			"global-require": 0,
			"prefer-destructuring": ["error", { AssignmentExpression: { array: false, object: false } }],
			"max-len": ["error", { ignoreComments: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
		},
		settings: {
			"import/core-modules": ["sinon"],
		},
	},
];
