/**
 * environmentService.js — Mock environmental monitoring data.
 */

export const getEnvironmentData = async () => {
  return {
    temperature:      38.4,   // °C
    humidity:         22,     // %
    rainfall:         0.0,    // mm last 24h
    windSpeed:        14,     // km/h
    reservoirLevel:   41,     // % capacity
    groundwaterLevel: 8.2,    // meters below ground
    uvIndex:          9,
    airQualityIndex:  72,
  };
};

export const getEnvironmentHistory = async () => {
  // Last 7 days data for chart
  return [
    { day: 'Mon', temp: 36, humidity: 24, rainfall: 0 },
    { day: 'Tue', temp: 37, humidity: 22, rainfall: 0 },
    { day: 'Wed', temp: 39, humidity: 19, rainfall: 0 },
    { day: 'Thu', temp: 41, humidity: 17, rainfall: 0 },
    { day: 'Fri', temp: 40, humidity: 20, rainfall: 2.1 },
    { day: 'Sat', temp: 38, humidity: 23, rainfall: 0 },
    { day: 'Sun', temp: 38, humidity: 22, rainfall: 0 },
  ];
};
