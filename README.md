# AI Chat Application

A simple chat application that uses Azure OpenAI to generate responses.

## Project Structure

```
.
├── CLIENT/              # Frontend files
│   ├── index.html      # Main HTML file
│   ├── style.css       # CSS styles
│   └── script.js       # Frontend JavaScript
└── SERVER/             # Backend files
    ├── server.js       # Express server
    ├── .env           # Environment variables (not in git)
    └── package.json   # Node.js dependencies
```

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd [repository-name]
```

2. Install dependencies:
```bash
cd SERVER
npm install
```

3. Create a `.env` file in the SERVER directory with your Azure OpenAI credentials:
```
AZURE_OPENAI_API_VERSION=2025-03-01-preview
AZURE_OPENAI_API_INSTANCE_NAME=cmgt-ai
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_DEPLOYMENT_NAME=deploy-gpt-35-turbo
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=deploy-text-embedding-ada
```

## Running the Application

1. Start the backend server:
```bash
cd SERVER
npm run dev
```

2. Start the frontend server:
```bash
cd CLIENT
python3 -m http.server 8000
```

3. Open your browser and go to http://localhost:8000

## Issues

- Make sure you have Node.js installed
- Make sure you have Python installed
- Make sure your Azure OpenAI credentials are correct
- Make sure both servers are running (frontend and backend)
