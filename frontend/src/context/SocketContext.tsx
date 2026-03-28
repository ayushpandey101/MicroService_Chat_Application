"use client"

import { io, Socket } from "socket.io-client"
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { chat_service, useAppData } from "./AppContext";

interface SocketContextType{
    socket: Socket | null;
    onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    onlineUsers: [],
});

interface ProviderProps{
    children: ReactNode;
}

export const SocketProvider = ({ children }: ProviderProps)=>{
    const {user}= useAppData();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    useEffect(()=>{
        if(!user?._id) {
            return;
        }

        const newSocket = io(chat_service,{
            query:{
                userId: user._id
            }
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (users: string[])=>{
            setOnlineUsers(users);
        })

        return ()=>{
            newSocket.off("getOnlineUsers");
            newSocket.disconnect();
        }
    }, [user?._id]);

    const contextValue: SocketContextType = {
        socket: user?._id ? socket : null,
        onlineUsers: user?._id ? onlineUsers : [],
    };

    return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>
}

export const SocketData = () => useContext(SocketContext);

