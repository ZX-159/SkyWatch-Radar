export interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  alt: number;
}

export class AirportService {
  private airports: Airport[] = [];

  async fetchAirports(): Promise<Airport[]> {
    if (this.airports.length > 0) return this.airports;

    try {
      const response = await fetch('https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat');
      const text = await response.text();

      this.airports = text.split('\n').map(line => {
        const parts = line.split(',');
        if (parts.length < 10) return null;

        return {
          icao: parts[5].replace(/"/g, ''),
          iata: parts[4].replace(/"/g, ''),
          name: parts[1].replace(/"/g, ''),
          city: parts[2].replace(/"/g, ''),
          country: parts[3].replace(/"/g, ''),
          lat: parseFloat(parts[6]),
          lon: parseFloat(parts[7]),
          alt: parseFloat(parts[8]),
        };
      }).filter((a): a is Airport => a !== null && a.icao.length === 4);

      return this.airports;
    } catch (err) {
      console.error('Failed to fetch airport data:', err);
      return [];
    }
  }
}

export const airportService = new AirportService();
