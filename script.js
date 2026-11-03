
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const statusMessage = document.getElementById("statusMessage");
const themeToggle = document.getElementById("themeToggle");
const recentSearches = document.getElementById("recentSearches");
const clearHistoryBtn = document.getElementById("clearHistory");

const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const weatherCondition = document.getElementById("weatherCondition");
const weatherIcon = document.getElementById("weatherIcon");
const windSpeed = document.getElementById("windSpeed");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const forecastContainer = document.getElementById("forecastContainer");

const weatherTypes = {
    0: ["Clear Sky", "☀️"],
    1: ["Mainly Clear", "🌤️"],
    2: ["Partly Cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Rime Fog", "🌫️"],
    51: ["Light Drizzle", "🌦️"],
    53: ["Moderate Drizzle", "🌦️"],
    55: ["Dense Drizzle", "🌧️"],
    61: ["Slight Rain", "🌧️"],
    63: ["Moderate Rain", "🌧️"],
    65: ["Heavy Rain", "🌧️"],
    71: ["Slight Snow", "❄️"],
    73: ["Moderate Snow", "❄️"],
    75: ["Heavy Snow", "🌨️"],
    80: ["Rain Showers", "🌦️"],
    81: ["Moderate Showers", "🌧️"],
    82: ["Heavy Showers", "⛈️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with Hail", "⛈️"],
    99: ["Heavy Thunderstorm", "⛈️"]
};

let searchHistory = JSON.parse(
    localStorage.getItem("weatherHistory") || "[]"
);

function getWeatherInfo(code) {
    return weatherTypes[code] || ["Unknown Weather", "🌡️"];
}

function saveHistory() {
    localStorage.setItem(
        "weatherHistory",
        JSON.stringify(searchHistory)
    );
}

function addRecentSearch(city) {
    searchHistory = [
        city,
        ...searchHistory.filter(
            item => item.toLowerCase() !== city.toLowerCase()
        )
    ].slice(0, 5);

    saveHistory();
    renderRecentSearches();
}

function renderRecentSearches() {
    recentSearches.replaceChildren();

    if (searchHistory.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No recent searches yet.";
        recentSearches.appendChild(message);
        return;
    }

    searchHistory.forEach(city => {
        const item = document.createElement("div");
        item.className = "recent-item";

        const searchButton = document.createElement("button");
        searchButton.className = "recent-city";
        searchButton.textContent = city;
        searchButton.addEventListener("click", () => {
            cityInput.value = city;
            searchWeather();
        });

        const removeButton = document.createElement("button");
        removeButton.className = "remove-city";
        removeButton.textContent = "×";
        removeButton.setAttribute("aria-label", `Remove ${city}`);
        removeButton.addEventListener("click", () => {
            searchHistory = searchHistory.filter(
                item => item !== city
            );
            saveHistory();
            renderRecentSearches();
        });

        item.append(searchButton, removeButton);
        recentSearches.appendChild(item);
    });
}

function setTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    localStorage.setItem("weatherTheme", theme);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem("weatherTheme") || "light";
    setTheme(savedTheme);
}

async function getCityCoordinates(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to find city information.");
    }

    const data = await response.json();

    if (!data.results?.length) {
        throw new Error("City not found. Please try another city.");
    }

    return data.results[0];
}

async function getWeatherData(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to fetch weather data.");
    }

    return response.json();
}

function displayCurrentWeather(city, data) {
    const current = data.current;
    const [condition, icon] = getWeatherInfo(current.weather_code);

    cityName.textContent = `${city.name}, ${city.country || ""}`;
    temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
    weatherCondition.textContent = condition;
    weatherIcon.textContent = icon;
    windSpeed.textContent = `${current.wind_speed_10m} km/h`;
    feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
    humidity.textContent = `${current.relative_humidity_2m}%`;
}

function displayForecast(data) {
    forecastContainer.replaceChildren();

    data.daily.time.forEach((date, index) => {
        const [condition, icon] = getWeatherInfo(data.daily.weather_code[index]);

        const day = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
            weekday: "short"
        });

        const card = document.createElement("article");
        card.className = "forecast-card";

        const dayElement = document.createElement("h3");
        dayElement.textContent = day;

        const iconElement = document.createElement("span");
        iconElement.textContent = icon;

        const conditionElement = document.createElement("p");
        conditionElement.textContent = condition;

        const temperatureElement = document.createElement("h3");
        temperatureElement.textContent =
            `${Math.round(data.daily.temperature_2m_max[index])}° / ${Math.round(data.daily.temperature_2m_min[index])}°`;

        card.append(
            dayElement,
            iconElement,
            conditionElement,
            temperatureElement
        );

        forecastContainer.appendChild(card);
    });
}

async function searchWeather() {
    const city = cityInput.value.trim();

    if (!city) {
        statusMessage.textContent = "Please enter a city name.";
        cityInput.focus();
        return;
    }

    if (!/^[a-zA-Z\s.'-]+$/.test(city)) {
        statusMessage.textContent = "Please enter a valid city name.";
        cityInput.focus();
        return;
    }

    searchBtn.disabled = true;
    statusMessage.textContent = "Loading weather data...";

    try {
        const location = await getCityCoordinates(city);
        const weatherData = await getWeatherData(
            location.latitude,
            location.longitude
        );

        displayCurrentWeather(location, weatherData);
        displayForecast(weatherData);
        addRecentSearch(location.name);

        statusMessage.textContent = `Weather updated for ${location.name}.`;
    } catch (error) {
        statusMessage.textContent = error.message;
    } finally {
        searchBtn.disabled = false;
    }
}

searchBtn.addEventListener("click", searchWeather);

cityInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchWeather();
    }
});

themeToggle.addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("dark-mode")
        ? "dark"
        : "light";

    setTheme(currentTheme === "dark" ? "light" : "dark");
});

clearHistoryBtn.addEventListener("click", () => {
    searchHistory = [];
    saveHistory();
    renderRecentSearches();
});

initializeTheme();
renderRecentSearches();
