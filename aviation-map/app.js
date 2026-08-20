// ======================================================
// UGANDA ROUTE DIRECTION MAP
// ======================================================


// ======================================================
// 1. MAP INITIALIZATION
// ======================================================

const map = L.map("map").setView(
    [1.3733, 32.2903],
    7
);


L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
        attribution:
            '&copy; OpenStreetMap contributors &copy; CARTO',

        subdomains: "abcd",

        maxZoom: 20
    }
).addTo(map);


// ======================================================
// 2. VARIABLES
// ======================================================

let fromPlace = null;

let toPlace = null;

let fromMarker = null;

let toMarker = null;

let routeLine = null;

let fromSearchTimer = null;

let toSearchTimer = null;


// ======================================================
// 3. GET HTML ELEMENTS
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

const swapBtn =
    document.getElementById("swapBtn");

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


// Flight level elements

const flightLevelCard =
    document.getElementById("flightLevelCard");

const flightLevelDirection =
    document.getElementById("flightLevelDirection");

const flightLevelMessage =
    document.getElementById("flightLevelMessage");

const flightLevels =
    document.getElementById("flightLevels");


// ======================================================
// 4. INITIAL STATE
// ======================================================

// Hide result cards when page loads

if (resultCard) {
    resultCard.classList.add("hidden");
}

if (flightLevelCard) {
    flightLevelCard.classList.add("hidden");
}


// ======================================================
// 5. SWAP FROM / TO
// ======================================================

if (swapBtn) {

    swapBtn.addEventListener(
        "click",
        function () {

            // ------------------------------------------
            // Save current values
            // ------------------------------------------

            const oldFromText =
                fromInput.value;

            const oldToText =
                toInput.value;


            const oldFromPlace =
                fromPlace;

            const oldToPlace =
                toPlace;


            const oldFromMarker =
                fromMarker;

            const oldToMarker =
                toMarker;


            // ------------------------------------------
            // Swap input text
            // ------------------------------------------

            fromInput.value =
                oldToText;

            toInput.value =
                oldFromText;


            // ------------------------------------------
            // Swap places
            // ------------------------------------------

            fromPlace =
                oldToPlace;

            toPlace =
                oldFromPlace;


            // ------------------------------------------
            // Swap markers
            // ------------------------------------------

            fromMarker =
                oldToMarker;

            toMarker =
                oldFromMarker;


            // ------------------------------------------
            // Update FROM marker popup
            // ------------------------------------------

            if (
                fromMarker &&
                fromPlace
            ) {

                fromMarker.setPopupContent(
                    `<strong>FROM</strong><br>
                    ${escapeHTML(fromPlace.name)}`
                );

            }


            // ------------------------------------------
            // Update TO marker popup
            // ------------------------------------------

            if (
                toMarker &&
                toPlace
            ) {

                toMarker.setPopupContent(
                    `<strong>TO</strong><br>
                    ${escapeHTML(toPlace.name)}`
                );

            }


            // ------------------------------------------
            // Close search results
            // ------------------------------------------

            fromResults.style.display =
                "none";

            toResults.style.display =
                "none";

            fromResults.innerHTML =
                "";

            toResults.innerHTML =
                "";


            // ------------------------------------------
            // Remove old route
            // ------------------------------------------

            if (routeLine) {

                map.removeLayer(
                    routeLine
                );

                routeLine =
                    null;

            }


            // ------------------------------------------
            // Hide old results
            // ------------------------------------------

            resultCard.classList.add(
                "hidden"
            );

            flightLevelCard.classList.add(
                "hidden"
            );


            // ------------------------------------------
            // Swap animation
            // ------------------------------------------

            swapBtn.classList.add(
                "swapping"
            );


            setTimeout(
                function () {

                    swapBtn.classList.remove(
                        "swapping"
                    );

                },
                300
            );

        }
    );

}


// ======================================================
// 6. SEARCH FROM LOCATION
// ======================================================

fromInput.addEventListener(
    "input",
    function () {

        clearTimeout(
            fromSearchTimer
        );


        fromSearchTimer =
            setTimeout(
                function () {

                    searchLocations(
                        fromInput.value,
                        fromResults,
                        "from"
                    );

                },
                400
            );

    }
);


