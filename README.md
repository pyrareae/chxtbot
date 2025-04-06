# CHXTBOX

An IRC utility chatbot with a web UI for managing command scripts.

## Features

- IRC client that connects to configured servers
- Web UI for managing and testing command scripts
- AI-powered code generation for command scripts

## Setup

1. Clone the repository
2. Install dependencies with `bun install`
3. Configure your settings in `config.toml`
4. Start the server with `bun start`

## Configuration

The bot is configured through the `config.toml` file. Here's an example configuration:

```toml
nick = "chxtbox"

[servers]
[servers.default]
channels = [
  "##chxtbox"
]
[servers.libera]
host = "irc.libera.chat"
port = 6665

[api_keys]
gemini = "your_gemini_api_key_here" # Get from https://aistudio.google.com/app/apikey
```

### API Keys

To use the AI code generation feature, you need to get a Gemini API key:

1. Go to https://aistudio.google.com/app/apikey to create an API key
2. Add it to your `config.toml` file in the `[api_keys]` section

## Using the AI Code Generator

The script editor includes an AI assistant that can help you write or modify your IRC bot commands:

1. Write or load an existing command script in the editor
2. In the sidebar, enter a prompt describing what you want the AI to do with your code
3. Click "Generate Code" to have the AI modify your script
4. Review the generated code and make any necessary adjustments
5. Test the command with the "Run Test" button
6. Save your command when ready

The AI understands the context of IRC bot commands and will ensure that the generated code follows the required format with a `run()` function that takes an argument and returns a string. 