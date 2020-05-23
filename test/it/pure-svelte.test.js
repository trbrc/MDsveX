import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { readdirSync, readFileSync, existsSync, lstatSync } from 'fs';
import { join, extname } from 'path';

import { transform } from '../../src';

const PATH = join(__dirname, '../_fixtures/svelte');

const is_win = process.platform === 'win32';
const is_dir = path => existsSync(path) && lstatSync(path).isDirectory();

const get_dir_path = d => {
	const out = readdirSync(d);
	return out.map(f => {
		const p = join(d, f);
		if (is_dir(p)) return get_dir_path(p);
		else return p;
	});
};

const flatten = arr =>
	arr.reduce(
		(acc, next) => acc.concat(Array.isArray(next) ? flatten(next) : next),
		[]
	);

const svelte = suite('pure-svelte');

let svelte_files;
try {
	svelte_files = flatten(get_dir_path(PATH))
		.filter(f => extname(f) === '.svelte')
		.map(f => [f, readFileSync(f, { encoding: 'utf8' })]);
} catch (e) {
	throw new Error(e);
}

svelte_files.forEach(([path, file], i) => {
	svelte(
		`it should correctly parse any svelte component: ${path.replace(
			join(__dirname, '../_fixtures/svelte/'),
			''
		)}`,
		async () => {
			let output;

			try {
				output = await transform().process(file);
			} catch (e) {
				console.log(i, e);
			}

			const input = is_win
				? file.replace(/\r\n\r\n/g, '\n').trim()
				: file.replace(/\n\n/g, '\n').trim();
			const expected = is_win
				? output.contents.replace(/\r\n\r\n/g, '\n').trim()
				: output.contents.replace(/\n\n/g, '\n').trim();

			assert.fixture(input, expected);
		}
	);
});

svelte.run();
