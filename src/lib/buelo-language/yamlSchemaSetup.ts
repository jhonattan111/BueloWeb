import * as monaco from 'monaco-editor'
import { configureMonacoYaml } from 'monaco-yaml'

import { fetchYamlSchemas } from '@/services/schemaService'

let configured = false

/**
 * Wires monaco-yaml for the declarative editor: pulls the per-kind JSON Schemas from the backend
 * (GET /api/schemas/{kind}) and binds them by filename convention, giving autocomplete, inline
 * validation and hover on `*.report.yml`, `*.component.yml`, etc. — no language server (blueprint §11).
 *
 * Best-effort and idempotent: if the API isn't reachable, YAML still edits without schema help.
 */
export async function configureBueloYamlSchemas(): Promise<void> {
  if (configured) return
  configured = true

  const schemas = await fetchYamlSchemas()

  configureMonacoYaml(monaco, {
    enableSchemaRequest: false,
    validate: true,
    hover: true,
    completion: true,
    schemas,
  })
}
