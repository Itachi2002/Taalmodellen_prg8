# VoetbalGPT - Je Persoonlijke Voetbaltrainer

Een AI-gestuurde chatapplicatie gespecialiseerd in jeugdvoetbaltraining, met geïntegreerde weersinformatie.

## Functionaliteiten

- Chatinterface voor voetbaltraining vragen
- Real-time weersinformatie voor Amsterdam
- Contextbewuste antwoorden gebaseerd op een uitgebreide voetbaltraining handleiding
- Streaming responses voor vloeiende interactie
- Moderne en responsieve UI

## Project Structuur

```
.
├── CLIENT/                    # Frontend bestanden
│   ├── index.html            # Hoofdpagina
│   ├── style.css             # CSS styling
│   ├── script.js             # Frontend JavaScript
│   ├── assets/              # Afbeeldingen en media
│   └── package.json         # Frontend dependencies
└── SERVER/                   # Backend bestanden
    ├── server.js            # Express server met AI en weer integratie
    ├── data/                # Training data
    │   └── voetbaltraining_jeugdspelers.txt
    ├── .env                 # Environment variables (niet in git)
    └── package.json        # Backend dependencies
```

## Installatie

1. Clone de repository:
```bash
git clone [repository-url]
cd [repository-name]
```

2. Installeer backend dependencies:
```bash
cd SERVER
npm install
```

3. Installeer frontend dependencies:
```bash
cd ../CLIENT
npm install
```

4. Maak een `.env` bestand in de SERVER directory met je Azure OpenAI credentials:
```
AZURE_OPENAI_API_VERSION=2025-03-01-preview
AZURE_OPENAI_API_INSTANCE_NAME=cmgt-ai
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_DEPLOYMENT_NAME=deploy-gpt-35-turbo
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=deploy-text-embedding-ada
```

## De Applicatie Starten

1. Start de backend server:
```bash
cd SERVER
npm run dev
```

2. Start de frontend development server:
```bash
cd CLIENT
npm run dev
```

3. Open je browser en ga naar http://localhost:3000

## Features

- **AI Chat**: Stel vragen over voetbaltraining en ontvang expert advies
- **Weer Integratie**: Real-time weerinformatie voor Amsterdam
- **Contextbewust**: Antwoorden gebaseerd op professionele voetbaltraining handleiding
- **Streaming Responses**: Vloeiende, natuurlijke antwoorden
- **Responsive Design**: Werkt op alle apparaten

## Technische Details

- Frontend: HTML5, CSS3, JavaScript (Vite)
- Backend: Node.js, Express
- AI: Azure OpenAI, LangChain
- Weer API: Open-Meteo
- Vector Store: LangChain Memory Vector Store
- Document Processing: LangChain Text Splitter

## Troubleshooting

- Zorg dat Node.js geïnstalleerd is
- Controleer of alle dependencies correct zijn geïnstalleerd
- Verifieer je Azure OpenAI credentials
- Zorg dat beide servers draaien (frontend en backend)
- Check de console voor eventuele error messages
