"use client"

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CircleArrowUp } from "lucide-react";

const formSchema = z.object({
  mensaje: z.string().min(2),
});

interface ChatFormProps {
  setChatGPT: (content: string) => void;
  isDisabled?: boolean;
}

export default function ChatForm({ setChatGPT, isDisabled = false }: ChatFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mensaje: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setChatGPT(values.mensaje);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-3 items-end">
        <FormField
          control={form.control}
          name="mensaje"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Textarea
                  placeholder="Escribe tu consulta aquí... (Shift + Enter para nueva línea)"
                  className="min-h-[56px] max-h-[200px] text-gray-100 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl px-4 py-3 resize-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 focus-visible:ring-offset-0 placeholder:text-gray-500 transition-all duration-200 hover:border-zinc-700/50"
                  disabled={isDisabled}
                  {...field}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border border-purple-500/30 shadow-lg shadow-purple-500/20" 
          disabled={isDisabled}
        >
          <CircleArrowUp className="w-6 h-6" />
        </Button>
      </form>
    </Form>
  );
}
