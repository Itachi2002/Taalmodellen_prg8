const form = document.getElementById('chat-form')
const chatfield = document.getElementById('chatfield')
const messagesContainer = document.getElementById('messages')
const submitBtn = document.getElementById('submit-btn')
const weatherInfo = document.getElementById('weather-info')

// Get the base URL for API calls
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : window.location.origin

// Function to update weather display
function updateWeatherDisplay(weatherData) {
    if (weatherData) {
        const temp = weatherData.main.temp
        const description = weatherData.weather[0].description
        const windSpeed = weatherData.wind.speed
        
        weatherInfo.innerHTML = `
            <div class="weather-card">
                <h3>Huidige Weersomstandigheden</h3>
                <p>🌡️ Temperatuur: ${temp}°C</p>
                <p>🌤️ Weer: ${description}</p>
                <p>💨 Wind: ${windSpeed} m/s</p>
            </div>
        `
    }
}

// Fetch weather on page load
async function fetchWeather() {
    try {
        const response = await fetch(`${API_BASE_URL}/weather`)
        const weatherData = await response.json()
        updateWeatherDisplay(weatherData)
    } catch (error) {
        console.error('Error fetching weather:', error)
        weatherInfo.innerHTML = '<p>Kon het weer niet ophalen</p>'
    }
}

// Update weather every 5 minutes
fetchWeather()
setInterval(fetchWeather, 5 * 60 * 1000)

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
        // Create a new message element for the AI response
        const aiMessageDiv = document.createElement('div')
        aiMessageDiv.classList.add('message', 'ai-message')
        messagesContainer.appendChild(aiMessageDiv)
        
        // Make the streaming request
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: question })
        })
        
        // Create a reader for the stream
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let aiResponse = ''
        
        // Process the stream
        while (true) {
            const { value, done } = await reader.read()
            if (done) break
            
            // Decode the chunk and process each line
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')
            
            for (const line of lines) {
                if (!line) continue
                
                try {
                    const data = JSON.parse(line)
                    if (data.type === 'text') {
                        aiResponse += data.content
                        aiMessageDiv.textContent = aiResponse
                        messagesContainer.scrollTop = messagesContainer.scrollHeight
                    }
                } catch (e) {
                    console.error('Error parsing data:', e)
                }
            }
        }
    } catch (error) {
        console.error('Error:', error)
        addMessage('Sorry, er is iets misgegaan. Probeer het opnieuw.', 'ai')
    } finally {
        submitBtn.disabled = false
    }
})

function addMessage(text, sender) {
    const messageDiv = document.createElement('div')
    messageDiv.classList.add('message')
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message')
    messageDiv.textContent = text
    
    messagesContainer.appendChild(messageDiv)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
} 