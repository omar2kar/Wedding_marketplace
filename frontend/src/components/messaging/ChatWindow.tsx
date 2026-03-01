import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface Message {
    id: number;
    conversation_id: number;
    sender_type: 'client' | 'vendor';
    sender_id: number;
    sender_name: string;
    message: string;
    attachment_url?: string;
    is_read: boolean;
    created_at: string;
}

interface Conversation {
    id: number;
    client_id: number;
    vendor_id: number;
    vendor_name?: string;
    client_name?: string;
    last_message?: string;
    last_message_time?: string;
    client_unread_count: number;
    vendor_unread_count: number;
    status: string;
}

interface ChatWindowProps {
    userType: 'client' | 'vendor';
    userId: number;
    otherPartyId?: number;
    otherPartyName?: string;
    conversationId?: number;
    onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    userType,
    userId,
    otherPartyId,
    otherPartyName,
    conversationId: initialConversationId,
    onClose
}) => {
    const { t } = useTranslation();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showConversationList, setShowConversationList] = useState(true);

    useEffect(() => {
        if (userType === 'client' || userType === 'vendor') {
            fetchConversations();
        }
    }, [userType, userId]);

    useEffect(() => {
        if (initialConversationId) {
            fetchMessages(initialConversationId);
        } else if (otherPartyId && userType === 'client') {
            startNewConversation();
        }
    }, [initialConversationId, otherPartyId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const endpoint = userType === 'client' 
                ? `/api/messages/client/${userId}/conversations`
                : `/api/messages/vendor/${userId}/conversations`;

            const response = await fetch(`http://localhost:5000${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem(`${userType}Token`)}`,
                    [`${userType}-id`]: userId.toString()
                }
            });

            const data = await response.json();
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const startNewConversation = async () => {
        if (!otherPartyId) return;

        try {
            const response = await fetch('http://localhost:5000/api/messages/conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem(`${userType}Token`)}`
                },
                body: JSON.stringify({
                    clientId: userType === 'client' ? userId : otherPartyId,
                    vendorId: userType === 'vendor' ? userId : otherPartyId
                })
            });

            const data = await response.json();
            if (data.success) {
                setSelectedConversation(data.conversation);
                fetchMessages(data.conversation.id);
                if (data.isNew) {
                    fetchConversations();
                }
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    };

    const fetchMessages = async (conversationId: number) => {
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:5000/api/messages/conversation/${conversationId}/messages`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem(`${userType}Token`)}`,
                        'user-type': userType
                    }
                }
            );

            const data = await response.json();
            if (data.success) {
                setMessages(data.messages);
                
                // Find and select the conversation
                const conv = conversations.find(c => c.id === conversationId);
                if (conv) {
                    setSelectedConversation(conv);
                }
                
                // Mark messages as read
                markAsRead(conversationId);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        setSending(true);
        try {
            const response = await fetch('http://localhost:5000/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem(`${userType}Token`)}`
                },
                body: JSON.stringify({
                    conversationId: selectedConversation.id,
                    senderType: userType,
                    senderId: userId,
                    message: newMessage.trim()
                })
            });

            const data = await response.json();
            if (data.success) {
                setMessages([...messages, data.message]);
                setNewMessage('');
                
                // Update conversation list
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert(t('Failed to send message'));
        } finally {
            setSending(false);
        }
    };

    const markAsRead = async (conversationId: number) => {
        try {
            await fetch(`http://localhost:5000/api/messages/conversation/${conversationId}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem(`${userType}Token`)}`
                },
                body: JSON.stringify({ userType })
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return t('Yesterday');
        } else if (days < 7) {
            return `${days} ${t('days ago')}`;
        } else {
            return date.toLocaleDateString('ar-SA');
        }
    };

    return (
        <div className="flex h-[600px] glass rounded-lg overflow-hidden">
            {/* Conversations List */}
            {showConversationList && (
                <div className="w-1/3 border-l border-white/20 bg-white/5">
                    <div className="p-4 border-b border-white/20">
                        <h3 className="text-lg font-bold text-white">{t('Messages')}</h3>
                    </div>
                    <div className="overflow-y-auto h-[calc(100%-60px)]">
                        {conversations.length === 0 ? (
                            <div className="p-4 text-center text-white/50">
                                {t('No conversations yet')}
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => {
                                        setSelectedConversation(conv);
                                        fetchMessages(conv.id);
                                        setShowConversationList(false);
                                    }}
                                    className={`w-full p-4 text-right border-b border-white/10 hover:bg-white/10 transition ${
                                        selectedConversation?.id === conv.id ? 'bg-white/10' : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-white">
                                            {userType === 'client' ? conv.vendor_name : conv.client_name}
                                        </span>
                                        {(userType === 'client' ? conv.client_unread_count : conv.vendor_unread_count) > 0 && (
                                            <span className="bg-purple-500 text-white text-xs rounded-full px-2 py-1">
                                                {userType === 'client' ? conv.client_unread_count : conv.vendor_unread_count}
                                            </span>
                                        )}
                                    </div>
                                    {conv.last_message && (
                                        <p className="text-sm text-white/70 mt-1 truncate">{conv.last_message}</p>
                                    )}
                                    {conv.last_message_time && (
                                        <p className="text-xs text-white/50 mt-1">{formatTime(conv.last_message_time)}</p>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!showConversationList ? 'w-full' : ''}`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/20 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {!showConversationList && (
                                    <button
                                        onClick={() => setShowConversationList(true)}
                                        className="text-white hover:text-white/80"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                    </button>
                                )}
                                <h4 className="font-bold text-white">
                                    {userType === 'client' 
                                        ? selectedConversation.vendor_name || otherPartyName
                                        : selectedConversation.client_name || otherPartyName
                                    }
                                </h4>
                            </div>
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="text-white/70 hover:text-white"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-white/50 py-8">
                                    {t('No messages yet. Start the conversation!')}
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender_type === userType ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div className={`max-w-[70%] ${
                                            msg.sender_type === userType
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                                : 'bg-white/20'
                                        } rounded-lg px-4 py-2`}>
                                            <p className="text-white">{msg.message}</p>
                                            <p className="text-xs text-white/70 mt-1">
                                                {formatTime(msg.created_at)}
                                                {msg.is_read && msg.sender_type === userType && ' ✓✓'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-white/20 bg-white/5">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    sendMessage();
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={t('Type a message...')}
                                    disabled={sending}
                                    className="flex-1 px-4 py-2 rounded-lg glass bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-white/40 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                                >
                                    {sending ? '...' : t('Send')}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-white/50">
                        <div className="text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p>{t('Select a conversation to start messaging')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
