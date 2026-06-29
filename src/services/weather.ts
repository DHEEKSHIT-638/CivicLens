export interface WeatherInterval {
  datetime: string;
  temp: number;
  weather: string;
  wind_speed: number;
  rain_volume: number;
}

const owmApiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

/**
 * Fetch 5-Day Weather Forecast from OpenWeatherMap (40 data slots, 3-hour intervals)
 * Falls back to mock monsoon forecast data if OWM API Key is missing.
 */
export async function fetchWeatherForecast(lat: number, lon: number): Promise<WeatherInterval[]> {
  if (owmApiKey) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${owmApiKey}&units=metric`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Weather API Error: ${response.status}`);
      const data = await response.json();
      
      // Capture 40 intervals representing exactly 5 days (40 * 3 = 120 hours)
      return data.list.slice(0, 40).map((item: any) => ({
        datetime: item.dt_txt,
        temp: item.main.temp,
        weather: item.weather[0].main,
        wind_speed: item.wind.speed,
        rain_volume: item.rain ? (item.rain['3h'] || 0) : 0
      }));
    } catch (error) {
      console.error("Failed to fetch real weather, falling back to mock:", error);
      return generateMockWeatherForecast();
    }
  } else {
    // API Key missing, run local monsoon simulator
    return generateMockWeatherForecast();
  }
}

/**
 * Generates a mock 5-day monsoon forecast specifically tailored to trigger predictive decay models
 * (Starts normal, shifts to heavy downpour rain on Day 3 & 4).
 */
function generateMockWeatherForecast(): WeatherInterval[] {
  const intervals: WeatherInterval[] = [];
  const baseTime = new Date();
  
  // Create 40 segments (5 days, 3-hour chunks)
  for (let i = 0; i < 40; i++) {
    const forecastTime = new Date(baseTime.getTime() + (i * 3 * 3600 * 1000));
    const day = Math.floor(i / 8) + 1;
    
    let temp = 28 + Math.sin(i / 2) * 3; // Daily temperature fluctuations
    let weather = "Clear";
    let wind_speed = 3 + Math.random() * 4;
    let rain_volume = 0;
    
    // Simulate a high-impact monsoon cell on Day 3 and 4
    if (day === 3) {
      weather = "Rain";
      temp = 24 + Math.random() * 2;
      wind_speed = 12 + Math.random() * 6;
      rain_volume = 12 + Math.random() * 8; // High volume
    } else if (day === 4) {
      weather = "Thunderstorm";
      temp = 22 + Math.random() * 2;
      wind_speed = 18 + Math.random() * 10;
      rain_volume = 20 + Math.random() * 15; // Very high volume
    } else if (day === 5) {
      weather = "Clouds";
      temp = 26;
      wind_speed = 6;
      rain_volume = 1 + Math.random() * 2; // Muted drizzle
    } else if (day === 2) {
      weather = "Clouds";
      rain_volume = 0.5; // Light clouds/drizzle
    }
    
    intervals.push({
      datetime: forecastTime.toISOString().replace('T', ' ').substring(0, 19),
      temp: parseFloat(temp.toFixed(1)),
      weather,
      wind_speed: parseFloat(wind_speed.toFixed(1)),
      rain_volume: parseFloat(rain_volume.toFixed(1))
    });
  }
  
  return intervals;
}
