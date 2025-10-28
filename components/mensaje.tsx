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
    <div className={`w-full border-b border-gray-100 dark:border-[#2f2f2f] ${
      esIA ? "bg-white dark:bg-[#212121]" : "bg-gray-50 dark:bg-[#2a2a2a]"
    }`}>
      <div className="max-w-3xl mx-auto px-4 py-6 flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {esIA ? (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-600 dark:bg-gray-700 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {esIA ? "PmDevOps" : "Tú"}
          </div>
          
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Escribiendo...</span>
            </div>
          ) : (
            <>
              {esIA ? (
                <div className="prose prose-gray dark:prose-invert prose-sm max-w-none">
                  <Markdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-3 last:mb-0 leading-7 text-gray-800 dark:text-gray-200">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc ml-5 mb-3 space-y-1 text-gray-800 dark:text-gray-200">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal ml-5 mb-3 space-y-1 text-gray-800 dark:text-gray-200">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-7">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900 dark:text-white">
                          {children}
                        </strong>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-100 dark:bg-[#2f2f2f] px-1.5 py-0.5 rounded text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-gray-100 dark:bg-[#2f2f2f] p-4 rounded-lg overflow-x-auto mb-3">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {mensaje}
                  </Markdown>
                </div>
              ) : (
                <p className="leading-7 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {mensaje}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
