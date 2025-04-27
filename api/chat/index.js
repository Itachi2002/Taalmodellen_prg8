import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages"
import { OpenAIEmbeddings } from "@langchain/openai"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load training data
const trainingData = fs.readFileSync(path.join(__dirname, '..', 'data', 'voetbaltraining_jeugdspelers.txt'), 'utf8')

// Initialize embeddings
const embeddings = new OpenAIEmbeddings({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION
})

// Split the document into chunks
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
})

// Create document chunks
const docs = [{
    pageContent: trainingData,
    metadata: { source: 'voetbaltraining_jeugdspelers.txt' }
}]
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

// Initialize chat history
const chatHistory = [
    new SystemMessage("Je bent VoetbalGPT, een expert in jeugdvoetbaltraining. Je antwoordt op basis van de handleiding voor jeugdvoetbaltraining. Geef duidelijke, praktische antwoorden en verwijs waar mogelijk naar specifieke hoofdstukken of oefeningen uit de handleiding.")
]

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { prompt } = req.body
        
        // Add user message to history
        chatHistory.push(new HumanMessage(prompt))
        
        // Retrieve relevant document chunks
        const relevantDocs = await vectorStore.similaritySearch(prompt, 3)
        const context = relevantDocs.map(doc => doc.pageContent).join('\n\n')
        
        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Transfer-Encoding', 'chunked')
        
        // Get streaming response from model with context
        const stream = await model.stream([
            ...chatHistory,
            new SystemMessage(`Hier is relevante context uit de handleiding:\n${context}`)
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
                    await new Promise(resolve => setTimeout(resolve, 100))
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
} 