const form = document.getElementById('chat-form')
const chatfield = document.getElementById('chatfield')
const messagesContainer = document.getElementById('messages')
const submitBtn = document.getElementById('submit-btn')

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const question = chatfield.value.trim()
    
    if (!question) return
    
    // Add user message to chat
    addMessage(question, 'user')
    
    // Clear input and disable submit button
    chatfield.value = ''
    submitBtn.disabled = true
    
    try {
        const response = await askQuestion(question)
        addMessage(response, 'ai')
    } catch (error) {
        console.error('Error:', error)
        addMessage('Sorry, something went wrong. Please try again.', 'ai')
    } finally {
        submitBtn.disabled = false
    }
})

async function askQuestion(question) {
    const options = {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: question })
    }

    const response = await fetch('http://localhost:3000/', options)
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.message
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div')
    messageDiv.classList.add('message')
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message')
    messageDiv.textContent = text
    
    messagesContainer.appendChild(messageDiv)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
} 