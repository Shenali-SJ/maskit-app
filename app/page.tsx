"use client"

import { useState, useCallback } from "react"
import { useTheme } from "next-themes"
import { Loader2, Copy, Check, Moon, Sun, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function countMaskedItems(masked: string): number {
  const matches = masked.match(/\{\{[A-Z0-9_]+:\d+\}\}/g)
  if (!matches) return 0
  return new Set(matches).size
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  )
}

export default function Home() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const maskedCount = countMaskedItems(output)

  const handleMask = useCallback(async () => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setOutput("")

    try {
      const res = await fetch("http://localhost:8080/api/mask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      })

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`)
      }

      const data = await res.json()
      setOutput(data.masked ?? "")
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Cannot reach the MaskIT server. Make sure it's running on localhost:8080."
        )
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred.")
      }
    } finally {
      setLoading(false)
    }
  }, [input])

  const handleCopy = useCallback(async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        handleMask()
      }
    },
    [handleMask]
  )

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="size-5 text-primary" />
          <span className="font-mono text-sm font-semibold tracking-tight">
            MaskIT
          </span>
          <span className="hidden text-xs text-muted-foreground sm:block">
            — mask sensitive data before it reaches AI
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col gap-4 p-6">
        {/* Panels */}
        <div className="grid flex-1 grid-cols-2 gap-4">
          {/* Input panel */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Input
            </label>
            <Textarea
              className="flex-1 resize-none font-mono text-sm min-h-[420px]"
              placeholder="Paste text containing emails, IPs, URLs, or connection strings…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
            />
          </div>

          {/* Output panel */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Masked output
              </label>
              {output && maskedCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {maskedCount} item{maskedCount !== 1 ? "s" : ""} masked
                </Badge>
              )}
            </div>
            <div className="relative flex-1">
              <Textarea
                className={cn(
                  "h-full min-h-[420px] resize-none font-mono text-sm",
                  !output && "text-muted-foreground"
                )}
                placeholder="Masked result will appear here…"
                value={output}
                readOnly
                spellCheck={false}
              />
              {output && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                  aria-label="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="size-3.5 text-green-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            onClick={handleMask}
            disabled={loading || !input.trim()}
            className="gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Masking…" : "Mask It"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {loading ? null : "⌘ Enter to mask"}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </main>
    </div>
  )
}
