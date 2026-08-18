// ======================================================
// UGANDA DIRECTION MAP
// Leaflet + OpenStreetMap + Nominatim + OSRM
// ======================================================


// ======================================================
// 1. CREATE MAP
// ======================================================

const map = L.map("map").setView(
    [1.3733, 32.2903],
    7
);


// ======================================================
// 2. OPENSTREETMAP
// ======================================================

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,

        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
).addTo(map);


// ======================================================
// 3. VARIABLES
// ======================================================

let fromPlace = null;

let toPlace = null;

let fromMarker = null;

let toMarker = null;

let routeLine = null;


// ======================================================
// 4. HTML ELEMENTS
// ======================================================

const fromInput =
    document.getElementById("fromInput");

const toInput =
    document.getElementById("toInput");

const fromResults =
    document.getElementById("fromResults");

const toResults =
    document.getElementById("toResults");

const calculateBtn =
    document.getElementById("calculateBtn");

const clearBtn =
    document.getElementById("clearBtn");

const resultCard =
    document.getElementById("resultCard");

const directionResult =
    document.getElementById("directionResult");

const directionArrow =
    document.getElementById("directionArrow");

const fromName =
    document.getElementById("fromName");

const toName =
    document.getElementById("toName");

const bearingValue =
    document.getElementById("bearingValue");

const distanceValue =
    document.getElementById("distanceValue");

const compassValue =
    document.getElementById("compassValue");

const loading =
    document.getElementById("loading");


// ======================================================
// 5. SEARCH FROM LOCATION
// ======================================================

fromInput.addEventListener(
    "input",
    function () {

        searchLocations(
            fromInput.value,
            fromResults,
            "from"
        );

    }
);


// ======================================================
// 6. SEARCH TO LOCATION
// ======================================================

toInput.addEventListener(
    "input",
    function () {

        searchLocations(
            toInput.value,
            toResults,
            "to"
        );

    }
);


// ======================================================
// 7. NOMINATIM SEARCH
// ======================================================

async function searchLocations(
    query,
    resultContainer,
    type
) {

    query = query.trim();


    if (query.length < 2) {

        resultContainer.style.display =
            "none";

        return;
    }


    resultContainer.innerHTML = `
        <div class="search-result">
            Searching Uganda...
        </div>
    `;

    resultContainer.style.display =
        "block";


    try {

        const params =
            new URLSearchParams({

                q: query,

                format: "json",

                addressdetails: "1",

                limit: "8",

                countrycodes: "ug"

            });


        const response =
            await fetch(
                `https://nominatim.openstreetmap.org/search?${params}`,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Location search failed."
            );

        }


        const results =
            await response.json();


        displaySearchResults(
            results,
            resultContainer,
            type
        );


    } catch (error) {

        console.error(error);


        resultContainer.innerHTML = `
            <div class="search-result">
                Unable to search right now.
            </div>
        `;

    }

}


// ======================================================
// 8. DISPLAY SEARCH RESULTS
// ======================================================

function displaySearchResults(
    results,
    container,
    type
) {

    container.innerHTML = "";


    if (results.length === 0) {

        container.innerHTML = `
            <div class="search-result">
                No matching location found in Uganda.
            </div>
        `;

        return;
    }


    results.forEach(
        function (place) {

            const item =
                document.createElement("div");


            item.className =
                "search-result";


            const name =
                place.name ||
                place.display_name
                    .split(",")[0];


            item.innerHTML = `

                <div class="search-result-name">
                    ${escapeHTML(name)}
                </div>

                <div class="search-result-address">
                    ${escapeHTML(
                        place.display_name
                    )}
                </div>

            `;


            item.addEventListener(
                "click",
                function () {

                    selectLocation(
                        place,
                        type
                    );

                }
            );


            container.appendChild(item);

        }
    );


    container.style.display =
        "block";
}


// ======================================================
// 9. SELECT LOCATION
// ======================================================

