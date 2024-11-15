#!/usr/bin/env node

import {writeFileSync} from 'fs';
import pkg from './package.json' with { type: 'json' };

/* TypeScript output file, where the version will be written. */
const Output = './src/version.ts';
const version = pkg.version;

/* Matches regexp of the form: major.minor.patch[-rc.tag] */
const matches = version.match(/([0-9]+).([0-9]+).([0-9]+)(?:-rc.([0-9]+))?/);
if (!matches || matches.length < 4) {
    console.error(`Invalid version '${input}'. Expected: major.minor.patch[-rc.x]`);
    process.exit(1);
}

const result = {
    major: Number.parseInt(matches[1]),
    minor: Number.parseInt(matches[2]),
    patch: Number.parseInt(matches[3]),
    rc: matches[4] !== undefined ? Number.parseInt(matches[4]) : 0
};

writeFileSync(Output,`/**
 * This file is automatically generated.
 *
 * **Do not** modify this file directly, but instead update
 * the 'write-version.mjs' script.
 */

/**
 * Version type following a subset of the Semantic Versioning specification.
 */
export type Version = {major: number, minor: number, patch: number, rc: number};

/** Version of this API. */
export const APIVersion: Version = {
    major: ${result.major},
    minor: ${result.minor},
    patch: ${result.patch},
    rc: ${result.rc}
};
`);

console.log(`[BUILD]: '${Output}' file overwritten\n`);
