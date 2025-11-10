'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, } from '@/lib/utils';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import { useAIPerformanceTracking } from './performance-monitor';

// Lazy load heavy components
const Artifact = lazy(() => import('./artifact').then(module => ({ default: module.Artifact })));
const MultimodalInput = lazy(() => import('./multimodal-input').then(module => ({ default: module.MultimodalInput })));
const Messages = lazy(() => import('./messages').then(module => ({ default: module.Messages })));

// Loading components
const ArtifactSkeleton = () => (
  <div className="animate-pulse bg-muted rounded-lg h-96 w-full" />
);

const InputSkeleton = () => (
  <div className="animate-pulse bg-muted rounded-lg h-16 w-full" />
);

const MessagesSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={`message-skeleton-${Date.now()}-${i}`} className="animate-pulse">
        <div className="bg-muted rounded-lg h-20 w-full mb-2" />
      </div>
    ))}
  </div>
);

export function ChatOptimized({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session | null;
}) {
  const { trackOperation } = useAIPerformanceTracking();
  const [chatId, setChatId] = useState<string>(id);
  const [selectedChatModel, setSelectedChatModel] = useState<string>(initialChatModel);
  const [selectedVisibilityType, setSelectedVisibilityType] = useState<VisibilityType>(initialVisibilityType);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [votes, setVotes] = useState<Array<Vote>>([]);
  const [isComponentsLoaded, setIsComponentsLoaded] = useState(false);

  const searchParams = useSearchParams();
  const { mutate } = useSWRConfig();

  const {
    visibilityType,
    setVisibilityType,
    saveChat: saveChatVisibility,
  } = useChatVisibility({
    chatId,
    initialVisibilityType: selectedVisibilityType,
  });

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id: chatId,
    body: {
      id: chatId,
      selectedChatModel,
      selectedVisibilityType: visibilityType,
    },
    initialMessages,
    onFinish: (message) => {
      // Track AI response performance
      const perfTracker = trackOperation('ai-response');
      const perfId = perfTracker.start();
      
      // Simulate processing time tracking
      setTimeout(() => {
        perfTracker.end(perfId);
      }, 0);

      if (!isReadonly) {
        saveChatVisibility(message);
        mutate(unstable_serialize(getChatHistoryPaginationKey));
      }
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    },
  });

  const { data: votesData } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${chatId}`,
    fetcher,
  );

  useEffect(() => {
    if (votesData) {
      setVotes(votesData);
    }
  }, [votesData]);

  const { selectedArtifact, setSelectedArtifact } = useArtifactSelector(messages);

  useAutoResume({
    messages,
    isLoading,
    reload,
  });

  // Preload components after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComponentsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Performance optimization: Memoize heavy computations
  const processedMessages = useMemo(() => {
    const perfTracker = trackOperation('message-processing');
    const perfId = perfTracker.start();
    
    const processed = messages.map(message => ({
      ...message,
      // Add any message processing here
    }));
    
    perfTracker.end(perfId);
    return processed;
  }, [messages, trackOperation]);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        chatId={chatId}
        selectedChatModel={selectedChatModel}
        setSelectedChatModel={setSelectedChatModel}
        selectedVisibilityType={visibilityType}
        setSelectedVisibilityType={setVisibilityType}
        isReadonly={isReadonly}
        session={session}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<MessagesSkeleton />}>
              {isComponentsLoaded && (
                <Messages
                  chatId={chatId}
                  messages={processedMessages}
                  votes={votes}
                  setVotes={setVotes}
                  isLoading={isLoading}
                  reload={reload}
                  stop={stop}
                  isReadonly={isReadonly}
                  session={session}
                />
              )}
            </Suspense>
          </div>

          {!isReadonly && (
            <div className="border-t p-4">
              <Suspense fallback={<InputSkeleton />}>
                {isComponentsLoaded && (
                  <MultimodalInput
                    chatId={chatId}
                    input={input}
                    setInput={setInput}
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                    stop={stop}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    messages={messages}
                    setMessages={setMessages}
                    append={append}
                    session={session}
                  />
                )}
              </Suspense>
            </div>
          )}
        </div>

        {selectedArtifact && (
          <div className="w-1/2 border-l">
            <Suspense fallback={<ArtifactSkeleton />}>
              {isComponentsLoaded && (
                <Artifact
                  artifact={selectedArtifact}
                  onClose={() => setSelectedArtifact(null)}
                />
              )}
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}

// Export both versions for flexibility
export { Chat as ChatOriginal } from './chat';
export default ChatOptimized;