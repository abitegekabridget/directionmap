

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
// 3. VARIABLES
// ======================================================

let fromPlace = null;

let toPlace = null;

let fromMarker = null;

let toMarker = null;

let routeLine = null;

let fromSearchTimer = null;

let toSearchTimer = null;


// ======================================================
// 4. GET HTML ELEMENTS
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
// 5. SWAP FROM / TO
// ======================================================

swapBtn.addEventListener(
    "click",
    function () {

        // ==============================================
        // SAVE CURRENT VALUES
        // ==============================================

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


        // ==============================================
        // SWAP TEXT
        // ==============================================

        fromInput.value =
            oldToText;

        toInput.value =
            oldFromText;


        // ==============================================
        // SWAP SELECTED LOCATIONS
        // ==============================================

        fromPlace =
            oldToPlace;

        toPlace =
            oldFromPlace;


        // ==============================================
        // SWAP MAP MARKERS
        // ==============================================

        fromMarker =
            oldToMarker;

        toMarker =
            oldFromMarker;


        // ==============================================
        // UPDATE FROM MARKER
        // ==============================================

        if (
            fromMarker &&
            fromPlace
        ) {

            fromMarker.setPopupContent(
                `<strong>FROM</strong><br>
                ${escapeHTML(fromPlace.name)}`
            );

        }


        // ==============================================
        // UPDATE TO MARKER
        // ==============================================

        if (
            toMarker &&
            toPlace
        ) {

            toMarker.setPopupContent(
                `<strong>TO</strong><br>
                ${escapeHTML(toPlace.name)}`
            );

        }


        // ==============================================
        // CLOSE SEARCH RESULTS
        // ==============================================

        fromResults.style.display =
            "none";

        toResults.style.display =
            "none";

        fromResults.innerHTML =
            "";

        toResults.innerHTML =
            "";


        // ==============================================
        // REMOVE OLD ROUTE
        // ==============================================

        if (routeLine) {

            map.removeLayer(
                routeLine
            );

            routeLine =
                null;

        }


        // ==============================================
        // HIDE OLD RESULT
        // ==============================================

        resultCard.classList.add(
            "hidden"
        );


        // ==============================================
        // ANIMATION
        // ==============================================

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
// ======================================================
// 5. SEARCH FROM LOCATION
// ======================================================

fromInput.addEventListener(
    "input",
    function () {

        clearTimeout(fromSearchTimer);

        fromSearchTimer = setTimeout(
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
// 6. SEARCH TO LOCATION
// ======================================================

toInput.addEventListener(
    "input",
    function () {

        clearTimeout(toSearchTimer);

        toSearchTimer = setTimeout(
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




async function searchLocations(
    query,
    resultContainer,
    type
) {

    query = query.trim();


    if (query.length < 2) {

        resultContainer.style.display =
            "none";

        resultContainer.innerHTML = "";

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


        // Keep only locations that are actually
        // within the Uganda bounding box.

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
// 8. DISPLAY SEARCH RESULTS
// ======================================================

function displaySearchResults(
    results,
    container,
    type
) {

    container.innerHTML = "";


    if (!results || results.length === 0) {

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


            // Build a readable name.

            const name =
                properties.name ||
                properties.city ||
                properties.town ||
                properties.village ||
                properties.county ||
                "Unknown location";


            // Build address.

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


            item.innerHTML = `

                <div class="search-result-name">
                    ${escapeHTML(name)}
                </div>

                <div class="search-result-address">
                    ${escapeHTML(address)}
                </div>

            `;


            item.addEventListener(
                "click",
                function () {

                    selectLocation(
                        {
                            name: name,

                            address: address,

                            lat: latitude,

                            lon: longitude

                        },
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
            place.name,

        address:
            place.address,

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


    // Center map on selected location.

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


    // Don't allow same place.

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
        //
        // We calculate the initial direction from the
        // starting point toward the destination.
        //
        // This gives:
        //
        // 0°   = North
        // 90°  = East
        // 180° = South
        // 270° = West
        //
        // ==================================================

        const bearing =
            calculateBearing(
                fromPlace.lat,
                fromPlace.lon,
                toPlace.lat,
                toPlace.lon
            );


        // ==================================================
        // COMPASS DIRECTION
        // ==================================================

        const compass =
            getCompassDirection(
                bearing
            );


        // ==================================================
        // EAST / WEST
        // ==================================================
        //
        // Instead of assuming:
        //
        // 0° - 179° = East
        //
        // we compare the actual longitude.
        //
        // ==================================================

        const direction =
            getEastWest(
                fromPlace,
                toPlace
            );


        // ==================================================
        // DISPLAY RESULT
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


    // Fit map around route.

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
//
// This determines whether the destination is east or west
// of the starting location based on longitude.
//
// Example:
//
// From longitude: 32.5
// To longitude:   33.5
//
// Destination is further east.
//
// Therefore: EASTBOUND
//
// ======================================================

function getEastWest(
    from,
    to
) {

    const longitudeDifference =
        to.lon - from.lon;


    // Small tolerance for locations that are
    // almost on the same longitude.

    const tolerance =
        0.0001;


    if (
        Math.abs(longitudeDifference) <=
        tolerance
    ) {

        return "NORTH/SOUTH";

    }


    if (
        longitudeDifference > 0
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


    // ==================================================
    // DISTANCE
    // ==================================================

    if (distanceKm < 1) {

        distanceValue.textContent =
            `${(
                distanceKm *
                1000
            ).toFixed(0)} m`;

    } else {

        distanceValue.textContent =
            `${distanceKm.toFixed(1)} km`;

    }


    // ==================================================
    // ARROW
    // ==================================================

    directionArrow.textContent =
        getArrow(compass);


    directionArrow.style.transform =
        `rotate(${bearing}deg)`;


    // ==================================================
    // EASTBOUND STYLING
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
    // WESTBOUND STYLING
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


    return (
        arrows[compass] ||
        "↑"
    );
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


    fromResults.innerHTML = "";

    toResults.innerHTML = "";


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


// ======================================================
// 20. MAP RESIZE FIX
// ======================================================
// Helps when the map is inside a container whose size
// changes after the page loads.
// ======================================================

setTimeout(
    function () {

        map.invalidateSize();

    },
    500
);
