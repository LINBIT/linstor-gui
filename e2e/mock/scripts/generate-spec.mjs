// SPDX-License-Identifier: GPL-3.0
//
// Convert linstor-server's rest_v1_openapi.yaml into a JSON file the mock
// loads at startup. Run this whenever the upstream spec changes.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// The same LINSTOR spec the GUI's typed client is generated from
// (npm run generate-api:linstor), so the mock and the client agree.
const DEFAULT_SOURCE = path.resolve(ROOT, '../../src/app/apis/Linstor-Linstor-1.30.0.yaml');
const TARGET = path.resolve(ROOT, 'spec/rest_v1_openapi.json');

const source = process.argv[2] || DEFAULT_SOURCE;

const yamlText = fs.readFileSync(source, 'utf8');
const spec = YAML.parse(yamlText);

fs.mkdirSync(path.dirname(TARGET), { recursive: true });
fs.writeFileSync(TARGET, JSON.stringify(spec, null, 2));

const pathCount = Object.keys(spec.paths ?? {}).length;
const operationCount = Object.values(spec.paths ?? {}).reduce(
  (acc, item) =>
    acc +
    Object.values(item ?? {}).filter(
      (v) => typeof v === 'object' && v !== null && 'responses' in v,
    ).length,
  0,
);
const schemaCount = Object.keys(spec.components?.schemas ?? {}).length;

console.log(
  `Wrote ${path.relative(ROOT, TARGET)}\n  paths:      ${pathCount}\n  operations: ${operationCount}\n  schemas:    ${schemaCount}`,
);
