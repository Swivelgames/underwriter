import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const config = {
	input: 'src/index.js',
	output: [
		{ format: 'esm', file: 'lib/index.mjs', },
		{ format: 'cjs', file: 'lib/index.cjs', },
	],
	plugins: [
		babel({ babelHelpers: 'bundled' }),
		terser(),
	],
};

export default config;
