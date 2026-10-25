import { CircleCheck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AnswerSummary } from './components/AnswerSummary'
import { AskAi } from './components/AskAi'
import { QuestionCard } from './components/QuestionCard'
import { buildPrompt } from './data/prompt'
import { COUNTED_QUESTIONS, QUESTIONS, SECTIONS } from './data/questions'
import type { Answers, FieldValue } from './lib/answers'
import { fieldKey, getErrors, isAnswered } from './lib/answers'

const LAST_STEP = SECTIONS.length - 1
const TYPED_KINDS = new Set(['text', 'number', 'date'])
// Picking an option reveals the next question almost at once; typing waits for a pause so nothing pops up mid-word.
const REVEAL_DELAY_MS = { pointer: 500, typing: 1000 }
const STAGGER_MS = 110

type Errors = Record<string, string>

/** The question an error key belongs to: "q7-total" → 7. */
const questionOf = (key: string) => Number(key.slice(1, key.indexOf('-')))

const unansweredIn = (step: number, answers: Answers) =>
  SECTIONS[step].questions.filter((q) => !isAnswered(q, answers[q.id])).map((q) => q.id)

/** How many questions at the start of a step are answered and error-free. */
const leadingDone = (step: number, answers: Answers, errors: Errors) => {
  let count = 0
  for (const q of SECTIONS[step].questions) {
    if (!isAnswered(q, answers[q.id]) || Object.keys(errors).some((key) => key.startsWith(`q${q.id}-`))) break
    count++
  }
  return count
}

/**
 * Questions are revealed one at a time: everything answered so far, plus the next one.
 * One past the last question means the Next button, so it waits for the same pause.
 */
const revealTarget = (step: number, answers: Answers, errors: Errors) =>
  Math.min(SECTIONS[step].questions.length + 1, leadingDone(step, answers, errors) + 1)

