import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Field as FieldDef } from '../data/questions'
import { ageOn, formatSliderValue, parseDate, validateDate } from '../lib/answers'

type SliderField = Extract<FieldDef, { kind: 'slider' }>
type NumberFieldDef = Extract<FieldDef, { kind: 'number' }>
type DateFieldDef = Extract<FieldDef, { kind: 'date' }>
type TextFieldDef = Extract<FieldDef, { kind: 'text' }>

/** Short option lists sit side by side; longer ones wrap into two columns. */
const optionColumns = (count: number) => (count === 2 ? 'grid-cols-2' : count === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')

/** Keeps digits only and inserts the slashes: "11222001" → "11/22/2001". */
const maskDate = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`
  return d
}

interface DateFieldProps {
  id: string
  field: DateFieldDef
  value: string
  error: string | undefined
  /** Hide the label visually when the question already says it ("What is your date of birth?"). */
  hideLabel?: boolean
  onChange: (value: string) => void
  onBlur: () => void
}

export function DateField({ id, field, value, error, hideLabel, onChange, onBlur }: DateFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const date = validateDate(field, value) ? null : parseDate(value)
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {field.label}
      </FieldLabel>
      <Input
        id={id}
        className="sm:max-w-48"
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        placeholder={field.placeholder}
        maxLength={10}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hintId}
        onChange={(e) => onChange(maskDate(e.target.value))}
        onBlur={onBlur}
      />
      {error ? (
        <FieldError id={errorId}>{error}</FieldError>
      ) : (
        // The format stays in view once the placeholder is typed over.
        <FieldDescription id={hintId}>{date ? `Age: ${ageOn(date)}` : 'Month / day / year, e.g. 01/15/1985'}</FieldDescription>
      )}
    </Field>
  )
}

interface ChoiceGroupProps {
  name: string
  legend: string
  /** Hide the legend visually when a heading above already says it. */
  showLegend: boolean
  options: string[]
  value: string | undefined
  onChange: (value: string) => void
}

/** Single choice, as selectable cards. Tapping the chosen option again keeps it (a double tap mustn't undo it). */
export function ChoiceGroup({ name, legend, showLegend, options, value, onChange }: ChoiceGroupProps) {
  return (
    <FieldSet>
      <FieldLegend variant="label" className={showLegend ? undefined : 'sr-only'}>
        {legend}
      </FieldLegend>
      <RadioGroup name={name} value={value ?? ''} onValueChange={onChange} className={optionColumns(options.length)}>
        {options.map((option) => {
          const id = `${name}-${option}`
          return (
            <FieldLabel key={option} htmlFor={id}>
              <Field orientation="horizontal">
                <RadioGroupItem id={id} value={option} />
                <FieldTitle className="font-normal">{option}</FieldTitle>
              </Field>
            </FieldLabel>
          )
        })}
      </RadioGroup>
    </FieldSet>
  )
}

interface CheckGroupProps {
  name: string
  legend: string
  showLegend: boolean
  options: string[]
  exclusive?: string[]
  value: string[]
  onChange: (value: string[]) => void
}

/** Multiple choice. Exclusive options (e.g. None of these) clear the others, and vice versa. */
export function CheckGroup({ name, legend, showLegend, options, exclusive = [], value, onChange }: CheckGroupProps) {
  const toggle = (option: string) => {
    if (value.includes(option)) return onChange(value.filter((v) => v !== option))
    if (exclusive.includes(option)) return onChange([option])
    onChange([...value.filter((v) => !exclusive.includes(v)), option])
  }
  // A single option ("I don't know my results") is a plain checkbox, not a boxed choice.
  if (options.length === 1) {
    const id = `${name}-${options[0]}`
    return (
      <Field orientation="horizontal">
        <Checkbox id={id} checked={value.includes(options[0])} onCheckedChange={() => toggle(options[0])} />
        <FieldLabel htmlFor={id} className="font-normal">
          {options[0]}
        </FieldLabel>
      </Field>
    )
  }
  return (
    <FieldSet>
      <FieldLegend variant="label" className={showLegend ? undefined : 'sr-only'}>
        {legend}
      </FieldLegend>
      <FieldDescription>Choose all that apply.</FieldDescription>
      <div data-slot="checkbox-group" className={cn('grid gap-2', optionColumns(options.length))}>
        {options.map((option) => {
          const id = `${name}-${option}`
          return (
            <FieldLabel key={option} htmlFor={id}>
              <Field orientation="horizontal">
                <Checkbox id={id} checked={value.includes(option)} onCheckedChange={() => toggle(option)} />
                <FieldTitle className="font-normal">{option}</FieldTitle>
              </Field>
            </FieldLabel>
          )
        })}
      </div>
    </FieldSet>
  )
}

interface NumberFieldProps {
  id: string
  field: NumberFieldDef
  value: string
  error: string | undefined
  disabled?: boolean
  hideLabel?: boolean
  onChange: (value: string) => void
  onBlur: () => void
}

export function NumberField({ id, field, value, error, disabled, hideLabel, onChange, onBlur }: NumberFieldProps) {
  const errorId = `${id}-error`
  // Errors on a greyed-out box no longer apply, so they're hidden with it.
  const shownError = disabled ? undefined : error
  return (
    <Field
      data-invalid={shownError ? true : undefined}
      data-disabled={disabled || undefined}
      // Long units ("min a week") need a wider box, so those stack on small phones.
      className={cn('flex-1', field.unit.length > 6 ? 'max-w-56 min-w-44' : 'max-w-44 min-w-32')}
    >
      <FieldLabel htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {field.label}
      </FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          type="text"
          inputMode={field.decimals ? 'decimal' : 'numeric'}
          autoComplete="off"
          placeholder={field.placeholder}
          value={value}
          disabled={disabled}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={shownError ? errorId : undefined}
          // The unit is already shown, so typed extras like "cm" or spaces are simply dropped.
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          onBlur={onBlur}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{field.unit}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      {shownError && <FieldError id={errorId}>{shownError}</FieldError>}
    </Field>
  )
}

interface TextFieldProps {
  id: string
  field: TextFieldDef
  fallbackLabel: string
  value: string
  disabled?: boolean
  hideLabel?: boolean
  onChange: (value: string) => void
}

export function TextField({ id, field, fallbackLabel, value, disabled, hideLabel, onChange }: TextFieldProps) {
  const label = field.label ?? (field.notes ? 'Notes' : fallbackLabel)
  const common = {
    id,
    placeholder: field.placeholder,
    value,
    disabled,
    'aria-label': field.label && !hideLabel ? undefined : label,
  }
  return (
    <Field data-disabled={disabled || undefined}>
      {field.label && !hideLabel && <FieldLabel htmlFor={id}>{field.label}</FieldLabel>}
      {field.multiline ? (
        <Textarea {...common} className="min-h-16" rows={2} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input {...common} type="text" onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  )
}

interface RangeSliderProps {
  id: string
  field: SliderField
  value: number | undefined
  disabled?: boolean
  hideLabel?: boolean
  onChange: (value: number) => void
}

/** Starts "Not set" so a default position is never recorded as an answer. */
export function RangeSlider({ id, field, value, disabled, hideLabel, onChange }: RangeSliderProps) {
  const isSet = value !== undefined
  const position = value ?? field.min + Math.round((field.max - field.min) / 2 / field.step) * field.step
  const display = isSet ? formatSliderValue(field, position) : disabled ? '' : 'Slide to answer'
  const labelId = `${id}-label`
  return (
    <Field data-disabled={disabled || undefined}>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel id={labelId} className={hideLabel ? 'sr-only' : undefined}>
          {field.label}
        </FieldLabel>
        <output aria-live="polite" className={cn('shrink-0 text-sm whitespace-nowrap tabular-nums', isSet ? 'font-medium' : 'text-muted-foreground')}>
          {display}
        </output>
      </div>
      <Slider
        id={id}
        className={cn('py-2', !isSet && '**:data-[slot=slider-range]:opacity-0')}
        min={field.min}
        max={field.max}
        step={field.step}
        value={[position]}
        disabled={disabled}
        thumbProps={{ 'aria-labelledby': labelId, 'aria-valuetext': display }}
        onValueChange={([v]) => onChange(v)}
        // Pressing the thumb at its starting spot changes nothing, so set the value on release too.
        onPointerUp={() => {
          if (!isSet && !disabled) onChange(position)
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>{formatSliderValue(field, field.min)}</span>
        <span>{formatSliderValue(field, field.max)}</span>
      </div>
    </Field>
  )
}
