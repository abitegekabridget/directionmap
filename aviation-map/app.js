// ======================================================
// UGANDA ROUTE DIRECTION MAP
// ======================================================


// ======================================================
// 1. INITIALIZE MAP
// ======================================================

const map = L.map("map").setView(
    [1.3733, 32.2903],
    7
);


L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
        attribution:
            "&copy; OpenStreetMap contributors &copy; CARTO",

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


// ======================================================
// 4. FLIGHT LEVEL ELEMENTS
// ======================================================

const flightLevelCard =
    document.getElementById("flightLevelCard");

const flightLevelDirection =
    document.getElementById("flightLevelDirection");

const flightLevelMessage =
    document.getElementById("flightLevelMessage");

const flightLevels =
    document.getElementById("flightLevels");


// ======================================================
// 5. INITIAL STATE
// ======================================================

if (resultCard) {
    resultCard.classList.add("hidden");
}

if (flightLevelCard) {
    flightLevelCard.classList.add("hidden");
}


// ======================================================
// 6. SWAP FROM / TO
// ======================================================

if (swapBtn) {

    swapBtn.addEventListener(
        "click",
        function () {

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
            // SWAP TEXT
            // ------------------------------------------

            fromInput.value =
                oldToText;

            toInput.value =
                oldFromText;


            // ------------------------------------------
            // SWAP PLACES
            // ------------------------------------------

            fromPlace =
                oldToPlace;

            toPlace =
                oldFromPlace;


            // ------------------------------------------
            // SWAP MARKERS
            // ------------------------------------------

            fromMarker =
                oldToMarker;

            toMarker =
                oldFromMarker;


            // ------------------------------------------
            // UPDATE FROM MARKER
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
            // UPDATE TO MARKER
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
            // CLOSE SEARCH RESULTS
            // ------------------------------------------

            closeSearchResults();


            // ------------------------------------------
            // REMOVE OLD ROUTE
            // ------------------------------------------

            removeRoute();


            // ------------------------------------------
            // HIDE OLD RESULT CARDS
            // ------------------------------------------

            hideResultCards();


            // ------------------------------------------
            // ANIMATION
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
// 7. FROM SEARCH
// ======================================================

if (fromInput) {

    fromInput.addEventListener(
        "input",
        function () {

            clearTimeout(
                fromSearchTimer
            );


            // User changed the input,
            // so the previous selected place is no longer valid.

            fromPlace = null;


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

}


// ======================================================
// 8. TO SEARCH
// ======================================================

if (toInput) {

    toInput.addEventListener(
        "input",
        function () {

            clearTimeout(
                toSearchTimer
            );


            // User changed the input,
            // so the previous selected place is no longer valid.

            toPlace = null;


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

}


// ======================================================
// 9. SEARCH LOCATIONS
// ======================================================

async function searchLocations(
    query,
    resultContainer,
    type
) {

    if (!resultContainer) {
        return;
    }


    query =
        query.trim();


    // ----------------------------------------------
    // EMPTY SEARCH
    // ----------------------------------------------

    if (query.length < 2) {

        resultContainer.style.display =
            "none";

        resultContainer.innerHTML =
            "";

        return;

    }


    // ----------------------------------------------
    // SEARCH MESSAGE
    // ----------------------------------------------

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

                limit: "8",

                lang: "en",

                bbox:
                    "29.5,-1.5,35.2,4.3"

            });


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


        // ----------------------------------------------
        // FILTER TO UGANDA
        // ----------------------------------------------

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
// 10. DISPLAY SEARCH RESULTS
// ======================================================

function displaySearchResults(
    results,
    container,
    type
) {

    if (!container) {
        return;
    }


    container.innerHTML =
        "";


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


    results.forEach(
        function (place) {

            const item =
                document.createElement("div");


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


            // ------------------------------------------
            // LOCATION NAME
            // ------------------------------------------

            const name =
                properties.name ||
                properties.city ||
                properties.town ||
                properties.village ||
                properties.county ||
                "Unknown location";


            // ------------------------------------------
            // ADDRESS
            // ------------------------------------------

            const addressParts =
                [];


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


            // ------------------------------------------
            // DISPLAY RESULT
            // ------------------------------------------

            item.innerHTML = `

                <div class="search-result-name">
                    ${escapeHTML(name)}
                </div>

                <div class="search-result-address">
                    ${escapeHTML(address)}
                </div>

            `;


            // ------------------------------------------
            // CLICK RESULT
            // ------------------------------------------

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
// 11. SELECT LOCATION
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


        // ----------------------------------------------
        // CLOSE FROM SEARCH
        // ----------------------------------------------

        if (fromResults) {

            fromResults.style.display =
                "none";

            fromResults.innerHTML =
                "";

        }


        // ----------------------------------------------
        // REMOVE OLD MARKER
        // ----------------------------------------------

        if (fromMarker) {

            map.removeLayer(
                fromMarker
            );

        }


        // ----------------------------------------------
        // CREATE FROM MARKER
        // ----------------------------------------------

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


        // ----------------------------------------------
        // CLOSE TO SEARCH
        // ----------------------------------------------

        if (toResults) {

            toResults.style.display =
                "none";

            toResults.innerHTML =
                "";

        }


        // ----------------------------------------------
        // REMOVE OLD MARKER
        // ----------------------------------------------

        if (toMarker) {

            map.removeLayer(
                toMarker
            );

        }


        // ----------------------------------------------
        // CREATE TO MARKER
        // ----------------------------------------------

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


    // ----------------------------------------------
    // HIDE OLD ROUTE RESULTS
    // ----------------------------------------------

    if (resultCard) {

        resultCard.classList.add(
            "hidden"
        );

    }


    if (flightLevelCard) {

        flightLevelCard.classList.add(
            "hidden"
        );

    }


    // ----------------------------------------------
    // CENTER MAP
    // ----------------------------------------------

    map.setView(
        [
            latitude,
            longitude
        ],
        12
    );

}


// ======================================================
// 12. CALCULATE ROUTE BUTTON
// ======================================================

if (calculateBtn) {

    calculateBtn.addEventListener(
        "click",
        calculateRoute
    );

}


// ======================================================
// 13. CALCULATE ROUTE
// ======================================================

async function calculateRoute() {

    // ----------------------------------------------
    // CHECK FROM
    // ----------------------------------------------

    if (!fromPlace) {

        alert(
            "Please select a starting location."
        );

        return;

    }


    // ----------------------------------------------
    // CHECK TO
    // ----------------------------------------------

    if (!toPlace) {

        alert(
            "Please select a destination."
        );

        return;

    }


    // ----------------------------------------------
    // SAME LOCATION
    // ----------------------------------------------

    if (
        fromPlace.lat === toPlace.lat &&
        fromPlace.lon === toPlace.lon
    ) {

        alert(
            "The starting location and destination cannot be the same."
        );

        return;

    }


    // ----------------------------------------------
    // CLOSE SEARCH RESULTS
    // ----------------------------------------------

    closeSearchResults();


    // ----------------------------------------------
    // SHOW LOADING
    // ----------------------------------------------

    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }


    // ----------------------------------------------
    // HIDE OLD RESULTS WHILE CALCULATING
    // ----------------------------------------------

    if (flightLevelCard) {

        flightLevelCard.classList.add(
            "hidden"
        );

    }


    if (resultCard) {

        resultCard.classList.add(
            "hidden"
        );

    }


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
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `Routing service failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        // ----------------------------------------------
        // CHECK ROUTE
        // ----------------------------------------------

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
        // DISPLAY NORMAL RESULT CARD
        // ==================================================

        displayResult(
            direction,
            compass,
            bearing,
            distanceKm
        );


        // ==================================================
        // DISPLAY FLIGHT LEVEL
        // ==================================================

        displayFlightLevelReminder(
            direction
        );


        // ==================================================
        // CONSOLE
        // ==================================================

        console.log(
            "Route calculated:",
            {
                direction:
                    direction,

                compass:
                    compass,

                bearing:
                    bearing,

                distanceKm:
                    distanceKm
            }
        );


    } catch (error) {

        console.error(
            "Route calculation error:",
            error
        );


        if (resultCard) {

            resultCard.classList.add(
                "hidden"
            );

        }


        if (flightLevelCard) {

            flightLevelCard.classList.add(
                "hidden"
            );

        }


        alert(
            "Unable to calculate the route. Please check your internet connection and try again."
        );

    } finally {

        if (loading) {

            loading.classList.add(
                "hidden"
            );

        }

    }

}


// ======================================================
// 14. DRAW ROUTE
// ======================================================

function drawRoute(
    geometry
) {

    // ----------------------------------------------
    // REMOVE OLD ROUTE
    // ----------------------------------------------

    if (routeLine) {

        map.removeLayer(
            routeLine
        );

        routeLine =
            null;

    }


    // ----------------------------------------------
    // CHECK GEOMETRY
    // ----------------------------------------------

    if (
        !geometry ||
        !geometry.coordinates ||
        geometry.coordinates.length === 0
    ) {

        return;

    }


    // ----------------------------------------------
    // CONVERT COORDINATES
    // ----------------------------------------------

    const latLngs =
        geometry.coordinates.map(
            function (coordinate) {

                return [
                    coordinate[1],
                    coordinate[0]
                ];

            }
        );


    // ----------------------------------------------
    // CREATE ROUTE LINE
    // ----------------------------------------------

    routeLine =
        L.polyline(
            latLngs,
            {
                weight: 6,

                opacity: 0.85,

                color: "#1266f1"
            }
        ).addTo(map);


    // ----------------------------------------------
    // FIT MAP
    // ----------------------------------------------

    const bounds =
        routeLine.getBounds();


    if (bounds.isValid()) {

        map.fitBounds(
            bounds,
            {
                paddingTopLeft: [
                    40,
                    40
                ],

                paddingBottomRight: [
                    40,
                    40
                ]
            }
        );

    }

}


// ======================================================
// 15. BEARING CALCULATION
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


    const phi1 =
        toRadians(
            lat1
        );


    const phi2 =
        toRadians(
            lat2
        );


    const deltaLambda =
        toRadians(
            lon2 - lon1
        );


    const y =
        Math.sin(
            deltaLambda
        ) *
        Math.cos(
            phi2
        );


    const x =
        Math.cos(
            phi1
        ) *
        Math.sin(
            phi2
        )
        -
        Math.sin(
            phi1
        ) *
        Math.cos(
            phi2
        ) *
        Math.cos(
            deltaLambda
        );


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
// 16. COMPASS DIRECTION
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


    return directions[
        index
    ];

}


// ======================================================
// 17. EAST / WEST
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


    // ----------------------------------------------
    // SAME LONGITUDE
    // ----------------------------------------------

    if (
        Math.abs(
            longitudeDifference
        ) <= tolerance
    ) {

        const latitudeDifference =
            to.lat -
            from.lat;


        if (
            latitudeDifference > 0
        ) {

            return "NORTHBOUND";

        }


        if (
            latitudeDifference < 0
        ) {

            return "SOUTHBOUND";

        }


        return "NORTH/SOUTH";

    }


    // ----------------------------------------------
    // EAST
    // ----------------------------------------------

    if (
        longitudeDifference > 0
    ) {

        return "EASTBOUND";

    }


    // ----------------------------------------------
    // WEST
    // ----------------------------------------------

    return "WESTBOUND";

}


// ======================================================
// 18. FLIGHT LEVEL REMINDER
// ======================================================

function displayFlightLevelReminder(
    direction
) {

    if (!flightLevelCard) {

        return;

    }


    // ==================================================
    // EASTBOUND
    // ==================================================

    if (
        direction === "EASTBOUND"
    ) {

        flightLevelCard.classList.remove(
            "hidden"
        );


        if (flightLevelDirection) {

            flightLevelDirection.textContent =
                "EASTBOUND — ODD LEVELS";


            flightLevelDirection.style.color =
                "#159447";

        }


        if (flightLevelMessage) {

            flightLevelMessage.textContent =
                "Eastbound traffic is associated with odd flight levels under the applicable semicircular rule.";

        }


        if (flightLevels) {

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


        return;

    }


    // ==================================================
    // WESTBOUND
    // ==================================================

    if (
        direction === "WESTBOUND"
    ) {

        flightLevelCard.classList.remove(
            "hidden"
        );


        if (flightLevelDirection) {

            flightLevelDirection.textContent =
                "WESTBOUND — EVEN LEVELS";


            flightLevelDirection.style.color =
                "#1266f1";

        }


        if (flightLevelMessage) {

            flightLevelMessage.textContent =
                "Westbound traffic is associated with even flight levels under the applicable semicircular rule.";

        }


        if (flightLevels) {

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


        return;

    }


    // ==================================================
    // NORTH / SOUTH
    // ==================================================

    flightLevelCard.classList.add(
        "hidden"
    );

}


// ======================================================
// 19. DISPLAY ROUTE RESULT
// ======================================================

function displayResult(
    direction,
    compass,
    bearing,
    distanceKm
) {

    if (!resultCard) {

        console.error(
            "resultCard was not found in the HTML."
        );

        return;

    }


    // ==================================================
    // SHOW RESULT CARD
    // ==================================================

    resultCard.classList.remove(
        "hidden"
    );


    // ==================================================
    // DIRECTION
    // ==================================================

    if (directionResult) {

        directionResult.textContent =
            direction;

    }


    // ==================================================
    // FROM
    // ==================================================

    if (fromName && fromPlace) {

        fromName.textContent =
            fromPlace.name;

    }


    // ==================================================
    // TO
    // ==================================================

    if (toName && toPlace) {

        toName.textContent =
            toPlace.name;

    }


    // ==================================================
    // BEARING
    // ==================================================

    if (bearingValue) {

        bearingValue.textContent =
            `${bearing.toFixed(1)}°`;

    }


    // ==================================================
    // COMPASS
    // ==================================================

    if (compassValue) {

        compassValue.textContent =
            compass;

    }


    // ==================================================
    // DISTANCE
    // ==================================================

    if (distanceValue) {

        if (distanceKm < 1) {

            distanceValue.textContent =
                `${(
                    distanceKm * 1000
                ).toFixed(0)} m`;

        } else {

            distanceValue.textContent =
                `${distanceKm.toFixed(1)} km`;

        }

    }


    // ==================================================
    // DIRECTION ARROW
    // ==================================================

    if (directionArrow) {

        directionArrow.textContent =
            getArrow(
                compass
            );


        // Keep arrow visually pointing
        // toward calculated bearing.

        directionArrow.style.transform =
            `rotate(${bearing}deg)`;

    }


    // ==================================================
    // EASTBOUND STYLE
    // ==================================================

    if (
        direction === "EASTBOUND"
    ) {

        if (directionResult) {

            directionResult.style.color =
                "#159447";

        }


        if (directionArrow) {

            directionArrow.style.background =
                "#e9f8ef";

            directionArrow.style.color =
                "#159447";

        }

    }


    // ==================================================
    // WESTBOUND STYLE
    // ==================================================

    else if (
        direction === "WESTBOUND"
    ) {

        if (directionResult) {

            directionResult.style.color =
                "#1266f1";

        }


        if (directionArrow) {

            directionArrow.style.background =
                "#edf4ff";

            directionArrow.style.color =
                "#1266f1";

        }

    }


    // ==================================================
    // NORTH / SOUTH
    // ==================================================

    else {

        if (directionResult) {

            directionResult.style.color =
                "#6b7280";

        }


        if (directionArrow) {

            directionArrow.style.background =
                "#f3f4f6";

            directionArrow.style.color =
                "#6b7280";

        }

    }

}


// ======================================================
// 20. ARROW
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
// 21. REMOVE ROUTE
// ======================================================

function removeRoute() {

    if (routeLine) {

        map.removeLayer(
            routeLine
        );

        routeLine =
            null;

    }

}


// ======================================================
// 22. HIDE RESULT CARDS
// ======================================================

function hideResultCards() {

    if (resultCard) {

        resultCard.classList.add(
            "hidden"
        );

    }


    if (flightLevelCard) {

        flightLevelCard.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// 23. CLOSE SEARCH RESULTS
// ======================================================

function closeSearchResults() {

    if (fromResults) {

        fromResults.style.display =
            "none";

    }


    if (toResults) {

        toResults.style.display =
            "none";

    }

}


// ======================================================
// 24. CLEAR EVERYTHING
// ======================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        clearMap
    );

}


function clearMap() {

    // ----------------------------------------------
    // RESET PLACES
    // ----------------------------------------------

    fromPlace =
        null;

    toPlace =
        null;


    // ----------------------------------------------
    // RESET INPUTS
    // ----------------------------------------------

    if (fromInput) {

        fromInput.value =
            "";

    }


    if (toInput) {

        toInput.value =
            "";

    }


    // ----------------------------------------------
    // REMOVE FROM MARKER
    // ----------------------------------------------

    if (fromMarker) {

        map.removeLayer(
            fromMarker
        );

        fromMarker =
            null;

    }


    // ----------------------------------------------
    // REMOVE TO MARKER
    // ----------------------------------------------

    if (toMarker) {

        map.removeLayer(
            toMarker
        );

        toMarker =
            null;

    }


    // ----------------------------------------------
    // REMOVE ROUTE
    // ----------------------------------------------

    removeRoute();


    // ----------------------------------------------
    // HIDE RESULT CARD
    // ----------------------------------------------

    if (resultCard) {

        resultCard.classList.add(
            "hidden"
        );

    }


    // ----------------------------------------------
    // HIDE FLIGHT LEVEL CARD
    // ----------------------------------------------

    if (flightLevelCard) {

        flightLevelCard.classList.add(
            "hidden"
        );

    }


    // ----------------------------------------------
    // CLOSE SEARCH RESULTS
    // ----------------------------------------------

    closeSearchResults();


    if (fromResults) {

        fromResults.innerHTML =
            "";

    }


    if (toResults) {

        toResults.innerHTML =
            "";

    }


    // ----------------------------------------------
    // RESET MAP
    // ----------------------------------------------

    map.setView(
        [
            1.3733,
            32.2903
        ],
        7
    );

}


// ======================================================
// 25. CLOSE SEARCH RESULTS WHEN CLICKING OUTSIDE
// ======================================================

document.addEventListener(
    "click",
    function (event) {

        if (
            !event.target.closest(
                ".input-wrapper"
            )
        ) {

            closeSearchResults();

        }

    }
);


// ======================================================
// 26. ESCAPE HTML
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
// 27. MAP RESIZE FIX
// ======================================================

setTimeout(
    function () {

        map.invalidateSize();

    },
    500
);


// ======================================================
// 28. ADDITIONAL MAP RESIZE FIX
// ======================================================

// Helps especially when the map is inside a
// responsive desktop layout.

window.addEventListener(
    "resize",
    function () {

        setTimeout(
            function () {

                map.invalidateSize();

            },
            100
        );

    }
);
