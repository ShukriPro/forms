import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Answers } from '../lib/answers'
import { summarize } from '../lib/answers'

interface AnswerSummaryProps {
  answers: Answers
  onEdit: (step: number) => void
}

/** Every question with its answer in plain words, one card per section. */
export function AnswerSummary({ answers, onEdit }: AnswerSummaryProps) {
  return (
    <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 delay-150 duration-700 fill-mode-both" aria-labelledby="summary-title">
      <h2 id="summary-title" className="text-xl font-semibold tracking-tight">
        Your answers
      </h2>
      {summarize(answers).map((section) => (
        <Card key={section.title} role="region" aria-labelledby={`summary-${section.step}`}>
          <CardHeader className="border-b">
            <CardTitle id={`summary-${section.step}`} role="heading" aria-level={3}>
              {section.title}
            </CardTitle>
            <CardAction>
              <Button type="button" variant="outline" size="sm" onClick={() => onEdit(section.step)}>
                Edit<span className="sr-only"> {section.title}</span>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-4">
              {section.cards.map((card) => (
                <li className="flex flex-col gap-3 border-t pt-4 first:border-t-0 first:pt-0" key={card.id}>
                  {card.items.map((item) => (
                    <div className="flex flex-col gap-1" key={item.key}>
                      <p className="text-sm text-muted-foreground">{item.question}</p>
                      {item.lines.length ? (
                        <ul className="flex flex-col gap-0.5 text-sm font-medium">
                          {item.lines.map((line, i) => (
                            <li key={i}>
                              {line.label && (
                                <span className="font-normal text-muted-foreground">{line.label.endsWith('?') ? `${line.label} ` : `${line.label}: `}</span>
                              )}
                              {line.value}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Not answered</p>
                      )}
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
