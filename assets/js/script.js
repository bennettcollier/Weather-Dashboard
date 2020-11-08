var myKey = config.OPEN_WEATHER_KEY;

var cityList = JSON.parse(localStorage.getItem('cityList')) || [];



// get city name
var getData = function (cityName) {

    cityName = cityName.replace(" ", "+");

    // current weather
    var urlNow = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${myKey}`;

    fetch(urlNow).then(function (res) {
        if (res.ok) {
            return res.json();
        };
    }).then(function (data) {

        var lon = data.coord.lon;
        var lat = data.coord.lat;
        var urlUV = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${myKey}`;
        fetch(urlUV).then(function (res) {
            return res.json();
        }).then(function (UVdata) {
            var UVindex = UVdata.value

            populateNow(data, UVindex);
            var cityName = data.name;
            var cityId = data.sys.id;
            var cityCountry = data.sys.country;
            addCity(cityName, cityCountry, cityId);


        });

        var urlForecast = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${myKey}`;

        fetch(urlForecast).then(function (res) {
            if (res.ok) {
                return res.json();
            };
        }).then(function (data) {
            populateForecast(data);
        });


    }).catch(function () {
        alert("Invalid Entry. Please Try Again.");
    });

}

var addCity = function (cityName, cityCountry, cityId) {
    cityObj = {
        "name": cityName,
        "country": cityCountry,
        "id": cityId
    }

    for (i = 0; i < cityList.length; i++) {
        if (cityList[i].id === cityId) {
            cityList.splice(i, 1);
        }
    }

    cityList.push(cityObj);
    localStorage.setItem("cityList", JSON.stringify(cityList));
    renderCities(cityList);
};


var renderCities = function (cList) {
    cityListEl = document.getElementById("cityHistory");
    cityListEl.innerHTML = "";

    for (city of cList) {

        cityEl = document.createElement("li");
        cityEl.setAttribute("class", "list-group-item")
        cityEl.setAttribute("data-id", city.id)
        cityEl.textContent = city.name + ", " + city.country;
        cityListEl.prepend(cityEl);
    }
};

var populateNow = function (cityObj, UVindex) {

    UVi = parseInt(UVindex)
    if (UVi <= 2) {
        uvclass = "uv-low"
    } else if (UVi <= 5) {
        uvclass = "uv-moderate"
    } else if (UVi <= 7) {
        uvclass = "uv-high"
    } else if (UVi <= 10) {
        uvclass = "uv-very-high"
    } else {
        uvclass = "uv-extreme"
    }

    // weather icon
    var iconcode = cityObj.weather[0].icon;
    var iconurl = "https://openweathermap.org/img/w/" + iconcode + ".png";


    // temperature conversion
    var tC = cityObj.main.temp - 273.15
    var tK = (cityObj.main.temp - 273.15) * 9 / 5 + 32
    var tempStr = tC.toFixed(1) + "&#176C / " + tK.toFixed(1) + "&#176F";

    var cardEl = document.createElement("div");
    cardEl.setAttribute("class", "card");

    var htmlStr = `<div class = "card-body">
        <h2 id="city-now" class = "card-title">${cityObj.name} : ${moment.unix(cityObj.dt).format("MMM Do YYYY")}</h5>
        <img src="${iconurl}" alt="">
        <p class="card-text">Temperature: ${tempStr}</p>
        <p class="card-text">Humidity: ${cityObj.main.humidity}% relative </p>
        <p class="card-text">Wind Speed: ${cityObj.wind.speed}m/s / ${(cityObj.wind.speed * 1.94384).toFixed(1)}kts  <span id ="arrow" style="--angle: ${cityObj.wind.deg}deg">&#8679;</span>  </p>
        <p class="card-text">UV Index:  <span class = "badge ${uvclass}">${UVindex}</span> </p>
    </div>`;

    cardEl.innerHTML = htmlStr;

    var todayEl = document.querySelector("#today");

    todayEl.appendChild(cardEl);

};

var populateForecast = function (fcastObj) {

    var cardEl = document.createElement("div");
    cardEl.setAttribute("class", "card");

    hrsList = fcastObj.list;

    var timeChunks = [];
    var i = 0;
    var chSize = 8;

    while (i < hrsList.length) {
        timeChunks.push(hrsList.slice(i, chSize + i));
        i += chSize;
    }

    for (chunk of timeChunks) {
        cardEl = populateForecastCard(chunk);
        document.getElementById("forecastcards").appendChild(cardEl);
    };
    document.getElementById("five-days").innerHTML = "<h2>5 day forecast</h2>"
};


var populateForecastCard = function (chunkObj) {
    var cardEl = document.createElement("div");
    cardEl.setAttribute("class", "card");

    var twoPmFoundFlag = false;
    for (i = 0; i < chunkObj.length; i++) {

        time = chunkObj[i]

        if (moment.unix(time.dt).hour() >= moment("12:am", "h:a").hour() && !twoPmFoundFlag) {
            twoPmEl = chunkObj[i];
            twoPmFoundFlag = true;


        };
    };

    timeStr = moment.unix(twoPmEl.dt).format("h:a")
    dateStr = moment.unix(twoPmEl.dt).format("MMM Do");


    var rowEl = document.createElement("div");
    rowEl.setAttribute("class", "hr-meteogram");
    for (time of chunkObj) {
        var hrCol = document.createElement("div");
        hrCol.setAttribute("class", "hr-meteogram-el")

        hrCol.innerHTML =
            `
        <div>
            ${moment.unix(time.dt).format("h")}</br>
            ${moment.unix(time.dt).format("a")}</br>
            ${((time.main.temp - 273.15) * 9 / 5 + 32).toFixed(0) + "&#176"} </br> 
            <img src="${"https://openweathermap.org/img/w/" + time.weather[0].icon + ".png"}" alt=""></br>  
            <span id ="arrow" style="--angle: ${time.wind.deg}deg">&#8679;</span> </br>
            ${Math.round((time.wind.speed) * 1.94384)}.kt
            
        </div>
        `

        rowEl.appendChild(hrCol)

    }

    htmlStr = `
    <div class="card bg-primary text-light" style="width: 12rem;">
        <div class="card-body">
            <div class = "row" >
                <h5 class="col card-title">${dateStr} ${timeStr}</h5>
            </div>
            <div class = "row">
                <div class="col">
                   
                    ${((twoPmEl.main.temp - 273.15) * 9 / 5 + 32).toFixed(1) + "&#176F"}  
                    <img src="${"https://openweathermap.org/img/w/" + twoPmEl.weather[0].icon + ".png"}" alt="">   
                    Humidity: ${twoPmEl.main.humidity}% rel.                    
                </div>
            
            </div>
            <div class = "row">
                ${rowEl.outerHTML}
            </div>           
        </div>
    </div>
    `
    cardEl.innerHTML = htmlStr;
    return cardEl
}


function clearData() {
    document.getElementById("today").innerHTML = "";
    document.getElementById("forecastcards").innerHTML = "";
    document.getElementById("five-days").innerHTML = "";

};




var handleSearchClick = function () {
    var cityName = document.getElementById("search-input").value

    clearData()

    getData(cityName);

}

var handleListClick = function (event) {
    clearData()
    if (event.target.className === "list-group-item") {
        var cityName = event.target.textContent
        getData(cityName);
    };
}

renderCities(cityList);

document.getElementById("search-btn").addEventListener("click", handleSearchClick);
document.getElementById("search-input").addEventListener("change", handleSearchClick)
document.getElementById("cityHistory").addEventListener("click", handleListClick);
