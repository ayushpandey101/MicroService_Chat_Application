"use client";

import ChatSidebar from "@/components/ChatSidebar";
import Loading from "@/components/Loading";
import { chat_service, useAppData, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import axios from "axios";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import MessageInput from "@/components/MessageInput";
import { SocketData } from "@/context/SocketContext";

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

interface SeenEventPayload {
  chatId: string;
  seenBy: string;
  messageIds?: string[];
}

interface TypingEventPayload {
  chatId: string;
  userId: string;
}

interface MessageDeletedPayload {
  messageId: string;
  chatId: string;
}

interface ChatDeletedPayload {
  chatId: string;
}

const ChatApp = () => {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
    setChats,
  } = useAppData();

  const { onlineUsers, socket } = SocketData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAllUser, setShowAllUser] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, loading, router]);

  const handleLogout = () => {
    logoutUser();
  };

  const fetchChat = useCallback(
    async (chatId: string, silent = false) => {
      const token = Cookies.get("token");
      if (!token) return;

      if (!silent) {
        setIsMessagesLoading(true);
      }

      try {
        const { data } = await axios.get(`${chat_service}/api/v1/message/${chatId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMessages(data.messages);
        setUser(data.user);
        await fetchChats();
      } catch {
        toast.error("Failed to fetch messages");
      } finally {
        if (!silent) {
          setIsMessagesLoading(false);
        }
      }
    },
    [fetchChats],
  );

  const moveChatToTop = useCallback(
    (
      chatId: string,
      newMessage: Message | { text?: string; sender?: string },
      shouldUpdateUnseenCount = true,
    ) => {
      setChats((prev) => {
        if (!prev) return null;

        const updatedChats = [...prev];
        const chatIndex = updatedChats.findIndex((chat) => chat._id === chatId);

        if (chatIndex !== -1) {
          const [moveChat] = updatedChats.splice(chatIndex, 1);
          const updatedChat = {
            ...moveChat,
            chat: {
              ...moveChat.chat,
              latestMessage: {
                text: newMessage.text || "",
                sender: newMessage.sender || moveChat.chat.latestMessage?.sender || "",
              },
              updatedAt: new Date().toString(),
              unseenCount:
                shouldUpdateUnseenCount && newMessage.sender !== loggedInUser?._id
                  ? (moveChat.chat.unseenCount || 0) + 1
                  : moveChat.chat.unseenCount || 0,
            },
          };
          updatedChats.unshift(updatedChat);
        }

        return updatedChats;
      });
    },
    [loggedInUser?._id, setChats],
  );

  const resetUnseenCount = useCallback(
    (chatId: string) => {
      setChats((prev) => {
        if (!prev) return null;

        return prev.map((chat) => {
          if (chat._id === chatId) {
            return {
              ...chat,
              chat: {
                ...chat.chat,
                unseenCount: 0,
              },
            };
          }
          return chat;
        });
      });
    },
    [setChats],
  );

  const selectedChat = useMemo(() => {
    if (!chats || !selectedUser) return null;
    return chats.find((c) => c.chat._id === selectedUser) || null;
  }, [chats, selectedUser]);

  const handleSelectUser = useCallback(
    (chatId: string | null) => {
      setSelectedUser(chatId);
      if (chatId) {
        void fetchChat(chatId, true);
      }
    },
    [fetchChat],
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      const token = Cookies.get("token");
      if (!token) return;

      try {
        await axios.delete(`${chat_service}/api/v1/message/${messageId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMessages((prev) => {
          if (!prev) return prev;
          return prev.filter((m) => m._id !== messageId);
        });

        await fetchChats();
        toast.success("Message deleted");
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message || "Failed to delete message");
          return;
        }
        toast.error("Failed to delete message");
      }
    },
    [fetchChats],
  );

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      const token = Cookies.get("token");
      if (!token) return;

      try {
        await axios.delete(`${chat_service}/api/v1/chats/${chatId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setChats((prev) => {
          if (!prev) return prev;
          return prev.filter((c) => c.chat._id !== chatId);
        });

        if (selectedUser === chatId) {
          setSelectedUser(null);
          setMessages(null);
          setUser(null);
          setIsTyping(false);
        }

        await fetchChats();
        toast.success("Chat deleted");
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message || "Failed to delete chat");
          return;
        }
        toast.error("Failed to delete chat");
      }
    },
    [fetchChats, selectedUser, setChats],
  );

  const handleMessageSend = async (
    e: React.FormEvent<HTMLFormElement>,
    imageFile?: File | null,
  ): Promise<void> => {
    e.preventDefault();

    if ((!message.trim() && !imageFile) || !selectedUser) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socket?.emit("stopTyping", {
      chatId: selectedUser,
      userId: loggedInUser?._id,
    });

    const token = Cookies.get("token");
    if (!token) return;

    try {
      const formData = new FormData();

      formData.append("chatId", selectedUser);
      if (message.trim()) {
        formData.append("text", message);
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const { data } = await axios.post(`${chat_service}/api/v1/message`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessages((prev) => {
        const currentMessages = prev || [];
        const messageExists = currentMessages.some((msg) => msg._id === data.message._id);

        if (!messageExists) {
          return [...currentMessages, data.message];
        }
        return currentMessages;
      });

      setMessage("");

      const displayText = imageFile ? "Image sent" : message.trim();
      moveChatToTop(
        selectedUser,
        {
          text: displayText,
          sender: loggedInUser?._id || data.message.sender,
        },
        false,
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const rawMessage = error.response?.data?.message;
        const normalizedMessage =
          typeof rawMessage === "string"
            ? rawMessage
            : typeof rawMessage === "object" && rawMessage !== null
              ? JSON.stringify(rawMessage)
              : "Failed to send message";
        toast.error(normalizedMessage);
        return;
      }
      toast.error("Failed to send message");
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!selectedUser || !socket) return;

    if (value.trim()) {
      socket.emit("typing", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }, 1500);
  };

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (incomingMessage: Message) => {
      if (selectedUser === incomingMessage.chatId) {
        setMessages((prev) => {
          const currentMessages = prev || [];
          const messageExists = currentMessages.some((msg) => msg._id === incomingMessage._id);

          if (!messageExists) {
            return [...currentMessages, incomingMessage];
          }
          return currentMessages;
        });

        moveChatToTop(incomingMessage.chatId, incomingMessage, false);
      } else {
        moveChatToTop(incomingMessage.chatId, incomingMessage, true);
      }
    };

    const onMessagesSeen = (data: SeenEventPayload) => {
      if (selectedUser === data.chatId) {
        setMessages((prev) => {
          if (!prev) return null;
          return prev.map((msg) => {
            if (msg.sender === loggedInUser?._id && data.messageIds?.includes(msg._id)) {
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toString(),
              };
            }
            if (msg.sender === loggedInUser?._id && !data.messageIds) {
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toString(),
              };
            }
            return msg;
          });
        });
      }
    };

    const onUserTyping = (data: TypingEventPayload) => {
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(true);
      }
    };

    const onUserStoppedTyping = (data: TypingEventPayload) => {
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(false);
      }
    };

    const onMessageDeleted = (payload: MessageDeletedPayload) => {
      if (payload.chatId !== selectedUser) return;
      setMessages((prev) => {
        if (!prev) return prev;
        return prev.filter((m) => m._id !== payload.messageId);
      });
    };

    const onChatDeleted = (payload: ChatDeletedPayload) => {
      setChats((prev) => {
        if (!prev) return prev;
        return prev.filter((c) => c.chat._id !== payload.chatId);
      });

      if (selectedUser === payload.chatId) {
        setSelectedUser(null);
        setMessages(null);
        setUser(null);
        setIsTyping(false);
        toast("This chat was deleted", { icon: "ℹ️" });
      }
    };

    socket.on("newMessage", onNewMessage);
    socket.on("messagesSeen", onMessagesSeen);
    socket.on("userTyping", onUserTyping);
    socket.on("userStoppedTyping", onUserStoppedTyping);
    socket.on("messageDeleted", onMessageDeleted);
    socket.on("chatDeleted", onChatDeleted);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("messagesSeen", onMessagesSeen);
      socket.off("userTyping", onUserTyping);
      socket.off("userStoppedTyping", onUserStoppedTyping);
      socket.off("messageDeleted", onMessageDeleted);
      socket.off("chatDeleted", onChatDeleted);
    };
  }, [socket, selectedUser, loggedInUser?._id, moveChatToTop, setChats]);

  useEffect(() => {
    if (!selectedUser) return;

    void fetchChat(selectedUser);
    setIsTyping(false);
    resetUnseenCount(selectedUser);

    socket?.emit("joinChat", selectedUser);

    return () => {
      socket?.emit("leaveChat", selectedUser);
      setMessages(null);
    };
  }, [selectedUser, socket, fetchChat, resetUnseenCount]);

  useEffect(() => {
    if (!chats || chats.length === 0 || selectedUser) return;

    const savedChat = typeof window !== "undefined" ? localStorage.getItem("activeChatId") : null;
    const chatToOpen = chats.find((c) => c.chat._id === savedChat)?.chat._id || chats[0].chat._id;
    setSelectedUser(chatToOpen);
  }, [chats, selectedUser]);

  useEffect(() => {
    if (!selectedUser || typeof window === "undefined") return;
    localStorage.setItem("activeChatId", selectedUser);
  }, [selectedUser]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  async function createChat(u: User) {
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        `${chat_service}/api/v1/chats/new`,
        { userId: loggedInUser?._id, otherUserId: u._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      handleSelectUser(data.chatId);
      setShowAllUser(false);
      await fetchChats();
    } catch {
      toast.error("Failed to start chat");
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.22),_transparent_52%),linear-gradient(180deg,_#030712_0%,_#111827_65%,_#0f172a_100%)] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:44px_44px] opacity-25" />
      <div className="relative min-h-screen flex">
        <ChatSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          showAllUser={showAllUser}
          setShowAllUser={setShowAllUser}
          users={users}
          loggedInUser={loggedInUser}
          chats={chats}
          selectedUser={selectedUser}
          setSelectedUser={handleSelectUser}
          handleLogout={handleLogout}
          createChat={createChat}
          deleteChat={handleDeleteChat}
          onlineUsers={onlineUsers}
        />

        <div className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6">
          <div className="flex-1 rounded-2xl border border-white/15 bg-slate-950/55 backdrop-blur-xl shadow-[0_24px_70px_-45px_rgba(14,165,233,0.85)] flex flex-col overflow-hidden">
            <ChatHeader
              user={user}
              setSidebarOpen={setSidebarOpen}
              isTyping={isTyping}
              onlineUsers={onlineUsers}
            />

            <ChatMessages
              selectedUser={selectedUser}
              messages={messages}
              loggedInUser={loggedInUser}
              isLoading={isMessagesLoading}
              onDeleteMessage={handleDeleteMessage}
            />

            <MessageInput
              selectedUser={selectedUser}
              message={message}
              setMessage={handleTyping}
              handleMessageSend={handleMessageSend}
            />
          </div>

          {selectedChat && (
            <div className="px-2 pt-3 text-xs text-slate-300/85">
              <span className="font-semibold text-sky-300">Active chat:</span> {selectedChat.user.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
