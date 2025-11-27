import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatbotApi } from "@/services/api";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "¡Hola! Soy tu asistente virtual del Sistema Electoral Perú 2025. ¿En qué puedo ayudarte? Puedes preguntarme sobre cómo votar, cómo iniciar sesión, o cualquier duda sobre el sistema.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const messageText = inputValue.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await chatbotApi.sendMessage(messageText);
      
      if (response.success && response.data) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.data.response,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.error || "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-300",
          isOpen && "scale-90"
        )}
        size="icon"
        aria-label="Abrir chatbot"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Panel de chat */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[600px] shadow-2xl z-40 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Asistente Virtual</CardTitle>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sistema Electoral Perú 2025
            </p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
            {/* Área de mensajes */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 py-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!message.isUser && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg px-4 py-2 break-words",
                        message.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                        {message.text}
                      </p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {message.isUser && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de mensaje - Fijo en la parte inferior */}
            <div className="border-t p-4 flex-shrink-0 bg-background">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
