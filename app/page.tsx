import Chatbox from "@/components/chatbox";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white dark:bg-[#212121] p-4">
      {/* Header minimalista estilo ChatGPT */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
          PmDevOps
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Fullstack Developer · Asistente Virtual
        </p>
      </div>
      
      {/* Chatbox */}
      <Chatbox />
      
      {/* Footer minimalista */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          +4 años experiencia · +35 proyectos completados
        </p>
      </div>
    </div>
  );
}
