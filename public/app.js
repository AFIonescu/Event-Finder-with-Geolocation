const API_BASE = 'http://localhost:3000/api';

let currentPage = 1;
let currentQuery = '';
let currentFilters = {};
let currentLocation = null;
let map = null;
let markers = [];

// Category icons
const categoryIcons = {
    'Music': '🎵',
    'Sports': '⚽',
    'Conference': '💼',
    'Theater': '🎭',
    'Festival': '🎪',
    'Comedy': '😂',
    'Art': '🎨'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    setupEventListeners();
    searchEvents(1);
});

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/events/categories`);
        const categories = await response.json();

        const categoryFilter = document.getElementById('categoryFilter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            const icon = categoryIcons[category.name] || '📅';
            option.textContent = `${icon} ${category.name} (${category.count})`;
            categoryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Search events
async function searchEvents(page = 1) {
    const searchInput = document.getElementById('searchInput').value.trim();
    const category = document.getElementById('categoryFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const priceMax = document.getElementById('priceMax').value;
    const sortBy = document.getElementById('sortBy').value;
    const distance = document.getElementById('distanceRange').value;

    currentQuery = searchInput;
    currentPage = page;
    currentFilters = { category, dateFrom, dateTo, priceMax, sortBy, distance };

    const params = new URLSearchParams({
        q: searchInput,
        page: page,
        size: 20,
        sort: sortBy
    });

    if (category) params.append('category', category);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (priceMax) params.append('price_max', priceMax);

    if (currentLocation) {
        params.append('lat', currentLocation.lat);
        params.append('lon', currentLocation.lon);
        params.append('distance', distance);
    }

    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '<div class="loading">Searching events...</div>';

    try {
        const response = await fetch(`${API_BASE}/events/search?${params}`);
        const data = await response.json();

        displayResults(data);
        displayPagination(data);
    } catch (error) {
        resultsContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// Display search results
function displayResults(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsCount = document.getElementById('resultsCount');
    const locationInfo = document.getElementById('locationInfo');

    if (data.total === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h2>No events found</h2>
                <p>Try adjusting your search criteria or location</p>
            </div>
        `;
        resultsCount.textContent = 'No results found';
        return;
    }

    resultsCount.textContent = `Found ${data.total} event${data.total === 1 ? '' : 's'}`;

    if (currentLocation) {
        locationInfo.textContent = `📍 Near: ${currentLocation.name || 'Your location'}`;
    } else {
        locationInfo.textContent = '';
    }

    const eventsHTML = data.events.map(event => {
        const title = event.highlight?.title ? event.highlight.title[0] : event.title;
        const description = event.highlight?.description ? event.highlight.description[0] : event.description;
        const icon = categoryIcons[event.category] || '📅';
        const priceDisplay = event.price === 0 ? 'FREE' : `$${event.price}`;
        const priceClass = event.price === 0 ? 'free' : '';

        let distanceBadge = '';
        if (event.distance) {
            distanceBadge = `<span class="distance-badge">📍 ${event.distance} km away</span>`;
        }

        return `
            <div class="event-card">
                <div class="event-header">
                    <div style="flex: 1;">
                        <h2 class="event-title">${title}</h2>
                        <div class="event-badges">
                            <span class="category-badge">${icon} ${event.category}</span>
                            ${distanceBadge}
                        </div>
                    </div>
                    <div class="price-badge ${priceClass}">${priceDisplay}</div>
                </div>

                <div class="event-meta">
                    <div class="meta-item">
                        <strong>📅 Date:</strong> ${new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </div>
                    <div class="meta-item">
                        <strong>📍 Venue:</strong> ${event.venue}
                    </div>
                    <div class="meta-item">
                        <strong>🏙️ Location:</strong> ${event.city}, ${event.country}
                    </div>
                    <div class="meta-item">
                        <strong>🎯 Organizer:</strong> ${event.organizer}
                    </div>
                </div>

                <p class="event-description">${description}</p>

                <div class="event-footer">
                    <span class="attendees">👥 ${event.attendees.toLocaleString()} expected attendees</span>
                </div>
            </div>
        `;
    }).join('');

    resultsContainer.innerHTML = eventsHTML;
}

