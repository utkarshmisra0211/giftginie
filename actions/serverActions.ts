"use server";

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { spawn } from "child_process";

const openai = new OpenAI();

const GiftSuggestionSchema = z.object({
  description: z.string(),
  categories: z.array(
    z.object({
      categoryName: z.string(),
      gifts: z.array(
        z.object({
          giftName: z.string(),
          products: z.array(
            z.object({
              title: z.string().nullable(),
              price: z.string(),
              rating: z.string(),
              image_url: z.string(),
              product_link: z.string(),
            })
          ),
        })
      ),
    })
  ),
});

async function fetchAmazonProduct(productName: string, filters: { min_price: number; max_price: number; min_rating: number }) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", ["amazon_scraper.py", productName, JSON.stringify(filters)]);

    let dataString = "";

    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python Error for ${productName}:`, data.toString());
    });

    pythonProcess.on("close", async (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code} for ${productName}`);
        resolve(null);
        return;
      }
      try {
        const result = JSON.parse(dataString);
        resolve(result || null);
      } catch (error) {
        console.error("Error parsing Python output:", error);
        resolve(null);
      }
    });
  });
}

function parseBudget(budget: string): { min_price: number; max_price: number } {
  const [min, max] = budget
    .replace(/[^\d-]/g, "")
    .split("-")
    .map(Number);

  return { min_price: min || 1000, max_price: max || 10000 };
}

function determineFilters(survey: any): { min_price: number; max_price: number; min_rating: number } {
  const budget = parseBudget(survey.budget);
  let min_rating = 4.0;

  if (
    survey.fashionInterest === "Yes, they love fashion" ||
    survey.homeDecorInterest === "Yes, they enjoy decorating their space"
  ) {
    min_rating = 4.5;
  }

  return { ...budget, min_rating };
}

async function fetchProductsForGift(giftName: string, filters: any): Promise<any[]> {
  const maxProducts = 5;
  const products: any[] = [];
  let retries = 0;

  while (products.length < maxProducts && retries < 3) {
    const product = await fetchAmazonProduct(giftName, filters);
    if (product) {
      products.push(product);
    } else {
      retries++;
    }

    // Add a small delay to avoid overwhelming servers
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return products.slice(0, maxProducts); // Ensure exactly 5 items
}

export async function startChat(): Promise<string> {
  try {
    const surveyResponses = {
      // ... your survey responses ...
      ageRange: "25-34",
      gender: "Female",
      giftPreference: "Decorative",
      techGadgetsInterest: "Sometimes",
      relaxationMethod: "Meditating/Yoga",
      fashionInterest: "Yes, they love fashion",
      exerciseFrequency: "Few times a week",
      dietaryPreferences: "Vegan",
      favoriteColorPalette: "Soft/pastel colors",
      experienceGiftsInterest: "Yes, they love experiences",
      homeDecorInterest: "Yes, they enjoy decorating their space",
      clothingGiftPreference: "They love clothing gifts",
      cookingInterest: "They cook occasionally",
      bookInterest: "Yes, they're a bookworm",
      weekendPreference: "Relaxing at home",
      organizingToolInterest: "Sometimes",
      moviePreference: ["Drama", "Romance"],
      adventurousness: "Sometimes open to trying new things",
      lifestyleGiftPreference: "A mix of both",
      beautyProductInterest: "Occasionally",
      DIYInterest: "Sometimes",
      hobbyGiftInterest: "Yes, they'd love gifts related to their hobbies",
      sustainabilityPreference: "Sustainable",
      budget: "₹5,000-₹10,000",
      specificHobbies: "Painting and gardening",
    };

    const filters = determineFilters(surveyResponses);

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: "Based on the provided survey responses, generate 5 gift suggestions for each of 5 categories relevant to the preferences. Focus on specific, searchable product names that are likely to be found on Amazon India. Write the description and categories in third person, focusing on the preferences and interests mentioned, without specifying the recipient directly or using demographic details.",
        },
        {
          role: "user",
          content: `Survey responses: ${JSON.stringify(surveyResponses)}`,
        },
      ],
      response_format: zodResponseFormat(GiftSuggestionSchema, "giftSuggestions"),
    });

    const giftSuggestions = completion.choices[0].message.parsed;
    console.log('opennnnnnnnn')

    for (const category of giftSuggestions.categories) {
      for (const gift of category.gifts) {
        gift.products = await fetchProductsForGift(gift.giftName, filters);
      }
    }

    return JSON.stringify(giftSuggestions, null, 2);
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return JSON.stringify({ error: "Failed to generate gift suggestions" });
  }
}
