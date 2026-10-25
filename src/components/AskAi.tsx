import { Check, ClipboardCopy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EXTERNAL_AI_PROVIDERS } from '../data/ai-providers'

const COPIED_MS = 2500

/**
 * Copies straight away, while the page still has focus: an AI link opens a new tab right after the click,
 * and the async clipboard API fails once focus has moved there. Returns false where this isn't supported.
 */
function copyNow(text: string) {
  const area = document.createElement('textarea')
  area.value = text
  area.readOnly = true
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.append(area)
  area.select()
  area.setSelectionRange(0, text.length)
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
  }
}

/** Opens the chosen AI chat with the prompt filled in, or copies the prompt to paste anywhere. */
export function AskAi({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)
  // The AI chat last opened, and whether the prompt made it to the clipboard too.
  const [opened, setOpened] = useState<{ label: string; copied: boolean }>()

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), COPIED_MS)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    // Clipboard blocked (e.g. no permission): the link still carries the prompt, and the note says what to do.
    const ok =
      copyNow(prompt) ||
      (await navigator.clipboard.writeText(prompt).then(
        () => true,
        () => false,
      ))
    if (ok) setCopied(true)
    return ok
  }

  const encoded = encodeURIComponent(prompt)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {EXTERNAL_AI_PROVIDERS.map((provider) => (
          <Button key={provider.id} asChild variant="outline" size="lg" className="h-11 gap-2">
            {/* Also copies the prompt: some chats open empty (e.g. after signing in, or Gemini ignoring the link). */}
            <a
              href={provider.url(encoded)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={async () => setOpened({ label: provider.label, copied: await copy() })}
            >
              <img src={provider.icon} alt="" className={cn('size-5', provider.invertInDark && 'dark:invert')} />
              {provider.label}
            </a>
          </Button>
        ))}
      </div>
      <p role="status" className={cn('text-center text-sm', opened ? 'rounded-lg bg-muted p-3 text-foreground' : 'pt-1 text-muted-foreground')}>
        {!opened
          ? "Didn't work? Copy the prompt and paste it into any AI chat."
          : opened.copied
            ? `Your answers are copied too. If ${opened.label} opens empty, paste them into the chat box and press send.`
            : `If ${opened.label} opens empty, press Copy prompt below, then paste it into the chat box and press send.`}
      </p>
      <Button type="button" variant="secondary" size="lg" className="h-11 gap-2" onClick={() => void copy()}>
        {copied ? <Check aria-hidden="true" /> : <ClipboardCopy aria-hidden="true" />}
        <span aria-live="polite">{copied ? 'Copied' : 'Copy prompt'}</span>
      </Button>
      <p className="text-center text-xs text-muted-foreground">Your answers go only to the AI you choose.</p>
    </div>
  )
}
