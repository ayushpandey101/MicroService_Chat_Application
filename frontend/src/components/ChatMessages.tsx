import { Message } from "@/app/chat/page";
import { User } from "@/context/AppContext";
import Image from "next/image";
import React, { useEffect, useMemo, useRef } from "react";
import moment from "moment";
import { Check, CheckCheck, Trash2 } from "lucide-react";

interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
  isLoading?: boolean;
  onDeleteMessage?: (messageId: string) => Promise<void>;
}

const ChatMessages = ({
  selectedUser,
  messages,
  loggedInUser,
  isLoading = false,
  onDeleteMessage,
}: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const uniqueMessages = useMemo(() => {
    if (!messages) return [];
    const seen = new Set<string>();
    return messages.filter((message) => {
      if (seen.has(message._id)) {
        return false;
      }
      seen.add(message._id);
      return true;
    });
  }, [messages]);

  const groupedMessages = useMemo(() => {
    return uniqueMessages.map((msg, index) => {
      const prev = uniqueMessages[index - 1];
      const showDateSeparator = !prev || !moment(prev.createdAt).isSame(msg.createdAt, "day");
      return {
        ...msg,
        showDateSeparator,
      };
    });
  }, [uniqueMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, uniqueMessages]);

  return (
    <div className="flex-1 overflow-hidden px-2 sm:px-4">
      <div className="h-full max-h-[calc(100vh-250px)] overflow-y-auto p-2 sm:p-3 space-y-2 custom-scroll">
        {!selectedUser ? (
          <div className="text-center mt-20 text-slate-400">
            <p className="text-lg font-semibold">No conversation selected</p>
            <p className="text-sm mt-1">Pick a chat from the left panel to start messaging.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 py-6 animate-pulse">
            <div className="h-10 w-28 bg-slate-800 rounded-full mx-auto" />
            <div className="h-12 w-56 bg-slate-800 rounded-xl" />
            <div className="h-12 w-44 bg-slate-700 rounded-xl ml-auto" />
            <div className="h-12 w-64 bg-slate-800 rounded-xl" />
          </div>
        ) : (
          <>
            {groupedMessages.length === 0 && (
              <div className="text-center mt-20 text-slate-400">
                <p className="text-lg font-semibold">Start the conversation</p>
                <p className="text-sm mt-1">Send your first message and break the silence.</p>
              </div>
            )}

            {groupedMessages.map((msg, i) => {
              const isSentByMe = msg.sender === loggedInUser?._id;
              const uniqueKey = `${msg._id}-${i}`;
              const imageUrl = msg.image?.url;
              const hasValidImageUrl = typeof imageUrl === "string" && imageUrl.trim().length > 0;

              return (
                <React.Fragment key={uniqueKey}>
                  {msg.showDateSeparator && (
                    <div className="sticky top-2 z-10 text-center py-2">
                      <span className="text-[11px] tracking-wide uppercase bg-slate-900/85 border border-white/10 text-slate-300 px-3 py-1 rounded-full">
                        {moment(msg.createdAt).calendar(undefined, {
                          sameDay: "[Today]",
                          lastDay: "[Yesterday]",
                          lastWeek: "dddd",
                          sameElse: "DD MMM YYYY",
                        })}
                      </span>
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 mt-1 w-full ${isSentByMe ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-3 py-2 max-w-[80%] shadow-md ${
                        isSentByMe
                          ? "bg-sky-600 text-white rounded-br-md"
                          : "bg-slate-700 text-white rounded-bl-md"
                      }`}
                    >
                      {isSentByMe && onDeleteMessage && (
                        <div className="flex justify-end mb-1">
                          <button
                            type="button"
                            onClick={() => void onDeleteMessage(msg._id)}
                            className="p-1 rounded hover:bg-black/20 text-white/75 hover:text-white"
                            title="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      {msg.messageType === "image" &&
                        (hasValidImageUrl ? (
                          <div className="relative group max-w-64">
                            <Image
                              src={imageUrl}
                              alt="shared image"
                              width={320}
                              height={320}
                              unoptimized
                              className="w-full h-auto rounded-lg object-cover"
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-red-200">Image unavailable</p>
                        ))}
                      {msg.text && <p className="mt-1 break-words whitespace-pre-wrap">{msg.text}</p>}
                    </div>

                    <div
                      className={`flex items-center gap-1 text-[11px] text-slate-400 ${isSentByMe ? "pr-2 flex-row-reverse" : "pl-2"}`}
                    >
                      <span>{moment(msg.createdAt).format("hh:mm A")}</span>
                      {isSentByMe && (
                        <div className="flex items-center ml-1">
                          {msg.seen ? (
                            <div className="flex items-center text-sky-400 gap-1">
                              <CheckCheck className="w-3 h-3" />
                              {msg.seenAt && <span>{moment(msg.seenAt).format("hh:mm A")}</span>}
                            </div>
                          ) : (
                            <Check className="w-3 h-3 text-slate-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;
