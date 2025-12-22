require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'
});

const INDEX_NAME = 'events';

// Rich event dataset with real coordinates spanning 2025-2026
// Mix of past and future events for comprehensive testing
const events = [
  // New York Events
  { title: "Broadway Musical: Hamilton", category: "Theater", date: "2025-01-15", price: 150, attendees: 1200, venue: "Richard Rodgers Theatre", organizer: "Broadway LLC", city: "New York", country: "USA", description: "An American musical with music, lyrics, and book by Lin-Manuel Miranda. Experience the revolutionary story of Alexander Hamilton.", location: { lat: 40.7590, lon: -73.9845 } },
  { title: "NYC Tech Summit 2026", category: "Conference", date: "2026-02-10", price: 299, attendees: 5000, venue: "Javits Center", organizer: "Tech Events Inc", city: "New York", country: "USA", description: "The largest technology conference on the East Coast featuring AI, blockchain, and cloud computing sessions.", location: { lat: 40.7559, lon: -74.0026 } },
  { title: "Yankees vs Red Sox", category: "Sports", date: "2026-06-20", price: 75, attendees: 47000, venue: "Yankee Stadium", organizer: "MLB", city: "New York", country: "USA", description: "Classic rivalry game between New York Yankees and Boston Red Sox. Don't miss this epic baseball showdown.", location: { lat: 40.8296, lon: -73.9262 } },
  { title: "Metropolitan Opera: La Bohème", category: "Music", date: "2026-03-05", price: 180, attendees: 3800, venue: "Metropolitan Opera House", organizer: "Met Opera", city: "New York", country: "USA", description: "Puccini's timeless masterpiece of love and loss in 19th-century Paris, performed by world-class opera singers.", location: { lat: 40.7730, lon: -73.9840 } },
  { title: "New York Comic Con", category: "Festival", date: "2026-10-12", price: 65, attendees: 200000, venue: "Jacob K. Javits Center", organizer: "ReedPop", city: "New York", country: "USA", description: "The largest pop culture event on the East Coast with comics, gaming, TV shows, and celebrity guests.", location: { lat: 40.7559, lon: -74.0026 } },

  // Los Angeles Events
  { title: "Coachella Valley Music Festival", category: "Music", date: "2026-04-15", price: 449, attendees: 125000, venue: "Empire Polo Club", organizer: "Goldenvoice", city: "Indio", country: "USA", description: "Annual music and arts festival featuring top artists from various genres in the California desert.", location: { lat: 33.6803, lon: -116.2374 } },
  { title: "E3 Gaming Expo", category: "Conference", date: "2026-06-10", price: 250, attendees: 66000, venue: "Los Angeles Convention Center", organizer: "ESA", city: "Los Angeles", country: "USA", description: "The world's premier event for video games and interactive entertainment showcasing the latest innovations.", location: { lat: 34.0400, lon: -118.2673 } },
  { title: "Lakers vs Warriors", category: "Sports", date: "2026-03-18", price: 200, attendees: 18997, venue: "Crypto.com Arena", organizer: "NBA", city: "Los Angeles", country: "USA", description: "Intense NBA matchup featuring LeBron James and the Lakers against the Golden State Warriors.", location: { lat: 34.0430, lon: -118.2673 } },
  { title: "Hollywood Film Premiere Night", category: "Festival", date: "2026-07-22", price: 500, attendees: 2000, venue: "TCL Chinese Theatre", organizer: "Paramount Pictures", city: "Los Angeles", country: "USA", description: "Exclusive red carpet premiere of the summer's biggest blockbuster with celebrity appearances.", location: { lat: 34.1022, lon: -118.3408 } },

  // San Francisco Events
  { title: "AI & Machine Learning Summit", category: "Conference", date: "2026-05-20", price: 399, attendees: 8000, venue: "Moscone Center", organizer: "O'Reilly Media", city: "San Francisco", country: "USA", description: "Leading conference on artificial intelligence, deep learning, and practical machine learning applications.", location: { lat: 37.7842, lon: -122.4016 } },
  { title: "Golden State Warriors Championship Game", category: "Sports", date: "2026-05-30", price: 350, attendees: 18064, venue: "Chase Center", organizer: "NBA", city: "San Francisco", country: "USA", description: "Watch the Warriors compete for another championship title at the state-of-the-art Chase Center.", location: { lat: 37.7680, lon: -122.3875 } },
  { title: "San Francisco Jazz Festival", category: "Music", date: "2025-09-05", price: 85, attendees: 15000, venue: "SFJazz Center", organizer: "SFJAZZ", city: "San Francisco", country: "USA", description: "World-renowned jazz festival featuring legendary and emerging artists in an intimate venue.", location: { lat: 37.7764, lon: -122.4211 } },
  { title: "TechCrunch Disrupt", category: "Conference", date: "2025-09-18", price: 2995, attendees: 10000, venue: "Moscone Center", organizer: "TechCrunch", city: "San Francisco", country: "USA", description: "Startup battlefield and tech innovation showcase featuring cutting-edge companies and investors.", location: { lat: 37.7842, lon: -122.4016 } },

  // Chicago Events
  { title: "Lollapalooza Music Festival", category: "Music", date: "2025-08-01", price: 350, attendees: 400000, venue: "Grant Park", organizer: "C3 Presents", city: "Chicago", country: "USA", description: "Four-day music festival featuring alternative rock, heavy metal, EDM, and hip hop in downtown Chicago.", location: { lat: 41.8755, lon: -87.6244 } },
  { title: "Chicago Auto Show", category: "Festival", date: "2025-02-08", price: 15, attendees: 1000000, venue: "McCormick Place", organizer: "CATA", city: "Chicago", country: "USA", description: "North America's largest and longest-running auto show featuring the latest vehicles and concepts.", location: { lat: 41.8518, lon: -87.6169 } },
  { title: "Chicago Bears NFL Game", category: "Sports", date: "2025-11-10", price: 120, attendees: 61500, venue: "Soldier Field", organizer: "NFL", city: "Chicago", country: "USA", description: "Classic NFL football at historic Soldier Field with the legendary Chicago Bears.", location: { lat: 41.8623, lon: -87.6167 } },
  { title: "Chicago Symphony Orchestra Gala", category: "Music", date: "2025-12-20", price: 250, attendees: 2500, venue: "Symphony Center", organizer: "CSO", city: "Chicago", country: "USA", description: "Holiday concert featuring Beethoven's Symphony No. 9 with the world-renowned Chicago Symphony.", location: { lat: 41.8794, lon: -87.6258 } },

  // London Events
  { title: "Wimbledon Tennis Championship", category: "Sports", date: "2026-07-01", price: 220, attendees: 500000, venue: "All England Club", organizer: "AELTC", city: "London", country: "UK", description: "The oldest and most prestigious tennis tournament in the world featuring the best players globally.", location: { lat: 51.4343, lon: -0.2141 } },
  { title: "West End: The Phantom of the Opera", category: "Theater", date: "2026-04-25", price: 95, attendees: 1400, venue: "Her Majesty's Theatre", organizer: "Really Useful Group", city: "London", country: "UK", description: "Andrew Lloyd Webber's legendary musical in its historic home at Her Majesty's Theatre.", location: { lat: 51.5104, lon: -0.1322 } },
  { title: "London Tech Week", category: "Conference", date: "2026-06-15", price: 199, attendees: 55000, venue: "ExCeL London", organizer: "London & Partners", city: "London", country: "UK", description: "Europe's largest festival of technology and innovation bringing together startups and enterprises.", location: { lat: 51.5081, lon: 0.0294 } },
  { title: "Notting Hill Carnival", category: "Festival", date: "2025-08-25", price: 0, attendees: 2000000, venue: "Notting Hill", organizer: "London Notting Hill Carnival", city: "London", country: "UK", description: "Europe's biggest street festival celebrating Caribbean culture with music, dance, and food.", location: { lat: 51.5152, lon: -0.2058 } },

  // Paris Events
  { title: "Paris Fashion Week", category: "Festival", date: "2025-09-28", price: 1500, attendees: 100000, venue: "Various Locations", organizer: "Fédération de la Haute Couture", city: "Paris", country: "France", description: "The world's most prestigious fashion event showcasing haute couture and ready-to-wear collections.", location: { lat: 48.8566, lon: 2.3522 } },
  { title: "Paris Saint-Germain vs Marseille", category: "Sports", date: "2026-03-30", price: 180, attendees: 48000, venue: "Parc des Princes", organizer: "Ligue 1", city: "Paris", country: "France", description: "Le Classique - the biggest rivalry in French football between PSG and Olympique de Marseille.", location: { lat: 48.8414, lon: 2.2530 } },
  { title: "Electronic Music Festival Paris", category: "Music", date: "2025-11-15", price: 75, attendees: 25000, venue: "Accor Arena", organizer: "Live Nation", city: "Paris", country: "France", description: "International electronic music festival featuring world's top DJs and producers.", location: { lat: 48.8385, lon: 2.3777 } },

  // Tokyo Events
  { title: "Tokyo Game Show", category: "Conference", date: "2025-09-22", price: 35, attendees: 298000, venue: "Makuhari Messe", organizer: "CESA", city: "Tokyo", country: "Japan", description: "Asia's largest gaming convention showcasing upcoming video games and gaming hardware.", location: { lat: 35.6481, lon: 140.0341 } },
  { title: "Cherry Blossom Festival", category: "Festival", date: "2026-04-01", price: 0, attendees: 3000000, venue: "Ueno Park", organizer: "Tokyo Metropolitan", city: "Tokyo", country: "Japan", description: "Traditional hanami celebration under thousands of blooming cherry blossom trees.", location: { lat: 35.7148, lon: 139.7742 } },
  { title: "Tokyo Marathon", category: "Sports", date: "2026-03-02", price: 50, attendees: 38000, venue: "Tokyo Metropolitan Area", organizer: "Tokyo Marathon Foundation", city: "Tokyo", country: "Japan", description: "One of the six World Marathon Majors passing through Tokyo's most iconic locations.", location: { lat: 35.6809, lon: 139.7673 } },

  // Berlin Events
  { title: "Berlin International Film Festival", category: "Festival", date: "2026-02-13", price: 15, attendees: 480000, venue: "Berlinale Palast", organizer: "Kulturveranstaltungen", city: "Berlin", country: "Germany", description: "One of the most prestigious film festivals in the world showcasing international cinema.", location: { lat: 52.5095, lon: 13.3686 } },
  { title: "Techno Music Festival Berlin", category: "Music", date: "2026-07-12", price: 60, attendees: 50000, venue: "Tempelhof Airport", organizer: "Berlin Festival GmbH", city: "Berlin", country: "Germany", description: "Epic outdoor techno festival at the historic former airport with international DJ lineups.", location: { lat: 52.4731, lon: 13.4037 } },

  // Barcelona Events
  { title: "Mobile World Congress", category: "Conference", date: "2026-02-24", price: 899, attendees: 109000, venue: "Fira Barcelona", organizer: "GSMA", city: "Barcelona", country: "Spain", description: "The world's largest mobile industry event featuring latest innovations in mobile technology.", location: { lat: 41.3521, lon: 2.1260 } },
  { title: "FC Barcelona vs Real Madrid", category: "Sports", date: "2026-04-20", price: 250, attendees: 99000, venue: "Camp Nou", organizer: "La Liga", city: "Barcelona", country: "Spain", description: "El Clásico - the most watched football match in the world between Barcelona and Real Madrid.", location: { lat: 41.3809, lon: 2.1228 } },
  { title: "Primavera Sound Festival", category: "Music", date: "2026-05-29", price: 220, attendees: 220000, venue: "Parc del Fòrum", organizer: "Primavera Sound", city: "Barcelona", country: "Spain", description: "Leading music festival featuring indie, electronic, and alternative music from around the world.", location: { lat: 41.4098, lon: 2.2166 } },

  // Amsterdam Events
  { title: "Amsterdam Dance Event", category: "Music", date: "2025-10-15", price: 425, attendees: 400000, venue: "Various Venues", organizer: "Amsterdam Dance Event", city: "Amsterdam", country: "Netherlands", description: "World's largest electronic music conference and festival spanning 5 days across the city.", location: { lat: 52.3676, lon: 4.9041 } },
  { title: "King's Day Festival", category: "Festival", date: "2026-04-27", price: 0, attendees: 1000000, venue: "City Center", organizer: "Municipality of Amsterdam", city: "Amsterdam", country: "Netherlands", description: "Netherlands' biggest celebration with street parties, concerts, and orange-dressed festivities.", location: { lat: 52.3676, lon: 4.9041 } },

  // Austin Events
  { title: "South by Southwest (SXSW)", category: "Festival", date: "2026-03-07", price: 1725, attendees: 432000, venue: "Austin Convention Center", organizer: "SXSW LLC", city: "Austin", country: "USA", description: "Massive convergence of tech, film, and music industries featuring conferences and performances.", location: { lat: 30.2636, lon: -97.7386 } },
  { title: "Austin City Limits Music Festival", category: "Music", date: "2025-10-03", price: 285, attendees: 450000, venue: "Zilker Park", organizer: "C3 Presents", city: "Austin", country: "USA", description: "Two-weekend music festival in the heart of Austin with diverse lineup across 8 stages.", location: { lat: 30.2672, lon: -97.7731 } },

  // Miami Events
  { title: "Art Basel Miami Beach", category: "Festival", date: "2025-12-05", price: 85, attendees: 83000, venue: "Miami Beach Convention Center", organizer: "Art Basel", city: "Miami", country: "USA", description: "Premier international art fair featuring modern and contemporary artworks from around the world.", location: { lat: 25.7907, lon: -80.1300 } },
  { title: "Ultra Music Festival", category: "Music", date: "2026-03-28", price: 399, attendees: 165000, venue: "Bayfront Park", organizer: "Ultra Music Festival", city: "Miami", country: "USA", description: "World-class electronic music festival featuring the biggest names in EDM across multiple stages.", location: { lat: 25.7753, lon: -80.1862 } },

  // Seattle Events
  { title: "PAX West Gaming Convention", category: "Conference", date: "2025-08-29", price: 65, attendees: 90000, venue: "Washington State Convention Center", organizer: "Penny Arcade", city: "Seattle", country: "USA", description: "Celebration of gaming culture with panels, tournaments, concerts, and hands-on demos.", location: { lat: 47.6118, lon: -122.3330 } },
  { title: "Seattle International Film Festival", category: "Festival", date: "2026-05-15", price: 18, attendees: 155000, venue: "SIFF Cinema", organizer: "SIFF", city: "Seattle", country: "USA", description: "One of the top film festivals in North America showcasing independent and international cinema.", location: { lat: 47.6205, lon: -122.3493 } },

  // Sydney Events
  { title: "Sydney Festival", category: "Festival", date: "2026-01-08", price: 45, attendees: 500000, venue: "Various Locations", organizer: "Sydney Festival", city: "Sydney", country: "Australia", description: "Major arts festival featuring theater, music, dance, and visual arts across Sydney.", location: { lat: -33.8688, lon: 151.2093 } },
  { title: "Vivid Sydney Light Festival", category: "Festival", date: "2026-05-23", price: 0, attendees: 2300000, venue: "Sydney Opera House & Harbor", organizer: "Destination NSW", city: "Sydney", country: "Australia", description: "Spectacular festival of light, music, and ideas transforming Sydney into a creative canvas.", location: { lat: -33.8568, lon: 151.2153 } }
];

