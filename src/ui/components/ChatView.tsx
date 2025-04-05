import React from 'react';

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

interface ChatViewProps {
  connections: ServerConnection[];
  messages: Message[];
  activeServer: string | null;
  activeChannel: string | null;
  messageInput: string;
  setActiveServer: (server: string) => void;
  setActiveChannel: (channel: string) => void;
  setMessageInput: (message: string) => void;
  handleSendMessage: () => void;
}

export function ChatView({
  connections,
  messages,
  activeServer,
  activeChannel,
  messageInput,
  setActiveServer,
  setActiveChannel,
  setMessageInput,
  handleSendMessage
}: ChatViewProps) {
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