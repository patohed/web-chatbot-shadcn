import Chatbox from "@/components/chatbox";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-black p-4">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-3">
          PmDevOps
        </h1>
        <h2 className="text-xl text-gray-300 font-semibold mb-2">Fullstack Developer</h2>
        <p className="text-gray-400 text-sm">Asistente Virtual de Ventas</p>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            En línea
          </span>
          <span>·</span>
          <span>+4 años experiencia</span>
          <span>·</span>
          <span>+35 proyectos</span>
        </div>
      </div>
      <Chatbox />
    </div>
  );
}