async function createIndex() {
  try {
    const exists = await client.indices.exists({ index: INDEX_NAME });

    if (exists) {
      console.log(`Deleting existing index: ${INDEX_NAME}`);
      await client.indices.delete({ index: INDEX_NAME });
    }

    console.log(`Creating index: ${INDEX_NAME}`);
    await client.indices.create({
      index: INDEX_NAME,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              event_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding']
              }
            }
          }
        },
        mappings: {
          properties: {
            title: {
              type: 'text',
              analyzer: 'event_analyzer',
              fields: {
                keyword: {
                  type: 'keyword'
                }
              }
            },
            category: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword'
                }
              }
            },
            date: {
              type: 'date',
              format: 'yyyy-MM-dd'
            },
            price: {
              type: 'float'
            },
            attendees: {
              type: 'integer'
            },
            venue: {
              type: 'text',
              analyzer: 'event_analyzer'
            },
            organizer: {
              type: 'text',
              analyzer: 'event_analyzer'
            },
            city: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword'
                }
              }
            },
            country: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword'
                }
              }
            },
            description: {
              type: 'text',
              analyzer: 'event_analyzer'
            },
            location: {
              type: 'geo_point'
            }
          }
        }
      }
    });
    console.log('Index created successfully with geo_point mapping');
  } catch (error) {
    console.error('Error creating index:', error.message);
    throw error;
  }
}

