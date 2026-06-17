import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_URL = "https://multi-tool-smart-assistant-production.up.railway.app"

function App() {
    const [chats, setChats] = useState([])
    const [activeChat, setActiveChat] = useState(null)
    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState("")
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    const currentChat = chats.find(chat => chat.id === activeChat)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [currentChat?.messages, loading])

    function createNewChat() {
        const unique_id = crypto.randomUUID()
        const newChat = {
            id: unique_id,
            title: "New chat",
            messages: []
        }
        setChats([newChat, ...chats])
        setActiveChat(unique_id)
        setTimeout(() => inputRef.current?.focus(), 0)
    }

    async function sendMessage() {
        if (!input.trim() || loading) return

        const userMessage = { role: "user", content: input }
        const updatedMessages = [...currentChat.messages, userMessage]

        const newTitle = currentChat.messages.length === 0
            ? input.slice(0, 32)
            : currentChat.title

        setChats(chats.map(chat =>
            chat.id === activeChat
                ? { ...chat, messages: updatedMessages, title: newTitle }
                : chat
        ))

        const messageToSend = input
        setInput("")
        setLoading(true)

        try {
            const response = await axios.post(`${API_URL}/chat`, {
                message: messageToSend,
                session_id: activeChat
            })

            const assistantMessage = {
                role: "assistant",
                content: response.data.response
            }

            setChats(prevChats => prevChats.map(chat =>
                chat.id === activeChat
                    ? { ...chat, messages: [...chat.messages, assistantMessage] }
                    : chat
            ))
        } catch (error) {
            setChats(prevChats => prevChats.map(chat =>
                chat.id === activeChat
                    ? { ...chat, messages: [...chat.messages, { role: "assistant", content: "Couldn't reach the agent. Check that the backend is running." }] }
                    : chat
            ))
        }

        setLoading(false)
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") sendMessage()
    }

    return (
        <div className="flex h-screen bg-[#15171c] text-[#EDEAE3]">

            {/* Sidebar */}
            <div className="w-64 bg-[#1a1d23] border-r border-white/5 flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <h1 className="text-[15px] font-semibold tracking-wide text-[#EDEAE3]">
                        Smart Assistant
                    </h1>
                    <p className="text-xs text-[#8b8f99] mt-0.5">weather · math · timezone</p>
                </div>

                <div className="p-3">
                    <button
                        onClick={createNewChat}
                        className="w-full flex items-center gap-2 text-sm font-medium
                                   bg-[#E8A33D] text-[#1a1d23] rounded-lg px-3 py-2.5
                                   hover:bg-[#f0b15a] transition-colors"
                    >
                        <span className="text-base leading-none">+</span> New chat
                    </button>
                </div>

                <ul className="flex-1 overflow-y-auto px-2 flex flex-col gap-0.5">
                    {chats.map(chat => (
                        <li
                            key={chat.id}
                            onClick={() => setActiveChat(chat.id)}
                            className={`group px-3 py-2 rounded-lg cursor-pointer truncate text-sm
                                border-l-2 transition-colors
                                ${activeChat === chat.id
                                    ? 'border-[#E8A33D] bg-white/5 text-[#EDEAE3]'
                                    : 'border-transparent text-[#8b8f99] hover:bg-white/[0.03] hover:text-[#EDEAE3]'}`}
                        >
                            {chat.title}
                        </li>
                    ))}
                    {chats.length === 0 && (
                        <li className="px-3 py-2 text-xs text-[#8b8f99]">
                            No conversations yet
                        </li>
                    )}
                </ul>

                <div className="p-3 border-t border-white/5 text-xs text-[#8b8f99]">
                    Built by Robben Lê
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
                {currentChat ? (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-4">
                            {currentChat.messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed
                                            ${msg.role === "user"
                                                ? "bg-[#E8A33D] text-[#1a1d23] rounded-br-sm"
                                                : "bg-[#232730] border border-white/5 text-[#EDEAE3] rounded-bl-sm"}`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#232730] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D] animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D] animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D] animate-bounce"></span>
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        {/* Input box */}
                        <div className="px-6 py-4 border-t border-white/5">
                            <div className="flex gap-2 bg-[#1a1d23] border border-white/10 rounded-xl px-2 py-1.5
                                            focus-within:border-[#E8A33D]/60 transition-colors">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about weather, math, or time..."
                                    className="flex-1 bg-transparent outline-none text-sm px-2 py-2 placeholder:text-[#5c606b]"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={loading || !input.trim()}
                                    className="bg-[#E8A33D] text-[#1a1d23] text-sm font-medium px-4 rounded-lg
                                               hover:bg-[#f0b15a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-12 h-12 rounded-full bg-[#E8A33D]/10 border border-[#E8A33D]/20
                                        flex items-center justify-center mb-4 text-xl">
                            🤖
                        </div>
                        <h2 className="text-lg font-medium text-[#EDEAE3] mb-1">
                            Start a new conversation
                        </h2>
                        <p className="text-sm text-[#8b8f99] max-w-sm">
                            Ask about the weather, do a calculation, or check the time in any timezone.
                        </p>
                        <button
                            onClick={createNewChat}
                            className="mt-5 text-sm font-medium bg-[#E8A33D] text-[#1a1d23]
                                       rounded-lg px-4 py-2 hover:bg-[#f0b15a] transition-colors"
                        >
                            + New chat
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default App