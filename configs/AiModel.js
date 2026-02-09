const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyBfm4Ii3mG6b24Rh_Pakh0Q7Cc4ihhS07s");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

export const createChatSession = async (tripData) => {
  const {
    locationInfo,
    totalNoOfDays,
    traveler,
    budget,
    selectedAttractions
  } = tripData;

  const location = locationInfo?.name || "unspecified location";
  const days = totalNoOfDays || 3;
  const nights = days;
  const travelerType = traveler?.title || "Traveler";
  const budgetType = budget?.title || "moderate";
  const attractions = Array.isArray(selectedAttractions) && selectedAttractions.length > 0
    ? selectedAttractions.map(a => a.title).join(', ')
    : "various";

  const prompt = `Generate a travel plan for Location: ${location}, for ${days} Days and ${nights} nights for a ${travelerType} with a ${budgetType} budget, with ${attractions} attractions. Include: flight details with price in Rupees(Indian currency) and booking URL, hotels with name, address, price in Rupees(Indian currency), image URL, geo coordinates, rating, and description; nearby places with name, details, image URL, geo coordinates, ticket pricing; events with details and coordinates. Format daily travel plan in JSON with best visiting times.`;

  return await model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  });
};
