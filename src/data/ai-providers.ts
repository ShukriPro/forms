/** AI chats that open with the prompt already typed in, via a `?q=` link. Icons live in public/ai. */
export const EXTERNAL_AI_PROVIDERS = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    icon: '/ai/openai.svg',
    invertInDark: true,
    url: (encodedPrompt: string) => `https://chatgpt.com/?q=${encodedPrompt}`,
  },
  {
    id: 'claude',
    label: 'Claude',
    icon: '/ai/claude-color.svg',
    invertInDark: false,
    url: (encodedPrompt: string) => `https://claude.ai/new?q=${encodedPrompt}`,
  },
  {
    id: 'gemini',
    label: 'Gemini',
    icon: '/ai/gemini-color.svg',
    invertInDark: false,
    url: (encodedPrompt: string) => `https://gemini.google.com/app?q=${encodedPrompt}`,
  },
  {
    id: 'grok',
    label: 'Grok',
    icon: '/ai/grok.svg',
    invertInDark: true,
    url: (encodedPrompt: string) => `https://grok.com/?q=${encodedPrompt}`,
  },
]
