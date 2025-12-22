require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('@elastic/elasticsearch');

const app = express();
const PORT = process.env.PORT || 3000;

// Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'
});

// Initialize data on startup
async function initializeData() {
  try {
    const { loadEventsData } = require('./scripts/loadEvents');
    await loadEventsData(client);
    console.log('✓ Event data initialized');
  } catch (error) {
    console.error('Error initializing data:', error.message);
  }
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/health', async (req, res) => {
  try {
    const health = await client.cluster.health();
    res.json({ status: 'ok', elasticsearch: health });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Search events with geo-filtering
app.get('/api/events/search', async (req, res) => {
  try {
    const {
      q = '',
      category = '',
      date_from = '',
      date_to = '',
      price_max = '',
      lat = '',
      lon = '',
      distance = '50km',
      page = 1,
      size = 20,
      sort = 'relevance'
    } = req.query;

    const from = (page - 1) * size;

    // Build query
    const must = [];
    const filter = [];

    // Text search across multiple fields
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ['title^3', 'description^2', 'venue', 'organizer', 'city'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    } else {
      must.push({ match_all: {} });
    }

    // Category filter
    if (category) {
      filter.push({
        term: { 'category.keyword': category }
      });
    }

    // Date range filter
    if (date_from || date_to) {
      const range = {};
      if (date_from) range.gte = date_from;
      if (date_to) range.lte = date_to;
      filter.push({ range: { date: range } });
    }

    // Price filter
    if (price_max) {
      filter.push({
        range: { price: { lte: parseFloat(price_max) } }
      });
    }

    // Geo-distance filter
    if (lat && lon) {
      filter.push({
        geo_distance: {
          distance: distance,
          location: {
            lat: parseFloat(lat),
            lon: parseFloat(lon)
          }
        }
      });
    }

    // Determine sort order
    let sortOption;
    if (lat && lon && sort === 'distance') {
      sortOption = [
        {
          _geo_distance: {
            location: {
              lat: parseFloat(lat),
              lon: parseFloat(lon)
            },
            order: 'asc',
            unit: 'km'
          }
        }
      ];
    } else {
      switch (sort) {
        case 'date':
          sortOption = [{ date: 'asc' }];
          break;
        case 'price':
          sortOption = [{ price: 'asc' }];
          break;
        case 'popularity':
          sortOption = [{ attendees: 'desc' }];
          break;
        default:
          sortOption = ['_score', { date: 'asc' }];
      }
    }

    const searchBody = {
      query: {
        bool: {
          must,
          filter
        }
      },
      sort: sortOption,
      highlight: {
        fields: {
          title: {},
          description: {}
        }
      }
    };

    // Add distance calculation if location is provided
    if (lat && lon) {
      searchBody.script_fields = {
        distance: {
          script: {
            source: "doc['location'].arcDistance(params.lat, params.lon) / 1000",
            params: {
              lat: parseFloat(lat),
              lon: parseFloat(lon)
            }
          }
        }
      };
    }

    const result = await client.search({
      index: 'events',
      from: from,
      size: parseInt(size),
      body: searchBody
    });

    res.json({
      total: result.hits.total.value,
      page: parseInt(page),
      size: parseInt(size),
      events: result.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
        distance: hit.fields?.distance ? hit.fields.distance[0].toFixed(2) : null,
        highlight: hit.highlight
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events within bounding box (for map view)
app.get('/api/events/map', async (req, res) => {
  try {
    const { top_lat, bottom_lat, left_lon, right_lon, category = '' } = req.query;

    if (!top_lat || !bottom_lat || !left_lon || !right_lon) {
      return res.status(400).json({ error: 'Bounding box coordinates required' });
    }

    const filter = [
      {
        geo_bounding_box: {
          location: {
            top_left: {
              lat: parseFloat(top_lat),
              lon: parseFloat(left_lon)
            },
            bottom_right: {
              lat: parseFloat(bottom_lat),
              lon: parseFloat(right_lon)
            }
          }
        }
      }
    ];

    if (category) {
      filter.push({ term: { 'category.keyword': category } });
    }

    const result = await client.search({
      index: 'events',
      size: 1000, // Limit for map markers
      body: {
        query: {
          bool: {
            filter
          }
        }
      }
    });

    res.json({
      total: result.hits.total.value,
      events: result.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique categories
app.get('/api/events/categories', async (req, res) => {
  try {
    const result = await client.search({
      index: 'events',
      size: 0,
      body: {
        aggs: {
          categories: {
            terms: {
              field: 'category.keyword',
              size: 50
            }
          }
        }
      }
    });

    const categories = result.aggregations.categories.buckets.map(bucket => ({
      name: bucket.key,
      count: bucket.doc_count
    }));

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event by ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const result = await client.get({
      index: 'events',
      id: req.params.id
    });

    res.json(result._source);
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      res.status(404).json({ error: 'Event not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get stats
app.get('/api/events/stats/overview', async (req, res) => {
  try {
    const result = await client.search({
      index: 'events',
      size: 0,
      body: {
        aggs: {
          total_events: {
            value_count: {
              field: 'title.keyword'
            }
          },
          avg_price: {
            avg: {
              field: 'price'
            }
          },
          categories: {
            terms: {
              field: 'category.keyword',
              size: 10
            }
          },
          cities: {
            terms: {
              field: 'city.keyword',
              size: 10
            }
          }
        }
      }
    });

    res.json({
      total: result.aggregations.total_events.value,
      avgPrice: result.aggregations.avg_price.value?.toFixed(2) || 0,
      topCategories: result.aggregations.categories.buckets.map(b => ({
        name: b.key,
        count: b.doc_count
      })),
      topCities: result.aggregations.cities.buckets.map(b => ({
        name: b.key,
        count: b.doc_count
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Event Finder API running on http://localhost:${PORT}`);
  console.log(`Elasticsearch node: ${process.env.ELASTICSEARCH_NODE}`);

  // Initialize data on startup
  await initializeData();
});
