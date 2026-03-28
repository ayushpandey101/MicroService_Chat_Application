import { Chats, User } from "@/context/AppContext";
import Image from "next/image";
import {
  CornerDownRight,
  CornerUpLeft,
  Trash2,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  UserCircle,
  X,
} from "lucide-react";
import NextLink from "next/link";
import React, { useMemo, useState } from "react";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUser: boolean;
  setShowAllUser: (show: boolean | ((prev: boolean) => boolean)) => void;
  users: User[] | null;
  loggedInUser: User | null;
  chats: Chats[] | null;
  selectedUser: string | null;
  setSelectedUser: (userId: string | null) => void;
  handleLogout: () => void;
  createChat: (u: User) => void;
  deleteChat: (chatId: string) => Promise<void>;
  onlineUsers: string[];
}

const ChatSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  showAllUser,
  setShowAllUser,
  users,
  loggedInUser,
  chats,
  selectedUser,
  handleLogout,
  setSelectedUser,
  createChat,
  deleteChat,
  onlineUsers,
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const query = searchQuery.trim().toLowerCase();

    return users.filter(
      (u) =>
        u._id !== loggedInUser?._id &&
        (!query || u.name.toLowerCase().includes(query)),
    );
  }, [users, loggedInUser?._id, searchQuery]);

  const filteredChats = useMemo(() => {
    if (!chats) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return chats;

    return chats.filter((chat) => {
      const usernameMatch = chat.user.name.toLowerCase().includes(query);
      const latestTextMatch = chat.chat.latestMessage?.text?.toLowerCase().includes(query);
      return usernameMatch || latestTextMatch;
    });
  }, [chats, searchQuery]);

  return (
    <aside
      className={`fixed z-30 sm:static top-0 left-0 h-screen w-80 bg-slate-950/95 border-r border-white/10 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 transition-transform duration-300 flex flex-col backdrop-blur-xl`}
    >
      <div className="p-5 border-b border-white/10">
        <div className="sm:hidden flex justify-end mb-0">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-200" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-600 rounded-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {showAllUser ? "New Chat" : "Messages"}
            </h2>
          </div>

          <button
            className={`p-2.5 rounded-lg transition-colors ${showAllUser ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
            onClick={() => {
              setShowAllUser((prev) => !prev);
              setSearchQuery("");
            }}
          >
            {showAllUser ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 py-2">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={showAllUser ? "Search users..." : "Search chats..."}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 rounded-lg focus:outline-none focus:border-sky-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {showAllUser ? (
          <div className="space-y-4 h-full">
            <div className="space-y-2 overflow-y-auto h-full pb-4 custom-scroll">
              {filteredUsers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => createChat(u)}
                    className="w-full text-left p-4 rounded-lg border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
                          {u.avatar?.url ? (
                            <Image
                              src={u.avatar.url}
                              alt={u.name}
                              width={36}
                              height={36}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserCircle className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        {onlineUsers.includes(u._id) && (
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-white">{u.name}</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {onlineUsers.includes(u._id) ? "Online" : "Offline"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

              {filteredUsers.length === 0 && (
                <div className="text-center text-slate-400 text-sm py-8">
                  No users matched your search.
                </div>
              )}
            </div>
          </div>
        ) : chats && chats.length > 0 ? (
          <div className="space-y-3 h-full overflow-auto pb-4 custom-scroll">
            {filteredChats.map((chat) => {
              const latestMessage = chat.chat.latestMessage;
              const isSelected = selectedUser === chat.chat._id;
              const isSentByMe = latestMessage?.sender === loggedInUser?._id;
              const unseenCount = chat.chat.unseenCount || 0;

              return (
                <div
                  key={chat.chat._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedUser(chat.chat._id);
                    setSidebarOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedUser(chat.chat._id);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${isSelected ? "bg-sky-600/30 border border-sky-500" : "border border-slate-700 hover:border-slate-500 hover:bg-slate-800/40"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                        {chat.user.avatar?.url ? (
                          <Image
                            src={chat.user.avatar.url}
                            alt={chat.user.name}
                            width={48}
                            height={48}
                            unoptimized
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle className="w-7 h-7 text-slate-300" />
                        )}
                        {onlineUsers.includes(chat.user._id) && (
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-semibold truncate ${isSelected ? "text-white" : "text-slate-200"}`}
                        >
                          {chat.user.name}
                        </span>
                        {unseenCount > 0 && (
                          <div className="bg-rose-600 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-2">
                            {unseenCount > 99 ? "99+" : unseenCount}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteChat(chat.chat._id);
                          }}
                          className="ml-2 p-1.5 rounded-md hover:bg-rose-600/25 text-slate-400 hover:text-rose-300"
                          title="Delete chat"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {latestMessage && (
                        <div className="flex items-center gap-2">
                          {isSentByMe ? (
                            <CornerUpLeft
                              size={14}
                              className="text-sky-400 shrink-0"
                            />
                          ) : (
                            <CornerDownRight
                              size={14}
                              className="text-emerald-400 shrink-0"
                            />
                          )}
                          <span className="text-sm text-slate-400 truncate flex-1">
                            {latestMessage.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredChats.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-8">
                No chats matched your search.
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-slate-800 rounded-full mb-4">
              <MessageCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 font-medium">No conversation yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Start a new conversation
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 space-y-2">
        <NextLink
          href={"/profile"}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <div className="p-1.5 bg-slate-700 rounded-lg">
            <UserCircle className="w-4 h-4 text-slate-300" />
          </div>
          <span className="font-medium text-slate-300">Profile</span>
        </NextLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-rose-600 transition-colors text-rose-500 hover:text-white"
        >
          <div className="p-1.5 bg-rose-600 rounded-lg">
            <LogOut className="w-4 h-4 text-slate-200" />
          </div>
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
