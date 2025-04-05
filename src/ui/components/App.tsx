import React, { useState, useEffect } from 'react';

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
    <div className="chat-container">
      <div className="sidebar">
        <h2>Servers</h2>
        {connections.map((conn) => (
          <div key={conn.name}>
            <h3 
              onClick={() => setActiveServer(conn.name)}
              style={{ 
                cursor: 'pointer', 
                fontWeight: activeServer === conn.name ? 'bold' : 'normal',
                color: conn.connected ? 'white' : '#ff9999'
              }}
            >
              {conn.name} {!conn.connected && '(disconnected)'}
            </h3>
            {activeServer === conn.name && (
              <ul>
                {conn.channels.map((channel) => (
                  <li 
                    key={channel}
                    onClick={() => setActiveChannel(channel)}
                    style={{ 
                      cursor: 'pointer', 
                      fontWeight: activeChannel === channel ? 'bold' : 'normal' 
                    }}
                  >
                    {channel}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="chat-area">
        <div className="messages">
          {activeServer && activeChannel ? (
            messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} className="message">
                  <strong>{msg.sender}</strong> <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                  <div>{msg.content}</div>
                </div>
              ))
            ) : (
              <p>No messages in this channel yet.</p>
            )
          ) : (
            <p>Select a server and channel to view messages.</p>
          )}
        </div>
        
        <div className="input-area">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!activeServer || !activeChannel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <button onClick={handleSendMessage} disabled={!activeServer || !activeChannel}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 