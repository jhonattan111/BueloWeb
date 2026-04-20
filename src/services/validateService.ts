import type { FileValidationResult } from '@/types/template'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

const EMPTY_RESULT: FileValidationResult = { valid: true, errors: [], warnings: [] }

export interface FileValidationEntry {
  path: string
  extension: string
  result: FileValidationResult
}

export interface ProjectValidationResult {
  valid: boolean
  totalErrors: number
  totalWarnings: number
  files: FileValidationEntry[]
}

/**
 * Validate file content against the backend.
 * `.json` files are skipped — Monaco handles JSON validation natively.
 */
export async function validateFile(
  extension: string,
  content: string,
): Promise<FileValidationResult> {
  if (extension === '.json') {
    return EMPTY_RESULT
  }

  try {
    const response = await fetch(`${BASE_URL}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extension, content }),
    })

    if (!response.ok) {
      // Backend error: return as a single error diagnostic
      const text = await response.text().catch(() => '')
      return {
        valid: false,
        errors: [{ message: text || `Server error: ${response.status}`, line: 1, column: 1, severity: 'error' }],
        warnings: [],
      }
    }

    return response.json() as Promise<FileValidationResult>
  } catch {
    // Network error — don't surface as validation errors, just return clean
    return EMPTY_RESULT
  }
}

export async function validateProject(): Promise<ProjectValidationResult> {
  const response = await fetch(`${BASE_URL}/api/validate/project`, {
    method: 'POST',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Server error: ${response.status}`)
  }

  return response.json() as Promise<ProjectValidationResult>
}
