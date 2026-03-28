import { User } from "@/context/AppContext";
import Image from "next/image";
import { Menu, UserCircle } from "lucide-react";
import React from "react";

interface ChatHeaderProps {
  user: User | null;
  isTyping: boolean;
  setSidebarOpen: (open: boolean) => void;
  onlineUsers: string[];
}

const ChatHeader = ({
  user,
  isTyping,
  setSidebarOpen,
  onlineUsers,
}: ChatHeaderProps) => {
  const isOnlineUser = user && onlineUsers.includes(user._id);

  return (
    <>
      <div className="sm:hidden fixed top-4 right-4 z-40">
        <button
          className="p-3 bg-slate-800/90 backdrop-blur rounded-lg hover:bg-slate-700 transition-colors border border-white/10"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5 text-slate-100" />
        </button>
      </div>

      <div className="border-b border-white/10 p-4 sm:p-5 bg-slate-900/70">
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-700 flex items-center justify-center ring-2 ring-white/10">
                  {user.avatar?.url ? (
                    <Image
                      src={user.avatar.url}
                      alt={user.name}
                      width={56}
                      height={56}
                      unoptimized
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-7 h-7 sm:w-8 sm:h-8 text-slate-200" />
                  )}
                </div>
                {isOnlineUser && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 border-2 border-slate-900">
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                    {user.name}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {isTyping ? (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex gap-1">
                        <div
                          className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"
                          style={{ animationDelay: "120ms" }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"
                          style={{ animationDelay: "240ms" }}
                        ></div>
                      </div>
                      <span className="text-sky-400 font-medium">
                        Typing...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${isOnlineUser ? "bg-emerald-500" : "bg-slate-400"}`}
                      ></div>
                      <span
                        className={`text-sm font-medium ${isOnlineUser ? "text-emerald-400" : "text-slate-400"}`}
                      >
                        {isOnlineUser ? "Online now" : "Last seen recently"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-700 flex items-center justify-center">
                <UserCircle className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-300">
                  Ready to chat
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Select someone from the sidebar to start a conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHeader;
