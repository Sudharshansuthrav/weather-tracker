// API configuration
// Note: In a real application, you would use your own API key
// and hide it using environment variables on the server side
const API_KEY = '905eff4ddc4f5f7aca6f4c02e4e33823'; // Replace with an actual OpenWeather API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const locationElement = document.getElementById('location');
const dateElement = document.getElementById('date');
const temperatureElement = document.getElementById('temperature');
const weatherIconElement = document.getElementById('weather-icon');
const weatherDescriptionElement = document.getElementById('weather-description');
const feelsLikeElement = document.getElementById('feels-like');
const humidityElement = document.getElementById('humidity');
const windElement = document.getElementById('wind');
const pressureElement = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecast-container');
const savedLocationsContainer = document.getElementById('saved-locations');

// Default city on page load
let currentCity = 'New York';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadSavedLocations();
    getWeatherData(currentCity);
    setupEventListeners();
    updateCurrentDate();
});

// Set up event listeners
function setupEventListeners() {
    // Search button click
    searchButton.addEventListener('click', () => {
        const cityName = searchInput.value.trim();
        if (cityName) {
            getWeatherData(cityName);
            searchInput.value = '';
        }
    });

    // Enter key in search input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const cityName = searchInput.value.trim();
            if (cityName) {
                getWeatherData(cityName);
                searchInput.value = '';
            }
        }
    });

    // Event delegation for saved location cards
    savedLocationsContainer.addEventListener('click', (e) => {
        // If the location name is clicked
        if (e.target.tagName === 'SPAN') {
            getWeatherData(e.target.textContent);
        }
        // If the remove button or its icon is clicked
        else if (e.target.classList.contains('remove-btn') || e.target.parentElement.classList.contains('remove-btn')) {
            const locationCard = e.target.closest('.location-card');
            const locationName = locationCard.querySelector('span').textContent;
            removeLocation(locationName);
            locationCard.remove();
        }
    });
}

// Update the current date display
function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

