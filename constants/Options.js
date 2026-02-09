
export const SelectTravelerList = [
  {
    id: 1,
    title: 'Just Me',
    desc: 'A solo traveller',
  },
  {
    id: 2,
    title: 'Couple',
    desc: 'Two travelers in tandem',
  },
  {
    id: 3,
    title: 'Family',
    desc: 'A group of fun loving adv',
  },
  {
    id: 4,
    title: 'Friends',
    desc: 'A bunch of thrill seekers',
  },
]

export const SelectBudgetOptions = [
  {
    id: 1,
    title: 'Cheap',
    desc: 'Stay concious of costs',
  },
  {
    id: 2,
    title: 'Moderate',
    desc: 'Keep cost on average side',
  },
  {
    id: 3,
    title: 'Luxury',
    desc: 'Don’t worry about cost',
  },
]

export const SelectAttractionOptions = [
  {
    id: 1,
    title: 'Cultural',
    desc: 'Explore the local culture',
  },
  {
    id: 2,
    title: 'Hiking',
    desc: 'Hiking in scenic places',
  },
  {
    id: 3,
    title: 'Sports',
    desc: 'A thrilling experience',
  },
  {
    id: 4,
    title: 'Music',
    desc: 'Refresh the soul',
  },
  {
    id: 5,
    title: 'Festivals',
    desc: 'Explore the festivals',

  },
]

export const buildFinalPrompt = (tripData) => {
  const {
    locationInfo,
    totalNoOfDays,
    traveler,
    budget,
    selectedAttractions,
    customAttractions // New field
  } = tripData;

  const location = locationInfo?.name || "your destination";
  const totalDays = totalNoOfDays || 3;
  const totalNights = totalDays;

  const travelerTitle = traveler?.title || "traveler";
  const budgetTitle = budget?.title || "moderate";

  const attractionTitles = Array.isArray(selectedAttractions) && selectedAttractions.length > 0
    ? selectedAttractions.map(attr => attr.title).join(', ')
    : "various";

  const customRecs = Array.isArray(customAttractions) && customAttractions.length > 0
    ? customAttractions.join(', ')
    : "";

  let prompt = `Generate a complete travel plan in valid JSON format only. Do not include any text before or after the JSON object. The JSON must be complete and valid.

Requirements:
- Location: ${location}
- Duration: ${totalDays} Days and ${totalNights} nights
- Traveler type: ${travelerTitle}
- Budget: ${budgetTitle}
- Attractions focus: ${attractionTitles}`;

  if (customRecs) {
    prompt += `\n- MUST INCLUDE these specific places: ${customRecs}`;
  }

  return prompt + `\n\nJSON Structure Required:
{
  "travel_plan": {
    "location": "${location}",
    "duration": "${totalDays} Days, ${totalNights} Nights",
    "traveler_type": "${travelerTitle}",
    "budget": "${budgetTitle}",
    "attraction_focus": "${attractionTitles}",
    "flight_details": {
      "origin": "origin city",
      "destination": "${location}",
      "airline": "airline name",
      "estimated_price_round_trip": "price in Rupees",
      "booking_url": "flight booking URL"
    },
    "hotels": [
      // Give a list of exactly 3 hotel options. Keep descriptions short (max 15 words).
      {
        "name": "hotel name",
        "address": "hotel address",
        "price_per_night": "price in Rupees",
        "image_url": "hotel image URL",
        "coordinates": {"lat": 0, "lng": 0},
        "rating": 4.5,
        "description": "short description"
      }
    ],
    "daily_plan": [
      {
        "day": 1,
        "date": "date",
        "activities": [
          // Limit to 3 activities per day. Keep descriptions short (max 15 words).
          {
            "name": "activity name",
            "description": "activity description",
            "time": "best time to visit (e.g., Morning 9:00-11:00 or Afternoon 14:00-16:00)",
            "best_time": "alternative time field",
            "visiting_time": "alternative time field",
            "time_slot": "alternative time field",
            "location": "location name",
            "coordinates": {"lat": 0, "lng": 0},
            "image_url": "image URL",
            "ticket_price": "price if applicable"
          }
        ]
      }
    ]
  }
}

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanations. Just the JSON object. Do not wrap in \`\`\`json ... \`\`\` tags. start with { and end with }.`;
};

