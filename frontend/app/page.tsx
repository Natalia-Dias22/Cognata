'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Cpu, Plus, RotateCcw, Send, User } from 'lucide-react'
import { reconstructWord } from '@/lib/reconstruct'

const languages = [
  { key: 'pt', label: 'Português', short: 'PT', example: 'fogo' },
  { key: 'it', label: 'Italiano', short: 'IT', example: 'fuoco' },
  { key: 'es', label: 'Espanhol', short: 'ES', example: 'fuego' },
  { key: 'fr', label: 'Francês', short: 'FR', example: 'feu' },
  { key: 'ro', label: 'Romeno', short: 'RO', example: 'foc' },
] as const

type Message = { id: string | number; role: 'assistant' | 'user'; text: string; language?: string; result?: boolean }

const MAX_INPUT_LENGTH = 100

function sanitizeInput(value: string) {
  return value.replace(/[^\p{L}\p{M}\s-]/gu, '').slice(0, MAX_INPUT_LENGTH)
}

const prompts = [
  'Qual é a palavra em Português?',
  'E em Italiano, como se diz?',
  'Agora a versão em Espanhol:',
  'Em Francês, qual a forma?',
  'Por fim, como fica em Romeno?',
]

export default function Page() {
  const [step, setStep] = useState(0)
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(false)
  const [error, setError] = useState('')
    const [messages, setMessages] = useState<Message[]>([
      { id: 1, role: 'assistant', text: 'Olá. Vou coletar as variantes românicas para estimar a forma latina correspondente.' },
      { id: 2, role: 'assistant', text: prompts[0], language: languages[0].label },
    ])
  const endRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
  const answersRef = useRef<Record<string, string>>({})

  useEffect(() => {
    const messagesContainer = document.querySelector<HTMLElement>('.flex-1.overflow-y-auto')
    if (messagesContainer) {
      if (typeof messagesContainer.scrollTo === 'function') {
        messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' })
      } else {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }
  }, [messages, isProcessing])

  const progress = Math.min(step, languages.length)
  const currentLanguage = languages[Math.min(step, languages.length - 1)]

  const statusText = useMemo(() => {
    if (result) return 'Reconstrução concluída'
    if (isProcessing) return 'Modelo em execução'
    return `${progress} de ${languages.length} variantes coletadas`
  }, [isProcessing, progress, result])

  function handleInputChange(value: string) {
    const sanitizedValue = sanitizeInput(value)
    setInput(sanitizedValue)
    if (sanitizedValue.trim()) setError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const rawAnswer = inputRef.current?.value ?? input
    if (rawAnswer.length > MAX_INPUT_LENGTH) {
      setError('A palavra deve ter no máximo 100 caracteres')
      return
    }
    const answer = sanitizeInput(rawAnswer).trim()
    if (!answer) {
      setError('Digite a palavra')
      return
    }
    if (isProcessing || result) return
    const language = languages[step]
    setInput('')
    setError('')
    answersRef.current[language.key] = answer
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: answer, language: language.label }])

    if (step < languages.length - 1) {
      const next = step + 1
      setStep(next)
      window.setTimeout(() => setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', text: prompts[next], language: languages[next].label }]), 250)
      return
    }

    setStep(languages.length)
    setIsProcessing(true)
    reconstructWord(answersRef.current)
      .then((word) => {
        setResult(true)
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', text: word, result: true }])
      })
      .catch(() => {
        setError('Não foi possível concluir a reconstrução')
      })
      .finally(() => {
      setIsProcessing(false)
      })
  }

  function resetChat() {
    setStep(0)
    setInput('')
    setIsProcessing(false)
    setResult(false)
    setError('')
    answersRef.current = {}
    setMessages([
      { id: crypto.randomUUID(), role: 'assistant', text: 'Olá. Vou coletar as variantes românicas para estimar a forma latina correspondente.' },
      { id: crypto.randomUUID(), role: 'assistant', text: prompts[0], language: languages[0].label },
    ])
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-5 pt-6 sm:px-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 flex-col md:flex">
          <button onClick={resetChat} className="flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-medium shadow-sm hover:bg-muted"><Plus data-icon="inline-start" /> Nova reconstrução</button>
          <div className="mt-auto flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><div className="flex size-7 items-center justify-center rounded-full bg-muted"><User data-icon="inline-start" /></div><span>Projeto acadêmico</span></div>
        </aside>

        <section className="mx-auto flex h-[calc(100vh-7rem)] min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5"><div><h1 className="text-sm font-semibold">Reconstrução linguística</h1><p className="text-xs text-muted-foreground">Assistente de análise comparativa</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`size-2 rounded-full ${result ? 'bg-primary' : isProcessing ? 'animate-pulse bg-accent' : 'bg-emerald-500'}`} />{statusText}</div></div>
          {error && <div role="alert" className="border-b border-border bg-destructive/10 px-4 py-3 text-sm text-destructive sm:px-5">{error}</div>}
          <div className="border-b border-border bg-muted/30 px-4 py-3 sm:px-5"><div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium">Variantes românicas</span><span className="font-mono text-muted-foreground">{progress}/{languages.length}</span></div><div className="flex gap-1.5">{languages.map((language, index) => <div key={language.key} className={`h-1.5 flex-1 rounded-full ${index < progress ? 'bg-primary' : 'bg-border'}`} aria-label={`${language.label}: ${index < progress ? 'preenchida' : 'pendente'}`} />)}</div><div className="mt-2 flex justify-between font-mono text-[10px] uppercase text-muted-foreground">{languages.map((language) => <span key={language.key}>{language.short}</span>)}</div></div>

          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8"><div className="flex flex-col gap-2.5">{messages.map((message, index) => { const previous = messages[index - 1]; const isGrouped = previous?.role === message.role && !message.result; return <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${isGrouped ? '-mt-1' : ''}`}><div className={`flex max-w-[85%] gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}><div className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-full ${isGrouped ? 'invisible' : ''} ${message.role === 'user' ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}>{message.role === 'user' ? <User data-icon="inline-start" /> : <Cpu data-icon="inline-start" />}</div><div className={`rounded-lg px-3.5 py-2.5 text-sm leading-6 ${message.result ? 'border border-primary/20 bg-primary text-primary-foreground shadow-sm' : message.role === 'user' ? 'bg-muted' : 'border border-border bg-background'}`}><div className="mb-1 text-[10px] font-medium uppercase tracking-wider opacity-60">{message.language ?? (message.role === 'user' ? 'Sua resposta' : 'Reconstrutor')}</div><div className={message.result ? 'font-mono text-2xl font-semibold tracking-wide' : ''}>{message.text}</div>{message.result && <div className="mt-2 flex items-center gap-1.5 text-xs opacity-80"><Check data-icon="inline-start" /> Forma reconstruída</div>}</div></div></div>})}{isProcessing && <div className="flex gap-3"><div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground"><Cpu data-icon="inline-start" /></div><div className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><span className="flex gap-1"><i className="size-1.5 animate-pulse rounded-full bg-muted-foreground" /><i className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" /><i className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" /></span> Analisando padrões fonológicos…</span></div></div>}<div ref={endRef} /></div></div>

          <div className="border-t border-border bg-card p-3 sm:p-4"><form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-md border border-input bg-background p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring/30"><input ref={inputRef} value={input} maxLength={MAX_INPUT_LENGTH} onChange={(event) => handleInputChange(event.currentTarget.value)} onInput={(event) => handleInputChange(event.currentTarget.value)} onCompositionEnd={(event) => handleInputChange(event.currentTarget.value)} disabled={isProcessing || result} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} placeholder={result ? 'Reconstrução concluída' : `Digite a palavra em ${currentLanguage.label}`} aria-label={result ? 'Reconstrução concluída' : `Digite a palavra em ${currentLanguage.label}`} className="h-9 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground" /><button type="submit" disabled={isProcessing || result} className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Enviar resposta"><Send data-icon="inline-start" /></button></form><div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground"><span>Enter para enviar</span>{result ? <button onClick={resetChat} className="inline-flex items-center gap-1 hover:text-foreground"><RotateCcw data-icon="inline-start" /> Reiniciar</button> : <span>{progress < languages.length ? `Próximo: ${currentLanguage.label}` : 'Processando'}</span>}</div></div>
        </section>
      </div>
      <footer id="metodo" className="mx-auto flex max-w-7xl justify-between px-4 pb-5 text-[11px] text-muted-foreground sm:px-6 lg:px-8"><span id="sobre">Reconstrutor Latino · ferramenta acadêmica de linguística computacional</span><span className="hidden sm:inline">Dados de demonstração · endpoint /reconstruir</span></footer>
    </main>
  )
}