// Fetch weather data from the API
async function getWeatherData(city) {
    try {
        showLoadingState(true);
        
        // Fetch current weather data
        const currentWeatherResponse = await fetch(`${BASE_URL}/weather?q=${city}&units=imperial&appid=${API_KEY}`);
        
        if (!currentWeatherResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Fetch 5-day forecast data
        const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&units=imperial&appid=${API_KEY}`);
        const forecastData = await forecastResponse.json();
        
        // Update UI with fetched data
        updateCurrentWeather(currentWeatherData);
        updateForecast(forecastData);
        
        // Save the location
        saveLocation(city);
        currentCity = city;
        
        showLoadingState(false);
    } catch (error) {
        showLoadingState(false);
        alert(`Error: ${error.message}. Please try again with a valid city name.`);
        console.error('Weather data fetch error:', error);
    }
}

// Update the current weather display
function updateCurrentWeather(data) {
    locationElement.textContent = `${data.name}, ${data.sys.country}`;
    temperatureElement.textContent = Math.round(data.main.temp);
    weatherDescriptionElement.textContent = data.weather[0].description;
    feelsLikeElement.textContent = `${Math.round(data.main.feels_like)}°F`;
    humidityElement.textContent = `${data.main.humidity}%`;
    windElement.textContent = `${Math.round(data.wind.speed)} mph`;
    pressureElement.textContent = `${data.main.pressure} hPa`;
    
    // Update weather icon based on weather code
    updateWeatherIcon(weatherIconElement, data.weather[0].id);
}

// Update the 5-day forecast display
function updateForecast(data) {
    forecastContainer.innerHTML = '';
    
    // Get data for each day (data is in 3-hour intervals, so we take one reading per day)
    const dailyData = data.list.filter((reading, index) => index % 8 === 0);
    
    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastCard = document.createElement('div');
        forecastCard.classList.add('forecast-card');
        
        forecastCard.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">
                <i class="${getWeatherIconClass(day.weather[0].id)}"></i>
            </div>
            <div class="forecast-temp">
                <span class="max-temp">${Math.round(day.main.temp_max)}°</span>
                <span class="min-temp">${Math.round(day.main.temp_min)}°</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}

// Update weather icon based on weather code
function updateWeatherIcon(element, weatherCode) {
    element.className = getWeatherIconClass(weatherCode);
}

// Get the appropriate Font Awesome icon class based on weather code
function getWeatherIconClass(weatherCode) {
    // Weather codes reference: https://openweathermap.org/weather-conditions
    if (weatherCode >= 200 && weatherCode < 300) {
        return 'fas fa-bolt'; // Thunderstorm
    } else if (weatherCode >= 300 && weatherCode < 500) {
        return 'fas fa-cloud-rain'; // Drizzle
    } else if (weatherCode >= 500 && weatherCode < 600) {
        return 'fas fa-cloud-showers-heavy'; // Rain
    } else if (weatherCode >= 600 && weatherCode < 700) {
        return 'fas fa-snowflake'; // Snow
    } else if (weatherCode >= 700 && weatherCode < 800) {
        return 'fas fa-smog'; // Atmosphere (fog, haze, etc.)
    } else if (weatherCode === 800) {
        return 'fas fa-sun'; // Clear sky
    } else if (weatherCode > 800) {
        return 'fas fa-cloud'; // Clouds
    }
    return 'fas fa-question'; // Default/unknown
}

// Save location to local storage
function saveLocation(city) {
    let savedLocations = getSavedLocations();
    
    // Check if location already exists
    if (!savedLocations.includes(city)) {
        // Keep only the last 5 locations
        if (savedLocations.length >= 5) {
            savedLocations.pop();
        }
        
        // Add new location at the beginning
        savedLocations.unshift(city);
        localStorage.setItem('weatherLocations', JSON.stringify(savedLocations));
        
        // Update UI
        updateSavedLocationsUI();
    }
}

// Remove location from local storage
function removeLocation(city) {
    let savedLocations = getSavedLocations();
    const index = savedLocations.indexOf(city);
    
    if (index !== -1) {
        savedLocations.splice(index, 1);
        localStorage.setItem('weatherLocations', JSON.stringify(savedLocations));
    }
}

// Get saved locations from local storage
function getSavedLocations() {
    const locations = localStorage.getItem('weatherLocations');
    return locations ? JSON.parse(locations) : [];
}

// Load saved locations on page load
function loadSavedLocations() {
    updateSavedLocationsUI();
}

// Update the saved locations UI
function updateSavedLocationsUI() {
    savedLocationsContainer.innerHTML = '';
    const savedLocations = getSavedLocations();
    
    savedLocations.forEach(location => {
        const locationCard = document.createElement('div');
        locationCard.classList.add('location-card');
        
        locationCard.innerHTML = `
            <span>${location}</span>
            <button class="remove-btn"><i class="fas fa-times"></i></button>
        `;
        
        savedLocationsContainer.appendChild(locationCard);
    });
}

// Show/hide loading state
function showLoadingState(isLoading) {
    if (isLoading) {
        document.body.style.cursor = 'wait';
        searchButton.disabled = true;
    } else {
        document.body.style.cursor = 'default';
        searchButton.disabled = false;
    }
}

// For demo purposes: simulate weather data if API key is not provided
// This would only run if the API calls fail due to missing API key
function simulateWeatherData() {
    // Check if we've attempted API call and it failed due to API key
    if (!API_KEY || API_KEY === 'your_api_key_here') {
        console.log('Using simulated weather data for demo purposes');
        
        // Simulate current weather
        updateCurrentWeather({
            name: currentCity,
            sys: { country: 'US' },
            main: {
                temp: 72,
                feels_like: 75,
                humidity: 65,
                pressure: 1012
            },
            weather: [{ id: 800, description: 'sunny' }],
            wind: { speed: 8 }
        });
        
        // Simulate forecast
        const forecastList = [];
        const today = new Date();
        
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            forecastList.push({
                dt: date.getTime() / 1000,
                main: {
                    temp_max: Math.round(70 + Math.random() * 10),
                    temp_min: Math.round(55 + Math.random() * 10)
                },
                weather: [{ id: 800 }]
            });
        }
        
        updateForecast({ list: forecastList });
    }
}

// Call this function to use simulated data for demo purposes
// Uncomment this line if you don't have a valid API key
simulateWeatherData();