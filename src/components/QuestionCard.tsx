import { Fragment, type ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import type { Field, Question } from '../data/questions'
import type { FieldValue, QuestionAnswer } from '../lib/answers'
import { fieldKey, isDisabled, revealedFields } from '../lib/answers'
import { CheckGroup, ChoiceGroup, DateField, NumberField, RangeSlider, TextField } from './fields'

interface QuestionCardProps {
  question: Question
  answer: QuestionAnswer | undefined
  errors: Record<string, string>
  /** Next/Submit was pressed while this question was still unanswered. */
  needsAnswer: boolean
  /** Delay before the card's entrance animation, for a staggered reveal. */
  enterDelayMs: number
  onValueChange: (fieldId: string, value: FieldValue | undefined) => void
  onFieldBlur: (fieldId: string) => void
}

const INPUT_KINDS = new Set<Field['kind']>(['number', 'date', 'text', 'slider'])

/**
 * A lone input under its question doesn't need its own label on screen: "What is your date of birth?"
 * already says "Date of birth". Screen readers still get it.
 */
const loneInput = (group: Field[]) => {
  const labelled = group.filter((f) => f.label)
  return labelled.length === 1 && INPUT_KINDS.has(labelled[0].kind) ? labelled[0] : undefined
}

/** Follow-up fields (e.g. cigarettes per day after "Former") ease in when they appear. */
const reveal = 'animate-in fade-in slide-in-from-bottom-1 duration-500 fill-mode-both'

export function QuestionCard({ question, answer, errors, needsAnswer, enterDelayMs, onValueChange, onFieldBlur }: QuestionCardProps) {
  const { id, title } = question
  const values = answer?.values ?? {}
  const fields = revealedFields(question, values)
  const titleId = `q${id}-title`
  // Cards with parts keep their topic off screen, unless it comes with a note (e.g. "Optional").
  const showTitle = !question.parts || Boolean(question.description)
  const missingId = `q${id}-missing`

  /** `context` labels unlabelled fields: the part's question, or the card title for a lone group. */
  const renderField = (field: Field, context: string, hideLabel: boolean): ReactNode => {
    const key = fieldKey(id, field.id)
    const value = values[field.id]
    const disabled = isDisabled(field, values)
    switch (field.kind) {
      case 'number':
        return (
          <NumberField
            key={key}
            id={key}
            field={field}
            value={typeof value === 'string' ? value : ''}
            error={errors[key]}
            disabled={disabled}
            hideLabel={hideLabel}
            onChange={(v) => onValueChange(field.id, v)}
            onBlur={() => onFieldBlur(field.id)}
          />
        )
      case 'date':
        return (
          <DateField
            key={key}
            id={key}
            field={field}
            value={typeof value === 'string' ? value : ''}
            error={errors[key]}
            hideLabel={hideLabel}
            onChange={(v) => onValueChange(field.id, v)}
            onBlur={() => onFieldBlur(field.id)}
          />
        )
      case 'text':
        return (
          <TextField
            key={key}
            id={key}
            field={field}
            fallbackLabel={context}
            value={typeof value === 'string' ? value : ''}
            disabled={disabled}
            hideLabel={hideLabel}
            onChange={(v) => onValueChange(field.id, v)}
          />
        )
      case 'choice':
        return (
          <ChoiceGroup
            key={key}
            name={key}
            legend={field.label ?? context}
            showLegend={Boolean(field.label)}
            options={field.options}
            value={typeof value === 'string' ? value : undefined}
            onChange={(v) => onValueChange(field.id, v)}
          />
        )
      case 'checks':
        return (
          <CheckGroup
            key={key}
            name={key}
            legend={field.label ?? (field.options.length === 1 ? field.options[0] : context)}
            showLegend={Boolean(field.label)}
            options={field.options}
            exclusive={field.exclusive}
            value={Array.isArray(value) ? value : []}
            onChange={(v) => onValueChange(field.id, v.length ? v : undefined)}
          />
        )
      case 'slider':
        return (
          <RangeSlider
            key={key}
            id={key}
            field={field}
            value={typeof value === 'number' ? value : undefined}
            disabled={disabled}
            hideLabel={hideLabel}
            onChange={(v) => onValueChange(field.id, v)}
          />
        )
    }
  }

  // Consecutive number boxes sit side by side, e.g. systolic and diastolic.
  // `group` is every field under the same question, shown or not, so labels don't come and go.
  const renderBlocks = (list: Field[], group: Field[], context: string) => {
    const lone = loneInput(group)
    const render = (f: Field) => renderField(f, context, f === lone)
    const blocks: ReactNode[] = []
    for (let i = 0; i < list.length; i++) {
      if (list[i].kind !== 'number') {
        blocks.push(
          <div className={reveal} key={list[i].id}>
            {render(list[i])}
          </div>,
        )
        continue
      }
      const row: Field[] = []
      while (i < list.length && list[i].kind === 'number') row.push(list[i++])
      i--
      blocks.push(
        <div className={cn('flex flex-wrap gap-x-3 gap-y-4', reveal)} key={`row-${row[0].id}`}>
          {row.map(render)}
        </div>,
      )
    }
    return blocks
  }

  // Cards with several questions show each one as its own fieldset; the questions say it all, so the topic stays off screen.
  const body = question.parts ? (
    question.parts.map((part, i) => {
      const partFields = part.fields.filter((f) => fields.includes(f))
      if (!partFields.length) return null
      return (
        <Fragment key={part.label}>
          {i > 0 && <FieldSeparator className={reveal} />}
          <FieldSet className={reveal}>
            <FieldLegend className="mb-3">{part.label}</FieldLegend>
            <FieldGroup className="gap-4">{renderBlocks(partFields, part.fields, part.label)}</FieldGroup>
          </FieldSet>
        </Fragment>
      )
    })
  ) : (
    <FieldGroup className="gap-4">{renderBlocks(fields, question.fields, title)}</FieldGroup>
  )

  return (
    <Card
      className={cn(
        'scroll-mt-24 outline-none animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both',
        needsAnswer && 'ring-2 ring-destructive',
      )}
      id={`q${id}`}
      tabIndex={-1}
      role="region"
      aria-labelledby={titleId}
      aria-describedby={needsAnswer ? missingId : undefined}
      style={{ animationDelay: `${enterDelayMs}ms` }}
    >
      {!showTitle && (
        <h3 id={titleId} className="sr-only">
          {title}
        </h3>
      )}
      {(showTitle || needsAnswer) && (
        <CardHeader>
          {showTitle && (
            <CardTitle id={titleId} role="heading" aria-level={3}>
              {title}
            </CardTitle>
          )}
          {question.description && <CardDescription>{question.description}</CardDescription>}
          {needsAnswer && (
            <CardDescription id={missingId} className="text-destructive">
              Please answer this question.
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        <FieldGroup className="gap-6">{body}</FieldGroup>
      </CardContent>
    </Card>
  )
}
