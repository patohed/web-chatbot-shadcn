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
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative">
        <FormField
          control={form.control}
          name="mensaje"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Enviar mensaje..."
                    className="min-h-[52px] max-h-[200px] pr-12 text-gray-900 dark:text-gray-100 bg-white dark:bg-[#2f2f2f] border border-gray-300 dark:border-[#404040] rounded-xl px-4 py-3 resize-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400 focus-visible:border-emerald-500 dark:focus-visible:border-emerald-400 focus-visible:ring-offset-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 hover:border-gray-400 dark:hover:border-[#4a4a4a]"
                    disabled={isDisabled}
                    {...field}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                      }
                    }}
                  />
                  <Button 
                    type="submit" 
                    size="sm"
                    className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border-none shadow-none" 
                    disabled={isDisabled || !field.value.trim()}
                  >
                    <CircleArrowUp className="w-5 h-5" />
                  </Button>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
