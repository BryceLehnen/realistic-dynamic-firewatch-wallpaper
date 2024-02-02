var states = ["darknight", "witching", "night", "pink", "green", "whiteblue", "orangeyellow", "purple", "blackwhite"];
var stateCount = [1, 1, 1];
var imageDirectory = "default/", fileType = "png";

// Converted times for sunrise, sunset, noon events (eg. 1452 meaning 14hrs 52min)
var fin_sunrise, fin_sunset, fin_noon;
// Denote the start times for the following backgrounds (eg. 300 meaning 3hrs 00min)
var darknight = 0, witching = 300, night = 400, pink, green, whiteblue, orangeyellow, purple, blackwhite = 2300;

var time = 0, lastTime = 0, lastState = 0;
var switchTime = 0;

// Cached values of lat, lon
var currentcity = "", currentstate = "", currentcountry = "";
let geoLocation;
// Cached values of sunrise, sunset, noon times in UTC
let cachedSunsetSunrise;

// Wallpaper engine properties
window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.city) {
            currentcity = properties.city.value;
            console.log(properties.city.value);
        }
        if (properties.state) {
            currentstate = properties.state.value;
            console.log(properties.state.value);
        }
        if (properties.country) {
            currentcountry = properties.country.value;
            console.log(properties.country.value);
        }
        load();
    }
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Runs on load
// awaits are need to ensure that
async function load() {
    await updateCity();
    await getSunsetSunrise();
    UTCToLocal(cachedSunsetSunrise);
    setTimes();
    changeTime();
    setInterval(update,1000/30);
}

// Check what time it is and change image accordingly 
function update(){
    changeTime();
    if (lastTime != time) {
        lastTime = time;
        if (time >= darknight && time < witching) change(0);
        if (time >= witching && time < night) change(1);
        if (time >= night && time < pink) change(2);
        if (time >= pink && time < green) change(3);
        if (time >= green && time < whiteblue) change(4);
        if (time >= whiteblue && time < orangeyellow) change(5);
        if (time >= orangeyellow && time < purple) change(6);
        if (time >= purple && time < blackwhite) change(7);
        if (time >= blackwhite) change(8);
    }
}

// Takes the UTC time given from sunrise-sunset API and converts it to your local time by checking your current time and getting
// the offset from it and UTC
function UTCToLocal(utc) {
    const {sunrise, sunset, solar_noon} = utc.results;
    console.log(sunrise);
    console.log(sunset);
    console.log(solar_noon);

    // Creating the offset and converting it to hours
    const now = new Date();
    var offset = now.getTimezoneOffset();
    console.log(offset);
    var os = (offset / 60);

    // Sunrise times
    if (parseInt(sunrise.substring(11, 13)) >= os) {
        risehour = parseInt((sunrise.substring(11, 13) - os) * 100);
    }
    else {
        diff = os - parseInt(sunrise.substring(11, 13));
        risehour = (24 - diff) * 100;
    }
    risemin = parseInt(sunrise.substring(14, 16));

    // Sunset times
    if (parseInt(sunset.substring(11, 13)) >= os) {
        sethour = parseInt((sunset.substring(11, 13) - os) * 100);
    }
    else {
        diff = os - parseInt(sunset.substring(11, 13));
        sethour = (24 - diff) * 100;
    }
    setmin = parseInt(sunset.substring(14, 16));

    // Local noon times
    if (parseInt(solar_noon.substring(11, 13)) >= os) {
        noonhour = parseInt((solar_noon.substring(11, 13) - os) * 100);
    }
    else {
        diff = os - parseInt(solar_noon.substring(11, 13));
        noonhour = (24 - diff) * 100;
    }
    noonmin = parseInt(solar_noon.substring(14, 16));
    
    // Setting the final times
    fin_sunrise = risehour + risemin;
    fin_sunset = sethour + setmin;
    fin_noon = noonhour + noonmin;

    console.log("Converted times")
    console.log(fin_sunrise);
    console.log(fin_sunset);
    console.log(fin_noon);
}

// Sets the time when certain backgrounds should change based on final times
function setTimes() {
    pink = fin_sunrise - 100;
    green = fin_sunrise + 100;
    whiteblue = fin_noon;
    orangeyellow = fin_sunset - 100;
    purple = fin_sunset + 100;
}

// Changes the current time
function changeTime() {
	var curTime = new Date();
	time = (curTime.getHours() * 100) + curTime.getMinutes();
}

// Change the image according to the index provided with transitions
async function change(index) { 
    // Checks if background should be changed
	if (index != lastState) {
		lastState = index;
	}
    else {
        return;
    }
    // Grabs elements based on ID's
    var futimage = document.getElementById('future');
    var curimage = document.getElementById('current');

    // Changes the source for future image
    // Note: Future image is BEHIND current image so nothing happens visually yet
    futimage.src = imageDirectory + states[index] + "." + fileType;
    futimage.alt = "Could not load '" + imageDirectory + states[index] + "." + fileType + "'" + time + " " + switchTime;
    
    // Transition changes opacity of current image to create fade effect
    await transition(futimage, curimage);
    
    // Changes the source for current image and opacity back to 1
    curimage.src = imageDirectory + states[index] + "." + fileType;
    curimage.alt = "Could not load '" + imageDirectory + states[index] + "." + fileType + "'" + time + " " + switchTime;
    curimage.style.opacity = 1;
}

// Fade transition functions
function transition(futimage, curimage) {
    return new Promise(function (resolve, reject) {
        // Sets both images to fully opaque
        futimage.style.opacity = 1;
        curimage.style.opacity = 1;
        // Rate of opacity change interval
        var del = 0.01;
        // Loop for fade
        var id = setInterval(changeOpacity, 20);
    
        // Slowly changes opacity of current image from 1 to 0
        function changeOpacity() {
            curimage.style.opacity = curimage.style.opacity - del;
            if (curimage.style.opacity <= 0) {
                clearInterval(id);
                resolve();
            }
        
        }
    })
}
    
// Fetch request function with error catching
async function get(api, n = 10, wait = 1000) {
    console.log("FETCH REQUEST");
    try {
        const response = await fetch(api);
        if (!response.ok) {
            throw new Error(response.status);
        }
        return response.json();
    } catch (e) {
        if (n === 1) {
            throw new Error(`Failed to GET from ${api}`);
        }
        setTimeout(async () => {
            return await get(api, n - 1, wait * 2);
        }, wait)
    }
}

// Changes the lat and lon based on the city given in Wallpaper Engine using nominatim from OSM
async function updateCity() {
    console.log("Update city");
    //currentcity = "London";
    //currentstate = "England";
    //currentcountry = "United Kingdom";
    var q = "q=" + currentcity + ",+" + currentstate + ",+" + currentcountry;
    console.log(q);
    const data = await get("https://nominatim.openstreetmap.org/search?" + q + "&addressdetails=1&format=json");
    // Caching the lat and lon
    geoLocation = { lat: data[0].lat, lon: data[0].lon};
    cachedSunsetSunrise = null;
    console.log(geoLocation);
}

// Caches the sunrise, sunset, and noon times from the sunrise-sunset API
async function getSunsetSunrise() {
    console.log("Update sunrise-sunset");
    const data = await get(`https://api.sunrise-sunset.org/json?lat=${geoLocation.lat}&lng=${geoLocation.lon}&date=today&formatted=0`);
    console.log(data);
    if (!data.results) {
        throw new Error('No sunrise sunset data');
    }
    cachedSunsetSunrise = data;
}
