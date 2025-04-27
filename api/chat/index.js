import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages"
import { OpenAIEmbeddings } from "@langchain/openai"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { TextLoader } from "langchain/document_loaders/fs/text"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import path from 'path'

// Initialize embeddings
const embeddings = new OpenAIEmbeddings({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION
})

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
        
        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Transfer-Encoding', 'chunked')
        
        // Get streaming response from model
        const stream = await model.stream([...chatHistory])
        
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