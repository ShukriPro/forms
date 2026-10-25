import type { Field, Question, ShowIf } from '../data/questions'
import { QUESTIONS, SECTIONS } from '../data/questions'

export type FieldValue = string | string[] | number

export interface QuestionAnswer {
  values: Record<string, FieldValue | undefined>
}

export type Answers = Record<number, QuestionAnswer>

export const fieldKey = (questionId: number, fieldId: string) => `q${questionId}-${fieldId}`

const hasValue = (value: FieldValue | undefined) => {
  if (value === undefined) return false
  if (typeof value === 'number') return true
  if (Array.isArray(value)) return value.length > 0
  return value.trim() !== ''
}

const matches = (conditions: ShowIf | ShowIf[], values: QuestionAnswer['values']) =>
  (Array.isArray(conditions) ? conditions : [conditions]).some(({ field: source, anyOf }) => {
    const value = values[source]
    const selected = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
    return selected.some((v) => anyOf.includes(v))
  })

/** Whether a field applies, given the other answers in its question (e.g. cigarettes per day only for smokers). */
export function isVisible(field: Field, values: QuestionAnswer['values']) {
  return !field.showIf || matches(field.showIf, values)
}

/** Whether a field is greyed out by another answer (e.g. "I don't know my results" ticked). */
export function isDisabled(field: Field, values: QuestionAnswer['values']) {
  return Boolean(field.disabledIf && matches(field.disabledIf, values))
}

/** Visible and not greyed out: the fields whose values count. */
const isActive = (field: Field, values: QuestionAnswer['values']) => isVisible(field, values) && !isDisabled(field, values)

/**
 * Answered when every visible required field has a value.
 * Questions without required fields (e.g. test results) need at least one value.
 */
export function isAnswered(question: Question, answer: QuestionAnswer | undefined) {
  // Optional questions are done even when left blank, so they never hold up Next/Submit.
  if (question.optional) return true
  if (!answer) return false
  const visible = question.fields.filter((f) => isActive(f, answer.values))
  const required = visible.filter((f) => f.required)
  if (required.length) return required.every((f) => hasValue(answer.values[f.id]))
  return visible.some((f) => !(f.kind === 'text' && f.notes) && hasValue(answer.values[f.id]))
}

/** A field is complete once it has a value that passes its checks (a half-typed number isn't). */
const fieldComplete = (field: Field, value: FieldValue | undefined) => {
  if (!hasValue(value)) return false
  if (field.kind === 'number' && typeof value === 'string') return !validateNumber(field, value)
  if (field.kind === 'date' && typeof value === 'string') return !validateDate(field, value)
  return true
}

/**
 * The parts of a question to show, in order: each required part appears only once the
 * required parts above it are complete. Optional parts (notes) never hold the rest back.
 * Fields with an "I don't know" checkbox appear together with it, so it can be ticked instead.
 */
export function revealedFields(question: Question, values: QuestionAnswer['values']) {
  const shown: Field[] = []
  // Once an unanswered required field is reached: the checkbox that can skip it (null if none).
  let blockedBy: string | null | undefined
  for (const field of question.fields) {
    if (!isVisible(field, values)) continue
    if (blockedBy !== undefined && (blockedBy === null || (field.id !== blockedBy && field.disabledIf?.field !== blockedBy))) break
    shown.push(field)
    if (blockedBy === undefined && field.required && !isDisabled(field, values) && !fieldComplete(field, values[field.id]))
      blockedBy = field.disabledIf?.field ?? null
  }
  return shown
}

export function validateNumber(field: Extract<Field, { kind: 'number' }>, raw: string): string | undefined {
  const text = raw.trim()
  if (text === '') return undefined
  const pattern = field.decimals ? /^\d+([.,]\d+)?$/ : /^\d+$/
  if (!pattern.test(text)) return field.decimals ? 'Enter a number, e.g. 5.2' : 'Enter a whole number'
  const n = Number(text.replace(',', '.'))
  if (n < field.min || n > field.max) return `Enter a number between ${field.min} and ${field.max}`
  return undefined
}

/** Parses MM/DD/YYYY; returns null for incomplete text or dates that don't exist (e.g. 02/30/2001). */
export function parseDate(text: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim())
  if (!match) return null
  const [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

/** Age in completed years on `today`. */
export function ageOn(birth: Date, today = new Date()) {
  const hadBirthday =
    today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())
  return today.getFullYear() - birth.getFullYear() - (hadBirthday ? 0 : 1)
}

export function validateDate(field: Extract<Field, { kind: 'date' }>, raw: string): string | undefined {
  const text = raw.trim()
  if (text === '') return undefined
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return 'Enter the date as MM/DD/YYYY, e.g. 11/22/2001'
  const date = parseDate(text)
  if (!date) {
    // Most people outside the US write the day first; show them the same date the other way round.
    const [first, second, year] = text.split('/')
    const swapped = `${second}/${first}/${year}`
    if (Number(first) > 12 && parseDate(swapped)) return `Put the month first. Did you mean ${swapped}?`
    return "That date doesn't exist. Check the month and day."
  }
  if (date > new Date()) return "Your date of birth can't be in the future"
  const age = ageOn(date)
  if (age < field.minAge) return `You need to be at least ${field.minAge} to use this assessment`
  if (age > field.maxAge) return 'Check the year you entered'
  return undefined
}

export function formatSliderValue(field: Extract<Field, { kind: 'slider' }>, value: number) {
  if (field.labels) return field.labels[value]
  const plus = field.openEnded && value === field.max ? '+' : ''
  const unit = value === 1 && field.unitOne ? field.unitOne : field.unit
  return `${value}${plus}${unit ? ` ${unit}` : ''}`
}

