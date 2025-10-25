"use client"

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface LeadFormProps {
  onSubmit: (data: {
    nombre: string;
    email: string;
    telefono?: string;
    proyecto: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  proyecto?: string; // Si ya se mencionó en la conversación
}

export default function LeadForm({ onSubmit, onCancel, isLoading, proyecto }: LeadFormProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [proyectoDesc, setProyectoDesc] = useState(proyecto || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nombre,
      email,
      telefono: telefono || undefined,
      proyecto: proyectoDesc,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-500/10 animate-in slide-in-from-bottom-4 duration-300">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
            <span className="text-3xl">🎯</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">¡Excelente elección!</h3>
          <p className="text-gray-400 text-sm">
            Completá tus datos para que podamos contactarte y avanzar con tu proyecto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre" className="text-gray-300 mb-2 block">
              Nombre completo *
            </Label>
            <Input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Pérez"
              required
              disabled={isLoading}
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-gray-600 focus:border-purple-500"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-300 mb-2 block">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@ejemplo.com"
              required
              disabled={isLoading}
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-gray-600 focus:border-purple-500"
            />
          </div>

          <div>
            <Label htmlFor="telefono" className="text-gray-300 mb-2 block">
              Teléfono (opcional)
            </Label>
            <Input
              id="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+54 9 11 1234-5678"
              disabled={isLoading}
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-gray-600 focus:border-purple-500"
            />
          </div>

          <div>
            <Label htmlFor="proyecto" className="text-gray-300 mb-2 block">
              Descripción del proyecto *
            </Label>
            <Textarea
              id="proyecto"
              value={proyectoDesc}
              onChange={(e) => setProyectoDesc(e.target.value)}
              placeholder="Describe brevemente tu proyecto..."
              required
              disabled={isLoading}
              rows={3}
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-gray-600 focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              variant="outline"
              className="flex-1 bg-transparent border-zinc-700 text-gray-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg shadow-purple-500/30"
            >
              {isLoading ? "Enviando..." : "Enviar información"}
            </Button>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          * Campos obligatorios
        </p>
      </div>
    </div>
  );
}
