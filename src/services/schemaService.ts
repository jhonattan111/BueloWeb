const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

/** The declarative kinds the backend generates JSON Schemas for (GET /api/schemas/{kind}). */
export const DECLARATIVE_KINDS = [
  'report',
  'component',
  'styles',
  'formats',
  'lib',
  'validator',
  'theme',
] as const

export interface YamlSchemaBinding {
  uri: string
  fileMatch: string[]
  schema: object
}

/**
 * Fetches the JSON Schema for each declarative kind and binds it by filename convention:
 * a file named `<name>.<kind>.yml` (e.g. `fatura.report.yml`) gets the matching schema.
 * Best-effort: a kind whose schema fails to load is skipped.
 */
export async function fetchYamlSchemas(): Promise<YamlSchemaBinding[]> {
  const bindings = await Promise.all(
    DECLARATIVE_KINDS.map(async (kind): Promise<YamlSchemaBinding | null> => {
      try {
        const response = await fetch(`${BASE_URL}/api/schemas/${kind}`)
        if (!response.ok) return null
        const schema = (await response.json()) as object
        return {
          uri: `${BASE_URL}/api/schemas/${kind}`,
          fileMatch: [`*.${kind}.yml`, `*.${kind}.yaml`],
          schema,
        }
      } catch {
        return null
      }
    }),
  )

  return bindings.filter((binding): binding is YamlSchemaBinding => binding !== null)
}