// Display pagination
function displayPagination(data) {
    const paginationContainer = document.getElementById('pagination');
    const totalPages = Math.ceil(data.total / data.size);

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    paginationHTML += `
        <button class="page-btn" onclick="searchEvents(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ← Previous
        </button>
    `;

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="searchEvents(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span style="color: white; padding: 10px;">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="searchEvents(${i})">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span style="color: white; padding: 10px;">...</span>`;
        }
        paginationHTML += `<button class="page-btn" onclick="searchEvents(${totalPages})">${totalPages}</button>`;
    }

    paginationHTML += `
        <button class="page-btn" onclick="searchEvents(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Next →
        </button>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

// Get user location
function getUserLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    const locationBtn = document.getElementById('locationBtn');
    locationBtn.textContent = '⏳ Getting location...';
    locationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                name: 'Your location'
            };
            locationBtn.textContent = '✓ Location set';
            locationBtn.disabled = false;
            searchEvents(1);
        },
        (error) => {
            alert('Unable to get your location: ' + error.message);
            locationBtn.textContent = '📍 Find My Location';
            locationBtn.disabled = false;
        }
    );
}

// Search location by city name
async function searchLocation() {
    const locationInput = document.getElementById('locationInput').value.trim();
    if (!locationInput) return;

    // Predefined major cities for demo
    const cities = {
        'new york': { lat: 40.7128, lon: -74.0060 },
        'los angeles': { lat: 34.0522, lon: -118.2437 },
        'chicago': { lat: 41.8781, lon: -87.6298 },
        'san francisco': { lat: 37.7749, lon: -122.4194 },
        'london': { lat: 51.5074, lon: -0.1278 },
        'paris': { lat: 48.8566, lon: 2.3522 },
        'tokyo': { lat: 35.6762, lon: 139.6503 },
        'berlin': { lat: 52.5200, lon: 13.4050 },
        'barcelona': { lat: 41.3874, lon: 2.1686 },
        'amsterdam': { lat: 52.3676, lon: 4.9041 },
        'austin': { lat: 30.2672, lon: -97.7431 },
        'miami': { lat: 25.7617, lon: -80.1918 },
        'seattle': { lat: 47.6062, lon: -122.3321 },
        'sydney': { lat: -33.8688, lon: 151.2093 }
    };

    const cityKey = locationInput.toLowerCase();
    if (cities[cityKey]) {
        currentLocation = {
            ...cities[cityKey],
            name: locationInput
        };
        searchEvents(1);
    } else {
        alert('City not found. Try: New York, London, Paris, Tokyo, etc.');
    }
}

// Initialize map
function initializeMap() {
    if (map) {
        map.remove();
    }

    map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    loadMapEvents();
}

// Load events on map
async function loadMapEvents() {
    const category = document.getElementById('categoryFilter').value;

    // Get current map bounds
    const bounds = map.getBounds();
    const params = new URLSearchParams({
        top_lat: bounds.getNorth(),
        bottom_lat: bounds.getSouth(),
        left_lon: bounds.getWest(),
        right_lon: bounds.getEast()
    });

    if (category) params.append('category', category);

    try {
        const response = await fetch(`${API_BASE}/events/map?${params}`);
        const data = await response.json();

        // Clear existing markers
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        // Add new markers
        data.events.forEach(event => {
            const icon = categoryIcons[event.category] || '📅';
            const marker = L.marker([event.location.lat, event.location.lon])
                .addTo(map)
                .bindPopup(`
                    <div class="popup-content">
                        <div class="popup-title">${icon} ${event.title}</div>
                        <div class="popup-info"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</div>
                        <div class="popup-info"><strong>Venue:</strong> ${event.venue}</div>
                        <div class="popup-info"><strong>City:</strong> ${event.city}</div>
                        <div class="popup-info"><strong>Price:</strong> ${event.price === 0 ? 'FREE' : '$' + event.price}</div>
                    </div>
                `);
            markers.push(marker);
        });

        document.getElementById('mapStats').textContent =
            `Showing ${data.events.length} events on map (${data.total} total in view)`;

    } catch (error) {
        console.error('Error loading map events:', error);
    }
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('priceMax').value = '';
    document.getElementById('sortBy').value = 'relevance';
    document.getElementById('locationInput').value = '';
    currentLocation = null;
    document.getElementById('locationBtn').textContent = '📍 Find My Location';
    searchEvents(1);
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', () => searchEvents(1));
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchEvents(1);
    });

    document.getElementById('locationInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchLocation();
    });

    document.getElementById('locationBtn').addEventListener('click', getUserLocation);

    document.getElementById('categoryFilter').addEventListener('change', () => {
        searchEvents(1);
        if (map) loadMapEvents();
    });
    document.getElementById('dateFrom').addEventListener('change', () => searchEvents(1));
    document.getElementById('dateTo').addEventListener('change', () => searchEvents(1));
    document.getElementById('priceMax').addEventListener('change', () => searchEvents(1));
    document.getElementById('sortBy').addEventListener('change', () => searchEvents(1));
    document.getElementById('distanceRange').addEventListener('change', () => searchEvents(1));
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    // View toggle
    document.getElementById('listViewBtn').addEventListener('click', () => {
        document.getElementById('listViewBtn').classList.add('active');
        document.getElementById('mapViewBtn').classList.remove('active');
        document.getElementById('listView').classList.add('active');
        document.getElementById('mapView').classList.remove('active');
    });

    document.getElementById('mapViewBtn').addEventListener('click', () => {
        document.getElementById('mapViewBtn').classList.add('active');
        document.getElementById('listViewBtn').classList.remove('active');
        document.getElementById('mapView').classList.add('active');
        document.getElementById('listView').classList.remove('active');

        if (!map) {
            initializeMap();
        }
    });
}
