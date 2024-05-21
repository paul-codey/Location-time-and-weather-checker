"use strict";

const apiKey = "e753e7e46d3dbefcd9525e003b6c38b8";
const timeApiKey = "rlAsN0HpqlF22zE6CHbwNA==kjgVJHW2Ps3WZZgE";
const locationiq = "pk.23bd667f9034ad655c7e1a6ee5bc780b";

const container = document.querySelector(".container");
const searchIcon = document.querySelector("button");




// Variable to keep track of suggestions box
let suggestionContainer;

//Variable to delay api fetching

let debounceTimeOut;
let shouldDebounce;

//Error handling
function handleError(error) {
  console.error(error);
  errorBox(error.message);
}

//Animation logic
function animate(container, sec) {
  container.classList.remove("show");
  container.classList.add("hide");
  setTimeout(() => {
    container.classList.remove("hide");
  }, sec);
}

//Display error in html
const errorBox = (msg) => {
  const errorHtml = `
    <div id="errorBox" class="error-box">
      <div class="error-content">
        <span class="error-message">${msg}</span>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("afterbegin", errorHtml);

  const box = document.querySelector(".error-box");
  box.classList.add("show");

  setTimeout(() => {
    animate(box, 300);
  }, 3000);
};


//Getting the first word from the location address
const firstWord = (str) => {
  
  const newStr = str.replace(/[,.$&\\{}|""]/, "");
  
  console.log(newStr)
  return newStr.split(" ").find((char) => /\w/.test(char));
};

//Logic for displaying date
const locationDate = (time) => {
  const datetime = new Date(time);
  //formatting date
  const options = {
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  };

  //return date based on country date format
  return new Intl.DateTimeFormat(navigator.language, options).format(datetime);
};

// Rendering the main component
const renderWeatherCard = (location, weather, time) => {
  const markup = `
    <div class="weather-card">
      <div class="card-header">
        <h1 class="location">${
          firstWord(location.display_name)
        }</h1>
        <div class="weather-condition">
          <img class="condition-icon" src="http://openweathermap.org/img/w/${
            weather.weather[0].icon
          }.png" alt="weather-icon">
          <span class="condition-text">${
            weather.weather[0].description
          }, ${Math.floor(weather.main.temp)}°C</span>
        </div>
      </div>
      <div class="card-body">
        <div class="time-container">
          <span class="current-time">${time.hour}:${time.minute}</span>
          <span class="date"> ${locationDate(time.datetime)}</span>
        </div>
        <div class="weather-details">
          <div class="detail">
            <span class="detail-label">Humidity</span>
            <span class="detail-value humid">${weather.main.humidity}%</span>
          </div>
          <div class="detail">
            <span class="detail-label">Rainfall</span>
            <span class="detail-value rain">${
              weather.rain?.["1h"] ?? 0
            } mm</span>
          </div>
          <div class="detail">
            <span class="detail-label ">Wind</span>
            <span class="detail-value wind">${Math.floor(
              weather.wind.speed
            )} km/h</span>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <div class="search-bar">
          <input type="text" placeholder="Enter city name" aria-label="Search">
          <button type="button" aria-label="Search">
            <ion-icon name="search-outline" class="search-icon"></ion-icon>
          </button>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = "";
  container.insertAdjacentHTML("afterbegin", markup);
  inputManifest();
};

//creating a async function for all our fetching
const getJson = async (url, errorMsg = "Something went wrong") => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${errorMsg} (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    handleError(error);
    throw error;
  }
};


//Input suggestion box rendering
const renderSuggestion = () => {
  const html = `
    <div class="suggestion-box">
      <div class="suggestion-header">
        <ion-icon name="location-outline" class="location-icon"></ion-icon>
        <span class="header-text">Find a location</span>
        <ion-icon name="close-outline" class="cancel-icon"></ion-icon>
      </div>
      <div class="suggestion-list">
      </div>
    </div>
  `;

  container.insertAdjacentHTML("afterbegin", html);

  suggestionContainer = document.querySelector(".suggestion-box");
  suggestionContainer.classList.add('show'); // for animation
};

//Taking users input
function inputManifest() {
  const searchBar = document.querySelector("input");
  searchBar.addEventListener("input", () => {
 
    if (searchBar.value.length >= 2) {
      
      if (!suggestionContainer) {
        renderSuggestion();
      }

      suggestions(searchBar.value);
    }

    if (searchBar.value.length === 0) {
      suggestionContainer = undefined;
      shouldDebounce = undefined;
      hideSuggestion();
    }
  });
}


//Hiding suggestion logic
function hideSuggestion() {
  const suggestContainer = document.querySelector('.suggestion-box');
  animate(suggestContainer, 100);
}


async function suggestions(input) {
  clearTimeout(debounceTimeOut);

  if (shouldDebounce) {
    debounceTimeOut = setTimeout(async () => {
        await getSuggestions(input);
    }, 300);
  } else {
      await getSuggestions(input);
      shouldDebounce = true;
    }
}

async function getSuggestions(query) {
  try {
    const data = await getJson(`https://api.locationiq.com/v1/autocomplete?key=${locationiq}&q=${query}&limit=5&dedupe=1`);

    const suggestionList = document.querySelector('.suggestion-list');
    suggestionList.innerHTML = '';

    data.forEach(suggestion => {
      const suggestionItem = document.createElement("div");
      const header = document.createElement("h3");
      const city = document.createElement("p");
      suggestionItem.appendChild(header);
      suggestionItem.appendChild(city);
      suggestionItem.classList.add('suggestion-item');
      header.textContent = suggestion.display_place;
      city.textContent = suggestion.display_name;
      suggestionList.appendChild(suggestionItem);

      suggestionItem.addEventListener('click', () => {
        const searchBar = document.querySelector('input');
        searchBar.value = suggestion.display_place;
        hideSuggestion();
        
        //console.log(suggestion);
        
        const latLon = `lat=${suggestion.lat}&lon=${suggestion.lon}`;
        
        
        locateData(latLon, suggestion);

        suggestionContainer = undefined;
      })
    })
  } catch (e) {
    throw e
  }

}


async function locateData(latlong, place) {
  
  const weatherData = await getJson(`https://api.openweathermap.org/data/2.5/weather?${latlong}&units=metric&appid=${apiKey}`);
        
  const locationCurrentTime = await getJson(`https://api.api-ninjas.com/v1/worldtime?${latlong}&X-Api-Key=${timeApiKey}`);
  
  renderWeatherCard(place, weatherData, locationCurrentTime);
}


//fetching data from 3 APIs
const getData = async (latLon, city=latLon) => {
  try {
    const [location, weather, time] = await Promise.all([
      getJson(
        `https://us1.locationiq.com/v1/reverse?key=${locationiq}&${latLon}&format=json`
      ),
      getJson(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
      ),
      getJson(
        `https://api.api-ninjas.com/v1/worldtime?${latLon}&X-Api-Key=${timeApiKey}`
      ),
    ]);

    console.log(weather)
    renderWeatherCard(location, weather, time);
    
  } catch (error) {
    handleError(error);
  }
};

//Getting user location
const getPosition = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

//Getting location latitude and longitude
const getCity = async () => {
  try {
    const pos = await getPosition();
    const { latitude: lat, longitude: lng } = pos.coords;
    const locationlatLon = `lat=${lat}&lon=${lng}`;
    getData(locationlatLon);
  } catch (error) {
    const defaultLocation = "lat=6.5269033&lon=3.5774005";
    const city = "lagos";
    getData(defaultLocation, city);
    handleError(new Error("Problem getting your location"));
  }
};

getCity();