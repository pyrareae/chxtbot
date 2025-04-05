import React, { useState, useEffect } from 'react';
import { ChatView } from './ChatView';
import { CommandsView } from './CommandsView';

interface ServerConnection {
  name: string;
  channels: string[];
  connected: boolean;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  channel: string;
  server: string;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'commands'>('chat');
  const [connections, setConnections] = useState<ServerConnection[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');

  // Fetch connections data from the API
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch('/api/connections');
        if (response.ok) {
          const data = await response.json();
          setConnections(data);
          if (data.length > 0) {
            setActiveServer(data[0].name);
            if (data[0].channels.length > 0) {
              setActiveChannel(data[0].channels[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
      }
    };

    fetchConnections();
    // Set up a polling interval to refresh data
    const interval = setInterval(fetchConnections, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages for the active channel
  useEffect(() => {
    if (activeServer && activeChannel) {
      const fetchMessages = async () => {
        try {
          const response = await fetch(`/api/messages?server=${activeServer}&channel=${activeChannel}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();
      // Set up a polling interval to refresh messages
      const interval = setInterval(fetchMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [activeServer, activeChannel]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeServer || !activeChannel) return;

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server: activeServer,
          channel: activeChannel,
          message: messageInput,
        }),
      });

      if (response.ok) {
        setMessageInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>ChxtBox IRC Client</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'chat' ? 'active' : ''} 
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={activeTab === 'commands' ? 'active' : ''} 
            onClick={() => setActiveTab('commands')}
          >
            Bot Commands
          </button>
        </div>
      </header>

      {activeTab === 'chat' ? (
        <ChatView 
          connections={connections}
          messages={messages}
          activeServer={activeServer}
          activeChannel={activeChannel}
          messageInput={messageInput}
          setActiveServer={setActiveServer}
          setActiveChannel={setActiveChannel}
          setMessageInput={setMessageInput}
          handleSendMessage={handleSendMessage}
        />
      ) : (
        <CommandsView />
      )}
    </div>
  );
} 