export const TripPackages = [
  {
    id: 1,
    name: 'Bali Escapade',
    desc: 'Top-rated luxury couple trip',
    image: require('../assets/images/switzerland.jpg'),
    price: 'Luxury',
    duration: '5 Days',
    tags: ['Beach', 'Romantic', 'Luxury', 'Nature'],
    tripData: {
      locationInfo: { name: 'Bali, Indonesia', coordinates: null, photoRef: null, url: null },
      traveler: { id: 2, title: 'Couple', people: '2 People' },
      budget: { id: 3, title: 'Luxury', icon: '💰' },
      totalNoOfDays: 5,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
      selectedAttractions: [{ id: 1, title: 'Nature' }, { id: 2, title: 'Beach' }]
    }
  },
  {
    id: 2,
    name: 'New York City',
    desc: 'Urban exploration & food',
    image: require('../assets/images/newyork.jpg'),
    price: 'Moderate',
    duration: '3 Days',
    tags: ['City', 'Food', 'Cultural', 'Solo'],
    tripData: {
      locationInfo: { name: 'New York City, USA', coordinates: null, photoRef: null, url: null },
      traveler: { id: 1, title: 'Just Me', people: '1 Person' },
      budget: { id: 2, title: 'Moderate', icon: '💰' },
      totalNoOfDays: 3,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString(),
      selectedAttractions: [{ id: 1, title: 'City' }, { id: 2, title: 'Food' }]
    }
  },
  {
    id: 3,
    name: 'Swiss Alps',
    desc: 'Hiking & scenic family trip',
    image: require('../assets/images/switzerland.jpg'),
    price: 'High End',
    duration: '6 Days',
    tags: ['Hiking', 'Nature', 'Family', 'Adventure'],
    tripData: {
      locationInfo: { name: 'Swiss Alps, Switzerland', coordinates: null, photoRef: null, url: null },
      traveler: { id: 3, title: 'Family', people: '4 People' },
      budget: { id: 3, title: 'Luxury', icon: '💰' },
      totalNoOfDays: 6,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + (6 * 24 * 60 * 60 * 1000)).toISOString(),
      selectedAttractions: [{ id: 1, title: 'Hiking' }, { id: 2, title: 'Nature' }]
    }
  },
  {
    id: 4,
    name: 'Paris Romance',
    desc: 'Art, cuisine & culture',
    image: require('../assets/images/paris.jpg'),
    price: 'Luxury',
    duration: '4 Days',
    tags: ['Romantic', 'Cultural', 'Food', 'Couple'],
    tripData: {
      locationInfo: { name: 'Paris, France', coordinates: null, photoRef: null, url: null },
      traveler: { id: 2, title: 'Couple', people: '2 People' },
      budget: { id: 3, title: 'Luxury', icon: '💰' },
      totalNoOfDays: 4,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + (4 * 24 * 60 * 60 * 1000)).toISOString(),
      selectedAttractions: [{ id: 1, title: 'Cultural' }, { id: 4, title: 'Music' }]
    }
  },
  {
    id: 5,
    name: 'Dubai Extravaganza',
    desc: 'Luxury shopping & beaches',
    image: require('../assets/images/dubai.jpg'),
    price: 'Luxury',
    duration: '5 Days',
    tags: ['Luxury', 'Shopping', 'Beach', 'City'],
    tripData: {
      locationInfo: { name: 'Dubai, UAE', coordinates: null, photoRef: null, url: null },
      traveler: { id: 4, title: 'Friends', people: 'Group' },
      budget: { id: 3, title: 'Luxury', icon: '💰' },
      totalNoOfDays: 5,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
      selectedAttractions: [{ id: 3, title: 'Sports' }]
    }
  },
  {
    id: 6,
    name: 'Budget Backpacking',
    desc: 'Southeast Asia adventure',
    image: require('../assets/images/tajmahal.jpg'),
    price: 'Cheap',
    duration: '7 Days',
    tags: ['Budget', 'Adventure', 'Solo', 'Cultural'],
    tripData: {
      locationInfo: { name: 'Thailand', coordinates: null, photoRef: null, url: null },
      traveler: { id: 1, title: 'Just Me', people: '1 Person' },
      budget: { id: 1, title: 'Cheap', icon: '💰' },
      totalNoOfDays: 7,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
      selectedAttractions: [{ id: 1, title: 'Cultural' }]
    }
  },
  {
    id: 7,
    name: 'German Festivals',
    desc: 'Oktoberfest & culture',
    image: require('../assets/images/germany.jpg'),
    price: 'Moderate',
    duration: '4 Days',
    tags: ['Festivals', 'Cultural', 'Music', 'Friends'],
    tripData: {
      locationInfo: { name: 'Munich, Germany', coordinates: null, photoRef: null, url: null },
      traveler: { id: 4, title: 'Friends', people: 'Group' },
      budget: { id: 2, title: 'Moderate', icon: '💰' },
      totalNoOfDays: 4,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + (4 * 24 * 60 * 60 * 1000)).toISOString(),
      selectedAttractions: [{ id: 5, title: 'Festivals' }, { id: 4, title: 'Music' }]
    }
  },
  {
    id: 8,
    name: 'Australia Wildlife',
    desc: 'Nature & family fun',
    image: require('../assets/images/australia.jpg'),
    price: 'Moderate',
    duration: '5 Days',
    tags: ['Nature', 'Family', 'Adventure', 'Wildlife'],
    tripData: {
      locationInfo: { name: 'Sydney, Australia', coordinates: null, photoRef: null, url: null },
      traveler: { id: 3, title: 'Family', people: '4 People' },
      budget: { id: 2, title: 'Moderate', icon: '💰' },
      totalNoOfDays: 5,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
      selectedAttractions: [{ id: 1, title: 'Cultural' }, { id: 2, title: 'Hiking' }]
    }
  },
  {
    id: 9,
    name: 'Monaco Luxury',
    desc: 'Yachts, casinos & glamour',
    image: require('../assets/images/monaco.jpg'),
    price: 'Luxury',
    duration: '3 Days',
    tags: ['Luxury', 'Beach', 'Romantic', 'Sports'],
    tripData: {
      locationInfo: { name: 'Monaco', coordinates: null, photoRef: null, url: null },
      traveler: { id: 2, title: 'Couple', people: '2 People' },
      budget: { id: 3, title: 'Luxury', icon: '💰' },
      totalNoOfDays: 3,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString(),
      selectedAttractions: [{ id: 3, title: 'Sports' }]
    }
  },
  {
    id: 10,
    name: 'Ski Adventure',
    desc: 'Winter sports thrill',
    image: require('../assets/images/skiing.jpg'),
    price: 'Moderate',
    duration: '4 Days',
    tags: ['Sports', 'Adventure', 'Friends', 'Winter'],
    tripData: {
      locationInfo: { name: 'Aspen, Colorado', coordinates: null, photoRef: null, url: null },
      traveler: { id: 4, title: 'Friends', people: 'Group' },
      budget: { id: 2, title: 'Moderate', icon: '💰' },
      totalNoOfDays: 4,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + (4 * 24 * 60 * 60 * 1000)).toISOString(),
      selectedAttractions: [{ id: 3, title: 'Sports' }]
    }
  }
];

