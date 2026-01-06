# Event Finder with Geolocation

A geo-spatial event search engine powered by Elasticsearch. Find concerts, conferences, sports events, and festivals near you with interactive maps and advanced filtering.

## Features

- **Full-text search** with fuzzy matching and relevance scoring
- **Geo-spatial queries** - Find events within radius (10-500km)
- **Interactive map view** with Leaflet.js
- **Smart filtering** - Category, date range, price, distance
- **42 events** across 14 major cities worldwide
- **Auto data loading** on first startup

## Tech Stack

- **Backend**: Node.js, Express.js
- **Search**: Elasticsearch 8.17.0 (geo_point, geo_distance, multi_match queries)
- **Frontend**: Vanilla JavaScript, Leaflet.js
- **Infrastructure**: Docker

## Quick Start

1. **Install dependencies**
```bash
npm install
```

2. **Start Elasticsearch**
```bash
docker-compose up -d
```

3. **Start the app**
```bash
npm start
```

4. **Open browser**
```
http://localhost:3000
```

The server automatically loads 42 events on first run.

## API Endpoints

### Search Events
```
GET /api/events/search
```
**Parameters**: `q`, `category`, `date_from`, `date_to`, `price_max`, `lat`, `lon`, `distance`, `page`, `size`, `sort`

**Examples**:
```bash
# Find music events within 50km of New York
curl "http://localhost:3000/api/events/search?category=Music&lat=40.7128&lon=-74.0060&distance=50km"

# Find free events
curl "http://localhost:3000/api/events/search?price_max=0"
```

### Other Endpoints
- `GET /api/events/map` - Get events in bounding box
- `GET /api/events/categories` - Get all categories
- `GET /api/events/:id` - Get event by ID
- `GET /api/events/stats/overview` - Get statistics

## Development

```bash
# Development mode with auto-reload
npm run dev

# Manually reload data
npm run load-data

# Check Elasticsearch health
curl http://localhost:3000/health

# Stop services
docker-compose down
```

## Project Structure

```
├── public/              # Frontend (HTML, CSS, JS)
├── scripts/             # Data loading script
├── server.js            # Express API
├── docker-compose.yml   # Elasticsearch setup
└── package.json         # Dependencies
```

## Key Elasticsearch Features

- **geo_point** mapping for GPS coordinates
- **geo_distance** queries for radius search
- **geo_bounding_box** for map viewport
- **multi_match** with field boosting (title^3, description^2)
- **aggregations** for category statistics
- **script_fields** for distance calculations
