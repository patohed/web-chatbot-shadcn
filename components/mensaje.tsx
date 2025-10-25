"use client"

import { UserIcon, BotIcon, Loader } from "lucide-react";
import Markdown from "react-markdown";

interface MensajeProps {
  mensaje: string;
  esIA: boolean;
  isLoading?: boolean;
}

export default function Mensaje({ mensaje, esIA, isLoading = false }: MensajeProps) {
  return (
    <div className={`flex w-full py-4 px-2 ${!esIA ? "flex-row-reverse" : ""} animate-in fade-in duration-300`}>
      <div className="flex max-w-[85%] gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          esIA 
            ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30" 
            : "bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600/30"
        }`}>
          {esIA ? (
            <BotIcon className="w-5 h-5 text-purple-400" />
          ) : (
            <UserIcon className="w-5 h-5 text-gray-300" />
          )}
        </div>
        <div className={`flex-1 rounded-2xl px-4 py-3 ${
          esIA
            ? "bg-zinc-900/50 border border-zinc-800/50 text-gray-100"
            : "bg-zinc-800/80 border border-zinc-700/50 text-gray-100"
        }`}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-sm text-gray-400">Escribiendo...</span>
            </div>
          ) : (
            <>
              {esIA ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <Markdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <strong className="text-purple-400 font-semibold">{children}</strong>,
                      code: ({ children }) => <code className="bg-black/50 px-1.5 py-0.5 rounded text-purple-300 text-sm">{children}</code>,
                    }}
                  >
                    {mensaje}
                  </Markdown>
                </div>
              ) : (
                <p className="leading-relaxed">{mensaje}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
