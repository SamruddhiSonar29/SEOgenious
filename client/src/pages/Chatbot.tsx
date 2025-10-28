import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@shared/schema';

export default function Chatbot() {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/messages'],
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest('POST', '/api/chat/send', { message: text });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      setMessage('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message.trim());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
          SEO AI Assistant
        </h1>
        <p className="text-muted-foreground mt-2">
          Ask me anything about SEO, keyword research, content optimization, and more
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Bot className="w-16 h-16 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                <p className="text-muted-foreground max-w-md">
                  Ask me about keyword strategies, content optimization tips, technical SEO, or any SEO-related questions.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full mt-4">
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4"
                  onClick={() => setMessage('What are the best practices for keyword research?')}
                  data-testid="suggestion-keyword-research"
                >
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Keyword Research</div>
                    <div className="text-muted-foreground">Best practices and strategies</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4"
                  onClick={() => setMessage('How can I improve my content for SEO?')}
                  data-testid="suggestion-content-seo"
                >
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Content Optimization</div>
                    <div className="text-muted-foreground">Tips to improve rankings</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4"
                  onClick={() => setMessage('What is technical SEO and why is it important?')}
                  data-testid="suggestion-technical-seo"
                >
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Technical SEO</div>
                    <div className="text-muted-foreground">Core concepts explained</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4"
                  onClick={() => setMessage('How do I analyze my competitors\' SEO strategy?')}
                  data-testid="suggestion-competitor-analysis"
                >
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Competitor Analysis</div>
                    <div className="text-muted-foreground">Understanding the competition</div>
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${msg.role}-${msg.id}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              placeholder="Ask me about SEO..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="resize-none min-h-[60px]"
              disabled={sendMutation.isPending}
              data-testid="input-message"
            />
            <Button
              type="submit"
              size="icon"
              className="h-[60px] w-[60px] flex-shrink-0"
              disabled={!message.trim() || sendMutation.isPending}
              data-testid="button-send"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
          {sendMutation.isPending && (
            <p className="text-sm text-muted-foreground mt-2">AI is thinking...</p>
          )}
        </div>
      </Card>
    </div>
  );
}