async function loadEvents() {
  try {
    console.log(`Loading ${events.length} events...`);

    const body = events.flatMap(event => [
      { index: { _index: INDEX_NAME } },
      event
    ]);

    const result = await client.bulk({ body, refresh: true });

    if (result.errors) {
      console.error('Some documents failed to index');
      result.items.forEach((item, i) => {
        if (item.index.error) {
          console.error(`Document ${i}:`, item.index.error);
        }
      });
    } else {
      console.log(`Successfully indexed ${events.length} events`);
    }
  } catch (error) {
    console.error('Error loading events:', error.message);
    throw error;
  }
}

// Export function for use in server.js
async function loadEventsData(esClient) {
  const clientToUse = esClient || client;

  try {
    // Check if index already exists and has data
    const exists = await clientToUse.indices.exists({ index: INDEX_NAME });

    if (exists) {
      const count = await clientToUse.count({ index: INDEX_NAME });
      if (count.count > 0) {
        console.log(`Index '${INDEX_NAME}' already exists with ${count.count} events`);
        return;
      }
    }

    console.log('Loading event data into Elasticsearch...');
    const info = await clientToUse.info();
    console.log(`Connected to Elasticsearch ${info.version.number}`);

    await createIndex();
    await loadEvents();

    console.log('✓ Successfully loaded 42 events into Elasticsearch');
  } catch (error) {
    console.error('Error loading events:', error.message);
    throw error;
  }
}

// CLI script execution
async function main() {
  try {
    console.log('Connecting to Elasticsearch...');
    const info = await client.info();
    console.log(`Connected to Elasticsearch ${info.version.number}`);

    await createIndex();
    await loadEvents();

    console.log('\n✓ Done! Events loaded successfully.');
    console.log(`\nSample geo queries you can try:`);
    console.log(`- Events within 50km of New York: lat=40.7128&lon=-74.0060&distance=50km`);
    console.log(`- Events within 100km of London: lat=51.5074&lon=-0.1278&distance=100km`);
    console.log(`- Events within 30km of Tokyo: lat=35.6762&lon=139.6503&distance=30km`);

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Only run main() if executed directly (not required as a module)
if (require.main === module) {
  main();
}

// Export for use in server.js
module.exports = { loadEventsData };