function selectLocation(
    place,
    type
) {

    const latitude =
        parseFloat(place.lat);

    const longitude =
        parseFloat(place.lon);


    const selectedPlace = {

        name:
            place.name ||
            place.display_name
                .split(",")[0],

        address:
            place.display_name,

        lat:
            latitude,

        lon:
            longitude

    };


    if (type === "from") {

        fromPlace =
            selectedPlace;

        fromInput.value =
            selectedPlace.name;

        fromResults.style.display =
            "none";


        if (fromMarker) {

            map.removeLayer(
                fromMarker
            );

        }


        fromMarker =
            L.marker(
                [
                    latitude,
                    longitude
                ]
            )
            .addTo(map)
            .bindPopup(
                `<strong>FROM</strong><br>
                 ${escapeHTML(
                     selectedPlace.name
                 )}`
            );


    } else {

        toPlace =
            selectedPlace;

        toInput.value =
            selectedPlace.name;

        toResults.style.display =
            "none";


        if (toMarker) {

            map.removeLayer(
                toMarker
            );

        }


        toMarker =
            L.marker(
                [
                    latitude,
                    longitude
                ]
            )
            .addTo(map)
            .bindPopup(
                `<strong>TO</strong><br>
                 ${escapeHTML(
                     selectedPlace.name
                 )}`
            );

    }


    // Center map

    map.setView(
        [
            latitude,
            longitude
        ],
        12
    );

}


// ======================================================
// 10. CALCULATE ROUTE
// ======================================================

calculateBtn.addEventListener(
    "click",
    calculateRoute
);


