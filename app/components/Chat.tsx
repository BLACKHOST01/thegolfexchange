// /components/Chat.tsx
"use client";
import React, { useEffect, useState } from "react";

export default function Chat({ otherId }: { otherId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  async function load() {
    const res = await fetch(`/api/messages/thread?otherId=${otherId}`, { headers: { "x-user-id": "demo-user-id" } });
    const data = await res.json();
    setMessages(data);
  }

  useEffect(() => { load(); }, [otherId]);

  async function send() {
    if (!text.trim()) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "demo-user-id" },
      body: JSON.stringify({ receiverId: otherId, content: text }),
    });
    setText("");
    load();
  }

  return (
    <div className="p-4 border rounded max-w-xl">
      <div className="h-64 overflow-y-auto mb-3">
        {messages.map((m) => (
          <div key={m.id} className={`mb-2 ${m.senderId === "demo-user-id" ? "text-right" : "text-left"}`}>
            <div className="inline-block p-2 rounded bg-gray-100">{m.content}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 border p-2" placeholder="Message..." />
        <button onClick={send} className="px-4 py-2 bg-black text-white rounded">Send</button>
      </div>
    </div>
  );
}
