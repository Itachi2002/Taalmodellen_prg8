import express from 'express'
import cors from 'cors'
import { ChatOpenAI } from "@langchain/openai"

const model = new ChatOpenAI({
    temperature: 1,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION
})

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Single endpoint for chat
app.post('/', async (req, res) => {
  const prompt = req.body.prompt
  console.log("The user asked for: " + prompt)
  
  try {
    const response = await model.invoke(prompt)
    res.json({ message: response.content })
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({ error: "Something went wrong" })
  }
})

app.listen(3000, () => console.log('Server running on http://localhost:3000')) 