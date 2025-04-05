import React, { useState, useEffect } from 'react';

interface Command {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
  user: {
    id: number;
    ircIdentifier: string;
  };
}

export function CommandsView() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [formIrcIdentifier, setFormIrcIdentifier] = useState('');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  
  // Fetch commands from the API
  const fetchCommands = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/commands');
      if (!response.ok) {
        throw new Error('Failed to fetch commands');
      }
      
      const data = await response.json();
      setCommands(data);
    } catch (error) {
      console.error('Error fetching commands:', error);
      setError('Failed to load commands. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load commands on component mount
  useEffect(() => {
    fetchCommands();
  }, []);
  
  // Handle form submission for creating or updating a command
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (editingCommand) {
        // Update an existing command
        const response = await fetch(`/api/commands/${editingCommand.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formName,
            code: formCode,
            isActive: formIsActive,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update command');
        }
        
        // Reset form and refresh commands
        setEditingCommand(null);
        fetchCommands();
      } else {
        // Create a new command
        const response = await fetch('/api/commands', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ircIdentifier: formIrcIdentifier,
            name: formName,
            code: formCode,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create command');
        }
        
        // Reset form and refresh commands
        resetForm();
        fetchCommands();
      }
    } catch (error) {
      console.error('Error submitting command:', error);
      setError('Failed to save command. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a command
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this command?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/commands/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete command');
      }
      
      // Refresh commands
      fetchCommands();
    } catch (error) {
      console.error('Error deleting command:', error);
      setError('Failed to delete command. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Edit a command
  const handleEdit = (command: Command) => {
    setEditingCommand(command);
    setFormIrcIdentifier(command.user.ircIdentifier);
    setFormName(command.name);
    setFormCode(command.code);
    setFormIsActive(command.isActive);
  };
  
  // Reset form fields
  const resetForm = () => {
    setEditingCommand(null);
    setFormIrcIdentifier('');
    setFormName('');
    setFormCode('');
    setFormIsActive(true);
  };
  
  return (
    <div className="commands-container">
      <div className="commands-list">
        <h2>Bot Commands</h2>
        
        {isLoading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        
        {commands.length === 0 && !isLoading ? (
          <p>No commands found. Create your first command using the form.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {commands.map((command) => (
                <tr key={command.id}>
                  <td>{command.name}</td>
                  <td>{command.user.ircIdentifier}</td>
                  <td>{command.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => handleEdit(command)}>Edit</button>
                    <button onClick={() => handleDelete(command.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="command-form">
        <h2>{editingCommand ? 'Edit Command' : 'Create New Command'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ircIdentifier">IRC Identifier</label>
            <input
              type="text"
              id="ircIdentifier"
              value={formIrcIdentifier}
              onChange={(e) => setFormIrcIdentifier(e.target.value)}
              required
              disabled={!!editingCommand}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Command Name</label>
            <input
              type="text"
              id="name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="code">Command Code</label>
            <textarea
              id="code"
              rows={10}
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              required
              placeholder="// Enter your JavaScript code here
// Use env.PARAMS.argument to access arguments passed to the command
// Example:
export default `Command result: ${env.PARAMS.argument}`;"
            />
          </div>
          
          {editingCommand && (
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                />
                Active
              </label>
            </div>
          )}
          
          <div className="form-actions">
            <button type="submit" disabled={isLoading}>
              {editingCommand ? 'Update Command' : 'Create Command'}
            </button>
            
            {editingCommand && (
              <button type="button" onClick={resetForm} disabled={isLoading}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 