async function calculateRoute() {

    if (!fromPlace) {

        alert(
            "Please select a starting location."
        );

        return;
    }


    if (!toPlace) {

        alert(
            "Please select a destination."
        );

        return;
    }


    // Don't allow same place

    if (
        fromPlace.lat === toPlace.lat &&
        fromPlace.lon === toPlace.lon
    ) {

        alert(
            "The starting location and destination cannot be the same."
        );

        return;
    }


    loading.classList.remove(
        "hidden"
    );


    try {

        // OSRM route request

        const url =
            `https://router.project-osrm.org/route/v1/driving/` +

            `${fromPlace.lon},${fromPlace.lat};` +

            `${toPlace.lon},${toPlace.lat}` +

            `?overview=full&geometries=geojson`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Routing service failed."
            );

        }


        const data =
            await response.json();


        if (
            data.code !== "Ok" ||
            !data.routes ||
            data.routes.length === 0
        ) {

            throw new Error(
                "No route found."
            );

        }


        const route =
            data.routes[0];


        // Draw route

        drawRoute(
            route.geometry
        );


        // Distance

        const distanceKm =
            route.distance / 1000;


        // Calculate initial bearing

        const coordinates =
            route.geometry.coordinates;


        let bearing;


        if (coordinates.length >= 2) {

            const first =
                coordinates[0];

            const second =
                coordinates[1];


            bearing =
                calculateBearing(
                    first[1],
                    first[0],
                    second[1],
                    second[0]
                );

        } else {

            bearing =
                calculateBearing(
                    fromPlace.lat,
                    fromPlace.lon,
                    toPlace.lat,
                    toPlace.lon
                );

        }


        // Compass direction

        const compass =
            getCompassDirection(
                bearing
            );


        // East / West

        const direction =
            getEastWest(
                bearing
            );


        // Display result

        displayResult(
            direction,
            compass,
            bearing,
            distanceKm
        );


    } catch (error) {

        console.error(error);

        alert(
            "Unable to calculate the route. Please try again."
        );

    } finally {

        loading.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// 11. DRAW ROUTE
// ======================================================

function drawRoute(
    geometry
) {

    if (routeLine) {

        map.removeLayer(
            routeLine
        );

    }


    const latLngs =
        geometry.coordinates.map(
            function (coordinate) {

                return [
                    coordinate[1],
                    coordinate[0]
                ];

            }
        );


    routeLine =
        L.polyline(
            latLngs,
            {
                weight: 6,

                opacity: 0.85
            }
        ).addTo(map);


    // Fit map around route

    map.fitBounds(
        routeLine.getBounds(),
        {
            padding: [
                80,
                80
            ]
        }
    );

}


// ======================================================
// 12. BEARING CALCULATION
// ======================================================

function calculateBearing(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const toRadians =
        degrees =>
            degrees *
            Math.PI /
            180;


    const toDegrees =
        radians =>
            radians *
            180 /
            Math.PI;


    const φ1 =
        toRadians(lat1);

    const φ2 =
        toRadians(lat2);


    const Δλ =
        toRadians(
            lon2 - lon1
        );


    const y =
        Math.sin(Δλ) *
        Math.cos(φ2);


    const x =
        Math.cos(φ1) *
        Math.sin(φ2)

        -

        Math.sin(φ1) *
        Math.cos(φ2) *
        Math.cos(Δλ);


    let bearing =
        toDegrees(
            Math.atan2(y, x)
        );


    bearing =
        (bearing + 360) % 360;


    return bearing;
}


// ======================================================
// 13. COMPASS DIRECTION
// ======================================================

function getCompassDirection(
    bearing
) {

    const directions = [

        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW"

    ];


    const index =
        Math.round(
            bearing / 45
        ) % 8;


    return directions[index];
}


// ======================================================
// 14. EAST / WEST
// ======================================================

function getEastWest(
    bearing
) {

    /*
       0°   = North
       90°  = East
       180° = South
       270° = West
    */


    if (
        bearing >= 0 &&
        bearing < 180
    ) {

        return "EASTBOUND";

    }


    return "WESTBOUND";
}


// ======================================================
// 15. DISPLAY RESULT
// ======================================================

function displayResult(
    direction,
    compass,
    bearing,
    distanceKm
) {

    resultCard.classList.remove(
        "hidden"
    );


    directionResult.textContent =
        direction;


    fromName.textContent =
        fromPlace.name;


    toName.textContent =
        toPlace.name;


    bearingValue.textContent =
        `${bearing.toFixed(1)}°`;


    compassValue.textContent =
        compass;


    if (distanceKm < 1) {

        distanceValue.textContent =
            `${(distanceKm * 1000).toFixed(0)} m`;

    } else {

        distanceValue.textContent =
            `${distanceKm.toFixed(1)} km`;

    }


    // Arrow

    directionArrow.textContent =
        getArrow(compass);


    // Rotate arrow

    directionArrow.style.transform =
        `rotate(${bearing}deg)`;


    // East styling

    if (
        direction === "EASTBOUND"
    ) {

        directionResult.style.color =
            "#159447";


        directionArrow.style.background =
            "#e9f8ef";


        directionArrow.style.color =
            "#159447";

    }

    // West styling

    else {

        directionResult.style.color =
            "#1266f1";


        directionArrow.style.background =
            "#edf4ff";


        directionArrow.style.color =
            "#1266f1";

    }

}


// ======================================================
// 16. ARROW
// ======================================================

function getArrow(
    compass
) {

    const arrows = {

        N: "↑",

        NE: "↗",

        E: "→",

        SE: "↘",

        S: "↓",

        SW: "↙",

        W: "←",

        NW: "↖"

    };


    return arrows[compass];
}


// ======================================================
// 17. CLEAR EVERYTHING
// ======================================================

clearBtn.addEventListener(
    "click",
    clearMap
);


function clearMap() {

    fromPlace = null;

    toPlace = null;


    fromInput.value = "";

    toInput.value = "";


    if (fromMarker) {

        map.removeLayer(
            fromMarker
        );

        fromMarker = null;

    }


    if (toMarker) {

        map.removeLayer(
            toMarker
        );

        toMarker = null;

    }


    if (routeLine) {

        map.removeLayer(
            routeLine
        );

        routeLine = null;

    }


    resultCard.classList.add(
        "hidden"
    );


    fromResults.style.display =
        "none";


    toResults.style.display =
        "none";


    map.setView(
        [1.3733, 32.2903],
        7
    );

}


// ======================================================
// 18. CLOSE SEARCH RESULTS
// ======================================================

document.addEventListener(
    "click",
    function (event) {

        if (
            !event.target.closest(
                ".input-wrapper"
            )
        ) {

            fromResults.style.display =
                "none";

            toResults.style.display =
                "none";

        }

    }
);


// ======================================================
// 19. ESCAPE HTML
// ======================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;
}