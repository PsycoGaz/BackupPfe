import { useState } from 'react';
import { chatService } from '../services/chat.service';
import { ChatResponse } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
}

export function ChatAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response: ChatResponse = await chatService.sendMessage(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.message,
          data: response.data,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erreur lors de la communication avec l\'assistant.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Assistant IA</h1>

      {/* Chat messages */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <p className="text-lg">Bonjour ! Je suis votre assistant formation.</p>
            <p className="text-sm mt-2">Exemples :</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>"Je veux faire une formation React en juillet"</li>
              <li>"Recommande-moi des formations en DevOps"</li>
              <li>"Aide-moi à écrire une justification pour une formation NestJS"</li>
            </ul>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              {msg.data && msg.data.recommendations && (
                <ul className="mt-2 space-y-1">
                  {msg.data.recommendations.map((rec: any, i: number) => (
                    <li key={i} className="text-sm bg-white rounded p-2 text-gray-700">
                      <strong>{rec.name}</strong> - {rec.domain}
                      {rec.reason && <p className="text-xs text-gray-500">{rec.reason}</p>}
                    </li>
                  ))}
                </ul>
              )}
              {msg.data && msg.data.justification && (
                <div className="mt-2 bg-white rounded p-2 text-gray-700 text-sm">
                  {msg.data.justification}
                </div>
              )}
              {msg.data && msg.data.formationName && (
                <div className="mt-2 bg-white rounded p-2 text-gray-700 text-xs">
                  <p><strong>Formation :</strong> {msg.data.formationName}</p>
                  {msg.data.domain && <p><strong>Domaine :</strong> {msg.data.domain}</p>}
                  {msg.data.desiredStartDate && (
                    <p><strong>Date :</strong> {msg.data.desiredStartDate}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500">
              En train de réfléchir...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tapez votre message..."
          className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-violet-600 text-white px-6 py-2 rounded-md hover:bg-violet-700 disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
