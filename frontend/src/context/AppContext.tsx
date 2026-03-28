"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast, {Toaster} from "react-hot-toast";


export const user_service = "http://localhost:5000";
export const chat_service = "http://localhost:5002";

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: {
    url: string;
    publicId: string;
  };
}

export interface chat {
  _id: string;
  users: string[];
  latestMessage: {
    text: string;
    sender: string;
  };
  createdAt: string;
  updatedAt: string;
  unseenCount?: number;
}

export interface Chats {
  _id: string;
  user: User;
  chat: chat;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  logoutUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchChats: () => Promise<void>;
  chats: Chats[] | null;
  users: User[] | null;
  setChats: React.Dispatch<React.SetStateAction<Chats[] | null>>;
  //setUsers: React.Dispatch<React.SetStateAction<User[] | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    const token = Cookies.get("token");
    if (!token) {
      setIsAuth(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.get(`${user_service}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data);
      setIsAuth(true);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      setUser(null);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const logoutUser = useCallback(async () => {
    Cookies.remove("token");
    setUser(null);
    setIsAuth(false);
    toast.success("Logged out successfully");
  }, []);

  const [chats, setChats] = useState<Chats[] | null>(null);
  const fetchChats = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      return;
    }
    try {
      const {data} = await axios.get(`${chat_service}/api/v1/chats/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChats(data.chats);
    } catch (error) {
      console.error("Failed to fetch chats", error);
    }
  }, []);

  const [users, setUsers] = useState<User[] | null>(null);

  const fetchUsers = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      return;
    }
    try {
      const {data} = await axios.get(`${user_service}/api/v1/user/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  }, []);


  useEffect(()=>{
    fetchUser();
    fetchChats();
    fetchUsers();
  },[fetchUser, fetchChats, fetchUsers]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuth,
      setIsAuth,
      loading,
      logoutUser,
      fetchUsers,
      fetchChats,
      chats,
      users,
      setChats,
    }),
    [user, isAuth, loading, logoutUser, fetchUsers, fetchChats, chats, users],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <Toaster/>
    </AppContext.Provider>
  );
};


export const useAppData =(): AppContextType =>{
    const context = useContext(AppContext);
    if(!context){
        throw new Error("useappdata must be used within AppProvider");
    }
    return context;
};