// ======================================================
// 7. SEARCH TO LOCATION
// ======================================================

toInput.addEventListener(
    "input",
    function () {

        clearTimeout(
            toSearchTimer
        );


        toSearchTimer =
            setTimeout(
                function () {

                    searchLocations(
                        toInput.value,
                        toResults,
                        "to"
                    );

                },
                400
            );

    }
);


// ======================================================
// 8. SEARCH LOCATIONS
// ======================================================

async function searchLocations(
    query,
    resultContainer,
    type
) {

    query =
        query.trim();


    // ------------------------------------------
    // Ignore very short searches
    // ------------------------------------------

    if (query.length < 2) {

        resultContainer.style.display =
            "none";

        resultContainer.innerHTML =
            "";

        return;

    }


    // ------------------------------------------
    // Show loading
    // ------------------------------------------

    resultContainer.innerHTML = `
        <div class="search-result">
            Searching Uganda...
        </div>
    `;


    resultContainer.style.display =
        "block";


    try {

        // --------------------------------------
        // Search parameters
        // --------------------------------------

        const params =
            new URLSearchParams({

                q: query,

                limit: "8",

                lang: "en",

                bbox:
                    "29.5,-1.5,35.2,4.3"

            });


        // --------------------------------------
        // Photon API
        // --------------------------------------

        const response =
            await fetch(
                `https://photon.komoot.io/api/?${params}`
            );


        if (!response.ok) {

            throw new Error(
                `Search request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        const features =
            data.features || [];


        // --------------------------------------
        // Filter Uganda
        // --------------------------------------

        const results =
            features.filter(
                function (place) {

                    if (
                        !place.geometry ||
                        !place.geometry.coordinates
                    ) {

                        return false;

                    }


                    const longitude =
                        parseFloat(
                            place.geometry.coordinates[0]
                        );


                    const latitude =
                        parseFloat(
                            place.geometry.coordinates[1]
                        );


                    return (
                        latitude >= -1.5 &&
                        latitude <= 4.3 &&
                        longitude >= 29.5 &&
                        longitude <= 35.2
                    );

                }
            );


        displaySearchResults(
            results,
            resultContainer,
            type
        );


    } catch (error) {

        console.error(
            "Location search error:",
            error
        );


        resultContainer.innerHTML = `
            <div class="search-result">
                Unable to search right now.
                Please check your internet connection.
            </div>
        `;


        resultContainer.style.display =
            "block";

    }

}


// ======================================================
// 9. DISPLAY SEARCH RESULTS
// ======================================================

function displaySearchResults(
    results,
    container,
    type
) {

    container.innerHTML =
        "";


    // ------------------------------------------
    // No results
    // ------------------------------------------

    if (
        !results ||
        results.length === 0
    ) {

        container.innerHTML = `
            <div class="search-result">
                No matching location found in Uganda.
            </div>
        `;


        container.style.display =
            "block";

        return;

    }


    // ------------------------------------------
    // Display each result
    // ------------------------------------------

    results.forEach(
        function (place) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "search-result";


            const properties =
                place.properties || {};


            const coordinates =
                place.geometry &&
                place.geometry.coordinates
                    ? place.geometry.coordinates
                    : null;


            if (!coordinates) {

                return;

            }


            const longitude =
                parseFloat(
                    coordinates[0]
                );


            const latitude =
                parseFloat(
                    coordinates[1]
                );


            // ----------------------------------
            // Location name
            // ----------------------------------

            const name =
                properties.name ||
                properties.city ||
                properties.town ||
                properties.village ||
                properties.county ||
                "Unknown location";


            // ----------------------------------
            // Address
            // ----------------------------------

            const addressParts = [];


            if (properties.street) {

                addressParts.push(
                    properties.street
                );

            }


            if (properties.city) {

                addressParts.push(
                    properties.city
                );

            }


            if (properties.county) {

                addressParts.push(
                    properties.county
                );

            }


            if (properties.state) {

                addressParts.push(
                    properties.state
                );

            }


            const address =
                addressParts.length > 0
                    ? addressParts.join(", ")
                    : "Uganda";


            // ----------------------------------
            // Result HTML
            // ----------------------------------

            item.innerHTML = `

                <div class="search-result-name">
                    ${escapeHTML(name)}
                </div>

                <div class="search-result-address">
                    ${escapeHTML(address)}
                </div>

            `;


            // ----------------------------------
            // Select location
            // ----------------------------------

            item.addEventListener(
                "click",
                function () {

                    selectLocation(
                        {
                            name:
                                name,

                            address:
                                address,

                            lat:
                                latitude,

                            lon:
                                longitude

                        },
                        type
                    );

                }
            );


            container.appendChild(
                item
            );

        }
    );


    container.style.display =
        "block";

}


// ======================================================
// 10. SELECT LOCATION
// ======================================================

function selectLocation(
    place,
    type
) {

    const latitude =
        parseFloat(
            place.lat
        );


    const longitude =
        parseFloat(
            place.lon
        );


    const selectedPlace = {

        name:
            place.name,

        address:
            place.address,

        lat:
            latitude,

        lon:
            longitude

    };


    // ==================================================
    // FROM
    // ==================================================

    if (type === "from") {

        fromPlace =
            selectedPlace;


        fromInput.value =
            selectedPlace.name;


        fromResults.style.display =
            "none";


        // Remove previous marker

        if (fromMarker) {

            map.removeLayer(
                fromMarker
            );

        }


        // Create FROM marker

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

    }


    // ==================================================
    // TO
    // ==================================================

    else {

        toPlace =
            selectedPlace;


        toInput.value =
            selectedPlace.name;


        toResults.style.display =
            "none";


        // Remove previous marker

        if (toMarker) {

            map.removeLayer(
                toMarker
            );

        }


        // Create TO marker

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


    // ==================================================
    // Center map
    // ==================================================

    map.setView(
        [
            latitude,
            longitude
        ],
        12
    );

}


// ======================================================
// 11. CALCULATE ROUTE BUTTON
// ======================================================

calculateBtn.addEventListener(
    "click",
    calculateRoute
);


// ======================================================
// 12. CALCULATE ROUTE
// ======================================================

async function calculateRoute() {

    // ------------------------------------------
    // Validate FROM
    // ------------------------------------------

    if (!fromPlace) {

        alert(
            "Please select a starting location."
        );

        return;

    }


    // ------------------------------------------
    // Validate TO
    // ------------------------------------------

    if (!toPlace) {

        alert(
            "Please select a destination."
        );

        return;

    }


    // ------------------------------------------
    // Same location
    // ------------------------------------------

    if (
        fromPlace.lat === toPlace.lat &&
        fromPlace.lon === toPlace.lon
    ) {

        alert(
            "The starting location and destination cannot be the same."
        );

        return;

    }


    // ------------------------------------------
    // Show loading
    // ------------------------------------------

    loading.classList.remove(
        "hidden"
    );


    try {

        // ==================================================
        // OSRM ROUTING
        // ==================================================

        const url =
            `https://router.project-osrm.org/route/v1/driving/` +

            `${fromPlace.lon},${fromPlace.lat};` +

            `${toPlace.lon},${toPlace.lat}` +

            `?overview=full&geometries=geojson`;


        const response =
            await fetch(
                url
            );


        if (!response.ok) {

            throw new Error(
                `Routing service failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        // ------------------------------------------
        // Validate route
        // ------------------------------------------

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


        // ==================================================
        // DRAW ROUTE
        // ==================================================

        drawRoute(
            route.geometry
        );


        // ==================================================
        // DISTANCE
        // ==================================================

        const distanceKm =
            route.distance / 1000;


        // ==================================================
        // BEARING
        // ==================================================

        const bearing =
            calculateBearing(
                fromPlace.lat,
                fromPlace.lon,
                toPlace.lat,
                toPlace.lon
            );


        // ==================================================
        // COMPASS
        // ==================================================

        const compass =
            getCompassDirection(
                bearing
            );


        // ==================================================
        // EAST / WEST
        // ==================================================

        const direction =
            getEastWest(
                fromPlace,
                toPlace
            );


        // ==================================================
        // DISPLAY EVERYTHING
        // ==================================================

        displayResult(
            direction,
            compass,
            bearing,
            distanceKm
        );


    } catch (error) {

        console.error(
            "Route calculation error:",
            error
        );


        alert(
            "Unable to calculate the route. Please check your internet connection and try again."
        );

    } finally {

        loading.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// 13. DRAW ROUTE
// ======================================================

function drawRoute(
    geometry
) {

    // Remove old route

    if (routeLine) {

        map.removeLayer(
            routeLine
        );

    }


    // Convert coordinates

    const latLngs =
        geometry.coordinates.map(
            function (coordinate) {

                return [
                    coordinate[1],
                    coordinate[0]
                ];

            }
        );


    // Draw route

    routeLine =
        L.polyline(
            latLngs,
            {
                weight: 6,

                opacity: 0.85,

                color: "#1266f1"
            }
        ).addTo(map);


    // Fit map

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
// 14. BEARING CALCULATION
// ======================================================

function calculateBearing(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const toRadians =
        function (degrees) {

            return (
                degrees *
                Math.PI /
                180
            );

        };


    const toDegrees =
        function (radians) {

            return (
                radians *
                180 /
                Math.PI
            );

        };


    const φ1 =
        toRadians(
            lat1
        );


    const φ2 =
        toRadians(
            lat2
        );


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
            Math.atan2(
                y,
                x
            )
        );


    bearing =
        (
            bearing +
            360
        ) % 360;


    return bearing;

}


// ======================================================
// 15. COMPASS DIRECTION
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
// 16. EAST / WEST
// ======================================================

function getEastWest(
    from,
    to
) {

    const longitudeDifference =
        to.lon -
        from.lon;


    const tolerance =
        0.0001;


    // Almost same longitude

    if (
        Math.abs(
            longitudeDifference
        ) <= tolerance
    ) {

        return "NORTH/SOUTH";

    }


    // Destination east

    if (
        longitudeDifference > 0
    ) {

        return "EASTBOUND";

    }


    // Destination west

    return "WESTBOUND";

}


// ======================================================
// 17. FLIGHT LEVEL REMINDER
// ======================================================

function displayFlightLevelReminder(
    direction
) {

    // Safety check

    if (
        !flightLevelCard ||
        !flightLevelDirection ||
        !flightLevelMessage ||
        !flightLevels
    ) {

        return;

    }


    // Always show card after route calculation

    flightLevelCard.classList.remove(
        "hidden"
    );


    // ==================================================
    // EASTBOUND
    // ==================================================

    if (
        direction === "EASTBOUND"
    ) {

        flightLevelDirection.textContent =
            "EASTBOUND — ODD LEVELS";


        flightLevelDirection.style.color =
            "#159447";


        flightLevelMessage.textContent =
            "Eastbound traffic is associated with odd flight levels under the applicable semicircular rule.";


        flightLevels.innerHTML = `

            <span class="flight-level">
                FL 110
            </span>

            <span class="flight-level">
                FL 130
            </span>

            <span class="flight-level">
                FL 150
            </span>

            <span class="flight-level">
                FL 170
            </span>

            <span class="flight-level">
                FL 190
            </span>

        `;

    }


    // ==================================================
    // WESTBOUND
    // ==================================================

    else if (
        direction === "WESTBOUND"
    ) {

        flightLevelDirection.textContent =
            "WESTBOUND — EVEN LEVELS";


        flightLevelDirection.style.color =
            "#1266f1";


        flightLevelMessage.textContent =
            "Westbound traffic is associated with even flight levels under the applicable semicircular rule.";


        flightLevels.innerHTML = `

            <span class="flight-level">
                FL 120
            </span>

            <span class="flight-level">
                FL 140
            </span>

            <span class="flight-level">
                FL 160
            </span>

            <span class="flight-level">
                FL 180
            </span>

            <span class="flight-level">
                FL 200
            </span>

        `;

    }


    // ==================================================
    // NORTH / SOUTH
    // ==================================================

    else {

        flightLevelDirection.textContent =
            "NORTH / SOUTH";


        flightLevelDirection.style.color =
            "#6b7280";


        flightLevelMessage.textContent =
            "This route is primarily north/south. The east/west semicircular reminder does not directly apply.";


        flightLevels.innerHTML =
            "";

    }


}


// ======================================================
// 18. DISPLAY RESULT
// ======================================================

function displayResult(
    direction,
    compass,
    bearing,
    distanceKm
) {

    // ------------------------------------------
    // Show result card
    // ------------------------------------------

    resultCard.classList.remove(
        "hidden"
    );


    // ------------------------------------------
    // Flight level reminder
    // ------------------------------------------

    displayFlightLevelReminder(
        direction
    );


    // ------------------------------------------
    // Direction
    // ------------------------------------------

    directionResult.textContent =
        direction;


    // ------------------------------------------
    // Locations
    // ------------------------------------------

    fromName.textContent =
        fromPlace.name;


    toName.textContent =
        toPlace.name;


    // ------------------------------------------
    // Bearing
    // ------------------------------------------

    if (bearingValue) {

        bearingValue.textContent =
            `${bearing.toFixed(1)}°`;

    }


    // ------------------------------------------
    // Compass
    // ------------------------------------------

    if (compassValue) {

        compassValue.textContent =
            compass;

    }


    // ------------------------------------------
    // Distance
    // ------------------------------------------

    if (
        distanceKm < 1
    ) {

        distanceValue.textContent =
            `${(
                distanceKm *
                1000
            ).toFixed(0)} m`;

    }

    else {

        distanceValue.textContent =
            `${distanceKm.toFixed(1)} km`;

    }


    // ------------------------------------------
    // Arrow
    // ------------------------------------------

    directionArrow.textContent =
        getArrow(
            compass
        );


    directionArrow.style.transform =
        `rotate(${bearing}deg)`;


    // ==================================================
    // EASTBOUND STYLE
    // ==================================================

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


    // ==================================================
    // WESTBOUND STYLE
    // ==================================================

    else if (
        direction === "WESTBOUND"
    ) {

        directionResult.style.color =
            "#1266f1";


        directionArrow.style.background =
            "#edf4ff";


        directionArrow.style.color =
            "#1266f1";

    }


    // ==================================================
    // NORTH / SOUTH
    // ==================================================

    else {

        directionResult.style.color =
            "#6b7280";


        directionArrow.style.background =
            "#f3f4f6";


        directionArrow.style.color =
            "#6b7280";

    }

}


// ======================================================
// 19. ARROW
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


    return (
        arrows[compass] ||
        "↑"
    );

}


// ======================================================
// 20. CLEAR EVERYTHING
// ======================================================

clearBtn.addEventListener(
    "click",
    clearMap
);


function clearMap() {

    // ------------------------------------------
    // Reset locations
    // ------------------------------------------

    fromPlace =
        null;

    toPlace =
        null;


    // ------------------------------------------
    // Clear inputs
    // ------------------------------------------

    fromInput.value =
        "";

    toInput.value =
        "";


    // ------------------------------------------
    // Remove FROM marker
    // ------------------------------------------

    if (fromMarker) {

        map.removeLayer(
            fromMarker
        );

        fromMarker =
            null;

    }


    // ------------------------------------------
    // Remove TO marker
    // ------------------------------------------

    if (toMarker) {

        map.removeLayer(
            toMarker
        );

        toMarker =
            null;

    }


    // ------------------------------------------
    // Remove route
    // ------------------------------------------

    if (routeLine) {

        map.removeLayer(
            routeLine
        );

        routeLine =
            null;

    }


    // ------------------------------------------
    // Hide cards
    // ------------------------------------------

    resultCard.classList.add(
        "hidden"
    );


    flightLevelCard.classList.add(
        "hidden"
    );


    // ------------------------------------------
    // Clear search results
    // ------------------------------------------

    fromResults.style.display =
        "none";

    toResults.style.display =
        "none";


    fromResults.innerHTML =
        "";

    toResults.innerHTML =
        "";


    // ------------------------------------------
    // Reset map
    // ------------------------------------------

    map.setView(
        [
            1.3733,
            32.2903
        ],
        7
    );

}


// ======================================================
// 21. CLOSE SEARCH RESULTS
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
// 22. ESCAPE HTML
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


// ======================================================
// 23. MAP RESIZE FIX
// ======================================================

setTimeout(
    function () {

        map.invalidateSize();

    },
    500
);
