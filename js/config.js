/**
 * Marchetti's Apartment — Configuration
 * Geoapify API key, app defaults, and category definitions.
 */

const CONFIG = {
  GEOAPIFY_API_KEY: 'REDACTED_GEOAPIFY_KEY',
  DEFAULT_TRAVEL_TIME: 30,     // minutes
  DEFAULT_TRAVEL_MODE: 'walk',
  MAX_COMPARE_LOCATIONS: 4,
  MAP_DEFAULT_CENTER: [40.7128, -74.0060], // New York City
  MAP_DEFAULT_ZOOM: 13,
  OVERPASS_URL: 'https://overpass-api.de/api/interpreter',
};

/**
 * Category hierarchy with OSM tags, benchmarks (counts for ~100 score),
 * display colors, and default priority weights.
 */
const CATEGORIES = [
  {
    id: 'food',
    label: 'Food & Dining',
    icon: '🍽️',
    color: '#f97316',
    weight: 20,
    subcategories: [
      { id: 'restaurant',  label: 'Restaurants',  tagKey: 'amenity', tagValue: 'restaurant',  benchmark: 15 },
      { id: 'cafe',        label: 'Cafes',         tagKey: 'amenity', tagValue: 'cafe',         benchmark: 8  },
      { id: 'bar',         label: 'Bars',          tagKey: 'amenity', tagValue: 'bar',          benchmark: 8  },
      { id: 'supermarket', label: 'Supermarkets',  tagKey: 'shop',    tagValue: 'supermarket',  benchmark: 3  },
      { id: 'convenience', label: 'Corner Shops',  tagKey: 'shop',    tagValue: 'convenience',  benchmark: 5  },
    ],
  },
  {
    id: 'health',
    label: 'Health & Fitness',
    icon: '💪',
    color: '#22c55e',
    weight: 20,
    subcategories: [
      { id: 'fitness_centre', label: 'Gyms',        tagKey: 'leisure', tagValue: 'fitness_centre', benchmark: 4 },
      { id: 'pharmacy',       label: 'Pharmacies',  tagKey: 'amenity', tagValue: 'pharmacy',        benchmark: 5 },
      { id: 'hospital',       label: 'Hospitals',   tagKey: 'amenity', tagValue: 'hospital',        benchmark: 2 },
      { id: 'park',           label: 'Parks',       tagKey: 'leisure', tagValue: 'park',            benchmark: 5 },
      { id: 'doctors',        label: 'Clinics',     tagKey: 'amenity', tagValue: 'doctors',         benchmark: 4 },
    ],
  },
  {
    id: 'transit',
    label: 'Transit & Mobility',
    icon: '🚇',
    color: '#3b82f6',
    weight: 20,
    subcategories: [
      { id: 'bus_stop',         label: 'Bus Stops',        tagKey: 'highway', tagValue: 'bus_stop',         benchmark: 15 },
      { id: 'station',          label: 'Train/Subway',     tagKey: 'railway', tagValue: 'station',          benchmark: 3  },
      { id: 'subway_entrance',  label: 'Subway Entrances', tagKey: 'railway', tagValue: 'subway_entrance',  benchmark: 5  },
      { id: 'bicycle_rental',   label: 'Bike Share',       tagKey: 'amenity', tagValue: 'bicycle_rental',   benchmark: 3  },
      { id: 'tram_stop',        label: 'Tram Stops',       tagKey: 'railway', tagValue: 'tram_stop',        benchmark: 5  },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    icon: '📚',
    color: '#a855f7',
    weight: 15,
    subcategories: [
      { id: 'school',     label: 'Schools',      tagKey: 'amenity', tagValue: 'school',     benchmark: 5 },
      { id: 'library',    label: 'Libraries',    tagKey: 'amenity', tagValue: 'library',    benchmark: 3 },
      { id: 'university', label: 'Universities', tagKey: 'amenity', tagValue: 'university', benchmark: 2 },
      { id: 'college',    label: 'Colleges',     tagKey: 'amenity', tagValue: 'college',    benchmark: 2 },
    ],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: '🎭',
    color: '#ec4899',
    weight: 15,
    subcategories: [
      { id: 'cinema',    label: 'Cinemas',    tagKey: 'amenity', tagValue: 'cinema',    benchmark: 2 },
      { id: 'museum',    label: 'Museums',    tagKey: 'tourism', tagValue: 'museum',    benchmark: 3 },
      { id: 'theatre',   label: 'Theatres',   tagKey: 'amenity', tagValue: 'theatre',   benchmark: 2 },
      { id: 'nightclub', label: 'Nightlife',  tagKey: 'amenity', tagValue: 'nightclub', benchmark: 5 },
      { id: 'arts_centre', label: 'Arts',     tagKey: 'amenity', tagValue: 'arts_centre', benchmark: 2 },
    ],
  },
  {
    id: 'services',
    label: 'Daily Services',
    icon: '🏪',
    color: '#f59e0b',
    weight: 10,
    subcategories: [
      { id: 'bank',        label: 'Banks/ATMs',    tagKey: 'amenity', tagValue: 'bank',        benchmark: 5 },
      { id: 'post_office', label: 'Post Offices',  tagKey: 'amenity', tagValue: 'post_office', benchmark: 2 },
      { id: 'fuel',        label: 'Gas Stations',  tagKey: 'amenity', tagValue: 'fuel',        benchmark: 3 },
      { id: 'laundry',     label: 'Laundromats',   tagKey: 'shop',    tagValue: 'laundry',     benchmark: 3 },
      { id: 'atm',         label: 'ATMs',          tagKey: 'amenity', tagValue: 'atm',         benchmark: 8 },
    ],
  },
];

/** Travel mode display names and icons. */
const TRAVEL_MODES = [
  { id: 'walk',     label: 'Walk',    icon: '🚶', geoapifyMode: 'walk'      },
  { id: 'bicycle',  label: 'Cycle',   icon: '🚲', geoapifyMode: 'bicycle'   },
  { id: 'drive',    label: 'Drive',   icon: '🚗', geoapifyMode: 'drive'     },
  { id: 'transit',  label: 'Transit', icon: '🚇', geoapifyMode: 'approximated_transit' },
];
