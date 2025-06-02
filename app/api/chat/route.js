import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function extractEssentialWeatherData(data) {
  if (!data || typeof data !== 'object') return null;
  return {
    location: data.name || 'your area',
    country: data.sys?.country || 'Unknown',
    condition: data.weather?.[0]?.description || 'Not available',
    temperature: {
      current: data.main?.temp,
      feelsLike: data.main?.feels_like,
      min: data.main?.temp_min,
      max: data.main?.temp_max,
    },
    humidity: data.main?.humidity,
    pressure: data.main?.pressure,
    wind: {
      speed: data.wind?.speed,
      direction: data.wind?.deg,
      gust: data.wind?.gust,
    },
    visibility: data.visibility,
    clouds: data.clouds?.all,
    coordinates: data.coord || {},
  };
}

function formatWeatherData(data) {
  if (!data) return 'Weather data is unavailable.';
  const { location, country, condition, temperature, humidity, wind, clouds } =
    data;

  return `At your current location (${location}, ${country}), it's ${temperature.current}°C with ${condition}. Humidity: ${humidity}%, Wind: ${wind.speed} m/s, Cloud cover: ${clouds}%.`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, messages, currentDate, weather, lang, upcomingEventsData } =
      body;
    // console.log(upcomingEventsData);
    const essentialWeather = extractEssentialWeatherData(weather);
    const formattedWeather = formatWeatherData(essentialWeather);

    const systemPrompt = `
      You are Eva — a friendly, witty, and intelligent AI assistant who always responds **only in ${lang}     **.

      🎯 Your tone is smart yet approachable. You occasionally crack light, tasteful jokes to keep      conversations engaging — but stay concise and helpful. Avoid robotic repetition or filler.

      🧠 Capabilities:
      - Send emails and WhatsApp messages on the user's behalf  
      - Check and manage emails  
      - Make phone calls (with polite messages)  
      - Book cabs when requested  

      💡 Always infer user intent intelligently. If someone asks, "Did you message her?", don't act       confused — understand the context. But if things are unclear, politely ask.

      Respond naturally, like a human assistant would — with charm, wit, and clarity.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Context: Today's date is ${currentDate}. The user's current weather is: ${formattedWeather}. Here are their first 3 upcoming events: ${JSON.stringify(upcomingEventsData)}.
          )}`,
        },
        ...messages,
        {
          role: 'user',
          content: query,
        },
      ],
    });

    const reply = response.choices[0]?.message?.content?.trim();
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to respond to chat' }),
      { status: 500 },
    );
  }
}
