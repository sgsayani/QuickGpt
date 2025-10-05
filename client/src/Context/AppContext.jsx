import React from 'react'
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

const AppContext = React.createContext()

export const AppContextProvider = ({children}) => {
    const navigate = useNavigate()
    const [user, setUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setselectedChat] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [token, setToken] = useState(localStorage.getItem('token') || null)
    const [loadingUser, setLoadingUser] = useState(true)
    
    // Use ref to prevent infinite loops
    const isFetchingChats = useRef(false);

    const fetchUser = useCallback(async () => {
        if (!token) {
            setLoadingUser(false);
            return;
        }
        
        try {
            const {data} = await axios.get('/api/user/data', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if(data.success){
                setUser(data.user)
            } else {
                toast.error(data.message)
                localStorage.removeItem('token')
                setToken(null)
            }
        } catch (error) {
            console.error("Fetch user error:", error);
            toast.error(error.response?.data?.message || 'Failed to fetch user data')
            if (error.response?.status === 401) {
                localStorage.removeItem('token')
                setToken(null)
            }
        } finally {
            setLoadingUser(false)
        }
    }, [token])

    const fetchUsersChats = useCallback(async () => {
        if (!token || !user || isFetchingChats.current) return;
        
        isFetchingChats.current = true;
        
        try {
            const {data} = await axios.get('/api/chat/get', {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            if(data.success){
                setChats(data.chats)
                
                // if the user has no chats, create one
                if(data.chats.length === 0){
                    isFetchingChats.current = false;
                    await createNewChat();
                } else {
                    setselectedChat(data.chats[0])
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error("Fetch chats error:", error);
            toast.error(error.response?.data?.message || error.message)
        } finally {
            isFetchingChats.current = false;
        }
    }, [token, user])

    const createNewChat = async () => {
        try {
            if(!user) {
                toast.error('Login to create a new chat')
                return;
            }
            
            navigate('/')
            
            await axios.post('/api/chat/create', {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            // Fetch chats after creating
            await fetchUsersChats()   
        } catch (error) {
            console.error("Create chat error:", error);
            toast.error(error.response?.data?.message || error.message)
        }
    }

    // Theme effect
    useEffect(() => {
        if(theme === 'dark'){
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    // Token effect - Fetch user when token changes
    useEffect(() => {
        if(token){
            fetchUser()
        } else {
            setUser(null)
            setChats([])
            setselectedChat(null)
            setLoadingUser(false)
        }
    }, [token, fetchUser])

    // User effect - Fetch chats when user logs in
    useEffect(() => {
        if(user && token && !isFetchingChats.current){
            fetchUsersChats()
        } else if (!user) {
            setChats([])
            setselectedChat(null)
        }
    }, [user, token,fetchUsersChats])
    
    const value = {
        navigate,
        user, 
        setUser,
        fetchUser,
        chats,
        setChats,
        selectedChat,
        setselectedChat,
        theme,
        setTheme,
        createNewChat,
        loadingUser,
        fetchUsersChats,
        token,
        setToken,
        axios
    }
    
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext)