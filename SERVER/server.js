import express from 'express'
import cors from 'cors'
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages"
import { OpenAIEmbeddings } from "@langchain/openai"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { TextLoader } from "langchain/document_loaders/fs/text"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config()

// Initialize embeddings and vector store
const embeddings = new OpenAIEmbeddings({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION
})

// Load and process the document
const loader = new TextLoader(path.join(__dirname, 'data', 'voetbaltraining_jeugdspelers.txt'))
const docs = await loader.load()

// Split the document into chunks
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
})
const splits = await textSplitter.splitDocuments(docs)

// Create vector store
const vectorStore = await MemoryVectorStore.fromDocuments(splits, embeddings)

// Initialize chat model
const model = new ChatOpenAI({
    temperature: 0.7,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    streaming: true
})

// Initialize chat history with system message
let chatHistory = [
    new SystemMessage("Je bent VoetbalGPT, een expert in jeugdvoetbaltraining. Je antwoordt op basis van de handleiding voor jeugdvoetbaltraining. Geef duidelijke, praktische antwoorden en verwijs waar mogelijk naar specifieke hoofdstukken of oefeningen uit de handleiding.")
]

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Weather API configuration
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast'

// Amsterdam coordinates
const AMSTERDAM_LAT = 52.37
const AMSTERDAM_LON = 4.89

// Function to get weather data
async function getWeatherData(city = 'Amsterdam') {
    try {
        console.log('Fetching weather data...');
        console.log('API URL:', WEATHER_API_URL);
        
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                latitude: AMSTERDAM_LAT,
                longitude: AMSTERDAM_LON,
                current_weather: true,
                temperature_unit: 'celsius',
                windspeed_unit: 'ms',
                timezone: 'Europe/Amsterdam'
            }
        });
        
        console.log('Weather data received:', response.data);
        
        // Transform Open-Meteo data to our format
        const weatherData = {
            main: {
                temp: response.data.current_weather.temperature
            },
            weather: [{
                description: getWeatherDescription(response.data.current_weather.weathercode)
            }],
            wind: {
                speed: response.data.current_weather.windspeed
            }
        };
        
        return weatherData;
    } catch (error) {
        console.error('Error fetching weather:', error.response ? error.response.data : error.message);
        return null;
    }
}

// Helper function to convert weather codes to descriptions
function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'helder',
        1: 'licht bewolkt',
        2: 'halfbewolkt',
        3: 'bewolkt',
        45: 'mistig',
        48: 'dichte mist',
        51: 'lichte motregen',
        53: 'matige motregen',
        55: 'dichte motregen',
        61: 'lichte regen',
        63: 'matige regen',
        65: 'zware regen',
        71: 'lichte sneeuw',
        73: 'matige sneeuw',
        75: 'zware sneeuw',
        77: 'sneeuwkorrels',
        80: 'lichte regenbuien',
        81: 'matige regenbuien',
        82: 'zware regenbuien',
        85: 'lichte sneeuwbuien',
        86: 'zware sneeuwbuien',
        95: 'onweer',
        96: 'onweer met lichte hagel',
        99: 'onweer met zware hagel'
    };
    
    return weatherCodes[code] || 'onbekend';
}

// Weather endpoint
app.get('/weather', async (req, res) => {
    try {
        const weatherData = await getWeatherData();
        res.json(weatherData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Could not fetch weather data" });
    }
});

// Single endpoint for chat
app.post('/', async (req, res) => {
    const prompt = req.body.prompt
    console.log("The user asked for: " + prompt)
    
    try {
        // Add user message to history
        chatHistory.push(new HumanMessage(prompt))
        
        // Check if the question is about weather
        const weatherKeywords = ['weer', 'temperatuur', 'wind', 'regen', 'bewolkt', 'zon']
        const isWeatherQuestion = weatherKeywords.some(keyword => prompt.toLowerCase().includes(keyword))
        
        let context = ''
        
        // If weather-related question, get weather data
        if (isWeatherQuestion) {
            const weatherData = await getWeatherData()
            if (weatherData) {
                const temp = weatherData.main.temp
                const description = weatherData.weather[0].description
                const windSpeed = weatherData.wind.speed
                
                context += `\n\nHuidige weersomstandigheden in Amsterdam:
- Temperatuur: ${temp}°C
- Weer: ${description}
- Windsnelheid: ${windSpeed} m/s\n\n`
            }
        }
        
        // Retrieve relevant document chunks
        const relevantDocs = await vectorStore.similaritySearch(prompt, 3)
        context += relevantDocs.map(doc => doc.pageContent).join('\n\n')
        
        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Transfer-Encoding', 'chunked')
        
        // Get streaming response from model with context
        const stream = await model.stream([
            ...chatHistory,
            new SystemMessage(`Hier is relevante context uit de handleiding en actuele informatie:\n${context}`)
        ])
        
        let fullResponse = ''
        let currentWord = ''
        
        for await (const chunk of stream) {
            const content = chunk.content
            fullResponse += content
            
            // Process content character by character
            for (const char of content) {
                currentWord += char
                
                // If we hit a space or punctuation, send the word
                if (char === ' ' || char === '.' || char === ',' || char === '!' || char === '?') {
                    res.write(JSON.stringify({ type: 'text', content: currentWord }) + '\n')
                    currentWord = ''
                    await delay(100) // 100ms delay between words
                }
            }
        }
        
        // Send any remaining word
        if (currentWord) {
            res.write(JSON.stringify({ type: 'text', content: currentWord }) + '\n')
        }
        
        // Add AI response to history
        chatHistory.push(new AIMessage(fullResponse))
        
        // End the response
        res.end()
    } catch (error) {
        console.error("Error:", error)
        res.status(500).json({ error: "Something went wrong" })
    }
})

// Helper function to add delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

app.listen(3000, () => console.log('VoetbalGPT server running on http://localhost:3000')) 