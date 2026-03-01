import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Message {
  id: number;
  sender: 'me' | 'them';
  content: string;
  timestamp: string;
}

const Chat: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'them', content: 'Hello! I\'m interested in your wedding photography service.', timestamp: '10:30 AM' },
    { id: 2, sender: 'me', content: 'Hi there! Thank you for your interest. I\'d be happy to discuss my packages with you.', timestamp: '10:32 AM' },
    { id: 3, sender: 'them', content: 'Great! Can you tell me more about your premium package?', timestamp: '10:35 AM' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const message: Message = {
      id: messages.length + 1,
      sender: 'me',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="glass h-[calc(100vh-200px)] flex flex-col">
        <div className="border-b border-white/40 p-4">
          <h2 className="text-xl font-semibold text-white">{t('chatWithServiceProvider')}</h2>
          <p className="text-sm text-white/80">Capture Moments Photography</p>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'me' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white/20 text-white'
                }`}
              >
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${message.sender === 'me' ? 'text-primary-200' : 'text-white/60'}`}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-white/40 p-4">
          <div className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t('typeYourMessage')}
              className="flex-grow px-4 py-2 border border-white/60 bg-white/10 text-white placeholder-white/60 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-primary-600 text-white px-6 py-2 rounded-r-lg hover:bg-primary-700 transition"
            >
              {t('send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
