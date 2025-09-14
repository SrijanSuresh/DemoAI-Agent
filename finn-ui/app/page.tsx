"use client"

import type React from "react"
import { useState } from "react"
import { Activity, Dumbbell, Heart, Zap } from "lucide-react"

function isErrorResp(data: unknown): data is { error: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error?: unknown }).error === "string"
  )
}

type Citation = { title: string; source: string; chunk_id: string }
type Safety = { crisis: boolean; out_of_scope: boolean }
type BotResp = { reply: string; citations: Citation[]; safety: Safety }
type MessageType = { role: "user" | "assistant"; text: string; citations?: Citation[]; safety?: Safety }

const fitnessPrompts = [
  "How can I build muscle effectively?",
  "What's the best cardio for fat loss?",
  "How do I improve my sleep quality?",
  "What should I eat before a workout?",
  "How can I stay motivated to exercise?",
  "What's a good beginner workout routine?",
]

export default function Page() {
  const [input, setInput] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [messages, setMessages] = useState<MessageType[]>([])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput("")
    setMessages((m: MessageType[]) => [...m, { role: "user", text: q }])
    setLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      })
      const data: BotResp | { error?: string } = await res.json()
      if (!res.ok || isErrorResp(data)) {
        throw new Error(isErrorResp(data) ? data.error : "chat_failed")
      }
      const { reply, citations, safety } = data as BotResp
      setMessages((m: MessageType[]) => [...m, { role: "assistant", text: reply, citations, safety }])
    } catch (e) {
      let errorMsg = "failed"
      if (e && typeof e === "object" && "message" in e) {
        errorMsg = (e as Error).message
      } else if (typeof e === "string") {
        errorMsg = e
      }
      setMessages((m: MessageType[]) => [...m, { role: "assistant", text: `Error: ${errorMsg}` }])
    } finally {
      setLoading(false)
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handlePromptClick(prompt: string) {
    setInput(prompt)
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header
        className="px-6 py-6 text-white shadow-lg"
        style={{
          background: "linear-gradient(to right, #ea580c, #f97316)",
          backgroundColor: "#ea580c", // fallback
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Finn — Your AI Fitness Coach</h1>
          </div>
          <p className="text-white/90 text-sm">
            Get personalized fitness advice with evidence-based answers and citations. No medical diagnosis.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Ready to transform your fitness?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ask me anything about workouts, nutrition, recovery, or wellness. I'll provide evidence-based answers to
                help you reach your goals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <Activity className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-card-foreground">Personalized</h3>
                <p className="text-sm text-muted-foreground">Tailored advice for your fitness level</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
                <h3 className="font-semibold text-card-foreground">Evidence-Based</h3>
                <p className="text-sm text-muted-foreground">Backed by scientific research</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-card-foreground">Holistic</h3>
                <p className="text-sm text-muted-foreground">Mind, body, and wellness focused</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Popular questions:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fitnessPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(prompt)}
                    className="text-left p-4 bg-card hover:bg-accent/10 border border-border rounded-xl transition-colors group"
                  >
                    <span className="text-card-foreground group-hover:text-accent transition-colors">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m: MessageType, i: number) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-3xl ${m.role === "user" ? "ml-auto" : ""}`}>
              <div
                className={`rounded-2xl px-6 py-4 shadow-sm ${
                  m.role === "user" ? "bg-primary text-primary-foreground ml-12" : "bg-card border border-border mr-12"
                }`}
              >
                <div className="whitespace-pre-wrap text-balance">{m.text}</div>
                {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Sources:</div>
                    <ul className="space-y-1">
                      {m.citations.map((c: Citation, idx: number) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                          <span>
                            {c.title} <span className="text-muted-foreground/70">({c.chunk_id})</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {m.role === "assistant" && m.safety && (
                  <div className="mt-3 flex gap-2">
                    {m.safety.crisis && (
                      <span className="text-xs px-3 py-1 bg-destructive/10 text-destructive rounded-full border border-destructive/20">
                        crisis
                      </span>
                    )}
                    {m.safety.out_of_scope && (
                      <span className="text-xs px-3 py-1 bg-accent/10 text-accent rounded-full border border-accent/20">
                        limited scope
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-6 py-4 mr-12">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-muted-foreground text-sm">Finn is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="p-4 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about workouts, nutrition, recovery, or wellness..."
            className="flex-1 border border-border rounded-xl px-4 py-3 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                Thinking...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
      </footer>
    </main>
  )
}