/** A field's answer as it reads in a sentence, e.g. "5.2 mmol/L" or "Walking, Climbing stairs". */
function formatValue(field: Field, value: FieldValue) {
  if (Array.isArray(value)) return value.join(', ')
  switch (field.kind) {
    case 'number':
      return `${value} ${field.unit}`
    case 'date': {
      const date = parseDate(String(value))
      return date ? `${value} (age ${ageOn(date)})` : String(value)
    }
    case 'slider':
      return typeof value === 'number' ? formatSliderValue(field, value) : String(value)
    default:
      return String(value)
  }
}

/** One line of a summary: an answer, with its field's label when the heading alone doesn't say what it is. */
export interface SummaryLine {
  label?: string
  value: string
}

/** A question as shown in the summary: the question asked and what was answered (empty when skipped). */
export interface SummaryItem {
  key: string
  question: string
  lines: SummaryLine[]
}

export interface SummaryCard {
  id: number
  items: SummaryItem[]
}

export interface SummarySection {
  step: number
  title: string
  cards: SummaryCard[]
}

const summaryLines = (fields: Field[], values: QuestionAnswer['values'], keepLabels = false): SummaryLine[] => {
  const answered = fields.filter((f) => hasValue(values[f.id]) && isActive(f, values))
  const labels = new Set(answered.map((f) => f.label))
  const lines = answered
    // "Which test was it? HbA1c" adds nothing next to "HbA1c: 38 mmol/mol".
    .filter((f) => !(f.kind === 'choice' && labels.has(String(values[f.id]))))
    .map((f) => {
      // Notes have no label, so their placeholder names them: "Test date (optional)" → "Test date".
      const label = f.label ?? (f.kind === 'text' && f.notes ? f.placeholder : undefined)
      return { label: label?.replace(/\s*\(optional\)$/, ''), value: formatValue(f, values[f.id]!) }
    })
  // A lone answer sits right under its question, so its label would only repeat it ("Date of birth").
  return lines.length === 1 && !keepLabels ? [{ value: lines[0].value }] : lines
}

/** Every answer in plain words, grouped like the form, for reviewing before or after submitting. */
export function summarize(answers: Answers, keepLabels = false): SummarySection[] {
  return SECTIONS.map((section, step) => ({
    step,
    title: section.title,
    cards: section.questions.map((q) => {
      const values = answers[q.id]?.values ?? {}
      return q.parts
        ? {
            id: q.id,
            items: q.parts.map((part, i) => ({ key: `${q.id}-${i}`, question: part.label, lines: summaryLines(part.fields, values, keepLabels) })),
          }
        : { id: q.id, items: [{ key: `${q.id}`, question: q.title, lines: summaryLines(q.fields, values, keepLabels) }] }
    }),
  }))
}

/**
 * Each question's answer as plain text, by question number, for filling in the prompt.
 * Cards with several parts get one line per part, each starting with its question.
 */
export function answerTexts(answers: Answers): Record<number, string> {
  const texts: Record<number, string> = {}
  // Labels stay on even for lone answers, so e.g. "HbA1c: 38 mmol/mol" still says which test it was.
  for (const card of summarize(answers, true).flatMap((section) => section.cards)) {
    const lines = card.items
      .filter((item) => item.lines.length)
      .map((item) => {
        const text = item.lines.map((line) => (line.label ? `${line.label}: ${line.value}` : line.value)).join('; ')
        return card.items.length > 1 ? `${item.question} ${text}` : text
      })
    texts[card.id] = lines.join('\n') || 'Not answered'
  }
  return texts
}

/** Errors keyed by fieldKey. Hidden and greyed-out fields are skipped. */
export function getErrors(answers: Answers) {
  const errors: Record<string, string> = {}
  for (const q of QUESTIONS) {
    const answer = answers[q.id]
    if (!answer) continue
    for (const f of q.fields) {
      if (!isActive(f, answer.values)) continue
      const value = answer.values[f.id]
      if (typeof value !== 'string') continue
      const error = f.kind === 'number' ? validateNumber(f, value) : f.kind === 'date' ? validateDate(f, value) : undefined
      if (error) errors[fieldKey(q.id, f.id)] = error
    }
  }
  return errors
}

const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export interface SubmittedAnswer {
  question: number
  title: string
  status: 'answered' | 'skipped'
  values?: Record<string, FieldValue>
}

/** The payload to send to a backend: hidden inputs and empty fields are left out. */
export function buildSubmission(answers: Answers): SubmittedAnswer[] {
  return QUESTIONS.map((q) => {
    const answer = answers[q.id]
    const values: Record<string, FieldValue> = {}
    for (const f of q.fields) {
      const value = answer?.values[f.id]
      // Answers left behind in fields that no longer apply (e.g. after switching to "Never" or ticking "I don't know") aren't sent.
      if (!hasValue(value) || !isActive(f, answer!.values)) continue
      if (f.kind === 'number' && typeof value === 'string') values[f.id] = Number(value.replace(',', '.'))
      else if (f.kind === 'date' && typeof value === 'string') {
        // Sent as YYYY-MM-DD, with the age worked out at submission time.
        const date = parseDate(value)
        if (!date) continue
        values[f.id] = toIsoDate(date)
        values.age = ageOn(date)
      } else values[f.id] = value!
    }
    return Object.keys(values).length
      ? { question: q.id, title: q.title, status: 'answered', values }
      : { question: q.id, title: q.title, status: 'skipped' }
  })
}
