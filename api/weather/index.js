import axios from 'axios'

// Weather API configuration
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast'

// Amsterdam coordinates
const AMSTERDAM_LAT = 52.37
const AMSTERDAM_LON = 4.89

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
    }
    return weatherCodes[code] || 'onbekend'
}

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                latitude: AMSTERDAM_LAT,
                longitude: AMSTERDAM_LON,
                current: true,
                temperature_unit: 'celsius',
                windspeed_unit: 'ms',
                timezone: 'Europe/Amsterdam'
            }
        })
        
        // Transform Open-Meteo data to our format
        const weatherData = {
            main: {
                temp: response.data.current.temperature_2m
            },
            weather: [{
                description: getWeatherDescription(response.data.current.weather_code)
            }],
            wind: {
                speed: response.data.current.wind_speed_10m
            }
        }
        
        res.status(200).json(weatherData)
    } catch (error) {
        console.error('Error fetching weather:', error)
        res.status(500).json({ error: 'Could not fetch weather data' })
    }
} 