function App() {
  const [answers, setAnswers] = useState<Answers>({})
  const [step, setStep] = useState(0)
  const [touched, setTouched] = useState<Set<string>>(() => new Set())
  // Questions that were unanswered or had a mistake when Next/Submit was pressed. Only these are marked
  // in red, so a question that appears afterwards isn't flagged before anyone has had a chance to answer it.
  const [flagged, setFlagged] = useState<Set<number>>(() => new Set())
  // Number of questions revealed in each step; it only grows, so editing an earlier answer never hides later ones.
  const [revealed, setRevealed] = useState<Record<number, number>>({ 0: 1 })
  const [submitted, setSubmitted] = useState(false)
  const lastInput = useRef<'pointer' | 'typing'>('pointer')
  // Cards already revealed when a step opens fade in together, slightly staggered.
  const [entryCount, setEntryCount] = useState(1)
  const prevShown = useRef(1)

  const section = SECTIONS[step]
  const allErrors = useMemo(() => getErrors(answers), [answers])
  // A question with a mistake in it (e.g. a date that doesn't exist) isn't counted as done yet.
  const answeredCount = COUNTED_QUESTIONS.filter(
    (q) => isAnswered(q, answers[q.id]) && !Object.keys(allErrors).some((key) => key.startsWith(`q${q.id}-`)),
  ).length
  const shown = revealed[step] ?? 1
  const target = revealTarget(step, answers, allErrors)
  const stepDone = leadingDone(step, answers, allErrors) === section.questions.length
  const sectionIds = new Set(section.questions.map((q) => q.id))
  const sectionErrorKeys = Object.keys(allErrors).filter((key) => sectionIds.has(questionOf(key)))
  const visibleErrors = Object.fromEntries(Object.entries(allErrors).filter(([key]) => touched.has(key) || flagged.has(questionOf(key))))
  const missing = unansweredIn(step, answers).filter((id) => flagged.has(id))
  const hasIssues = missing.length > 0 || sectionErrorKeys.some((key) => flagged.has(questionOf(key)))

  const revealNow = (count: number) => setRevealed((prev) => ({ ...prev, [step]: Math.max(prev[step] ?? 1, count) }))

  // Reveal the next question once the current one is answered. Every change restarts the wait,
  // so while someone keeps typing the next question stays hidden.
  useEffect(() => {
    if (target <= shown) return
    const timer = setTimeout(
      () => setRevealed((prev) => ({ ...prev, [step]: Math.max(prev[step] ?? 1, target) })),
      REVEAL_DELAY_MS[lastInput.current],
    )
    return () => clearTimeout(timer)
  }, [answers, target, shown, step])

  // Bring a newly revealed question (or the Next button) into view.
  useEffect(() => {
    if (shown > prevShown.current) {
      const q = section.questions[shown - 1]
      const el = q ? document.getElementById(`q${q.id}`) : document.querySelector('.step-nav')
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    prevShown.current = shown
  }, [shown, section])

  const setValue = (questionId: number, fieldId: string, value: FieldValue | undefined) => {
    const field = QUESTIONS.find((q) => q.id === questionId)?.fields.find((f) => f.id === fieldId)
    lastInput.current = field && TYPED_KINDS.has(field.kind) ? 'typing' : 'pointer'
    setAnswers((prev) => {
      const current = prev[questionId] ?? { values: {} }
      return { ...prev, [questionId]: { ...current, values: { ...current.values, [fieldId]: value } } }
    })
  }

  const goTo = (next: number) => {
    const count = Math.max(revealed[next] ?? 1, revealTarget(next, answers, allErrors))
    setRevealed((prev) => ({ ...prev, [next]: count }))
    setEntryCount(count)
    prevShown.current = count
    setStep(next)
    window.scrollTo({ top: 0 })
  }

  /** Checks the current step; returns true when every question is answered and every number is valid. */
  const checkStep = () => {
    const unanswered = unansweredIn(step, answers)
    if (!unanswered.length && !sectionErrorKeys.length) return true
    // The question to fix may not be on screen yet, so show it first, then take the person to it.
    const firstMissing = section.questions.findIndex((q) => unanswered.includes(q.id))
    if (firstMissing >= 0) revealNow(firstMissing + 1)
    const onScreen = section.questions.slice(0, Math.max(shown, firstMissing + 1)).map((q) => q.id)
    setFlagged(
      (prev) => new Set([...prev, ...unanswered.filter((id) => onScreen.includes(id)), ...sectionErrorKeys.map(questionOf)]),
    )
    requestAnimationFrame(() => {
      const problem = document.getElementById(sectionErrorKeys[0] ?? `q${unanswered[0]}`)
      problem?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      problem?.focus({ preventScroll: true })
    })
    return false
  }

  const handleNext = () => {
    if (checkStep()) goTo(step + 1)
  }

  const handleSubmit = () => {
    if (!checkStep()) return
    setSubmitted(true)
    window.scrollTo({ top: 0 })
  }

  if (submitted) {
    return (
      <main className="min-h-svh bg-background">
        <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10 sm:py-14">
          <Card role="status" className="animate-in fade-in slide-in-from-bottom-3 duration-700">
            <CardHeader className="items-center text-center">
              <CircleCheck className="mx-auto mb-2 size-10 text-primary" aria-hidden="true" strokeWidth={1.5} />
              <CardTitle role="heading" aria-level={1} className="text-xl">
                Your answers are ready
              </CardTitle>
              <CardDescription>Choose an AI chat to get your estimate. It opens with your answers already filled in. Just press send.</CardDescription>
            </CardHeader>
            <CardContent>
              <AskAi prompt={buildPrompt(answers)} />
            </CardContent>
          </Card>
          <AnswerSummary
            answers={answers}
            onEdit={(next) => {
              setSubmitted(false)
              goTo(next)
            }}
          />
        </div>
      </main>
    )
  }

  const isLast = step === LAST_STEP

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-16">
        <header className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-background px-4 pt-6 pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {step + 1} of {SECTIONS.length}
            </span>
            <span>
              {answeredCount} of {COUNTED_QUESTIONS.length} answered
            </span>
          </div>
          <Progress
            value={(answeredCount / COUNTED_QUESTIONS.length) * 100}
            aria-label={`${answeredCount} of ${COUNTED_QUESTIONS.length} questions answered`}
          />
        </header>

        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            if (isLast) handleSubmit()
            else handleNext()
          }}
          // Enter in a text box shows the next question straight away, or continues once the step is done.
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || !(e.target instanceof HTMLInputElement)) return
            e.preventDefault()
            if (target > shown) revealNow(target)
            else if (stepDone) {
              if (isLast) handleSubmit()
              else handleNext()
            }
          }}
        >
          <section className="flex flex-col gap-4" key={section.title} aria-labelledby="section-title">
            <h2 id="section-title" className="animate-in fade-in text-2xl font-semibold tracking-tight duration-500">
              {section.title}
            </h2>
            {section.questions.slice(0, shown).map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                answer={answers[q.id]}
                errors={visibleErrors}
                needsAnswer={missing.includes(q.id)}
                enterDelayMs={i < entryCount ? i * STAGGER_MS : 0}
                onValueChange={(fieldId, value) => setValue(q.id, fieldId, value)}
                onFieldBlur={(fieldId) => setTouched((prev) => new Set(prev).add(fieldKey(q.id, fieldId)))}
              />
            ))}
          </section>

          {/* Always there, so nobody wonders how to continue; pressing it early points to what's left. */}
          <div className="step-nav flex flex-col gap-3">
            {hasIssues && (
              <p className="text-sm text-destructive" role="alert">
                Please check the question marked in red, then press {isLast ? 'Submit' : 'Next'} again.
              </p>
            )}
            <div className="flex gap-2">
              {step > 0 && (
                <Button type="button" variant="outline" size="lg" className="h-11 flex-1" onClick={() => goTo(step - 1)}>
                  Back
                </Button>
              )}
              <Button type="submit" size="lg" className="h-11 flex-1">
                {isLast ? 'Submit' : 'Next'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}

export default App
