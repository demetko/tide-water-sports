export const regionalHubs = {
  'Sunny Beach': [42.6931, 27.7088],
  'Nessebar': [42.6587, 27.7348],
  'Burgas Marina': [42.4925, 27.4831],
} satisfies Record<string, [number, number]>;

export type Departure = keyof typeof regionalHubs;
export const kioskLocations: {name:string; departure:Departure; coordinates:[number,number]; kind:'jet'|'para'|'yacht'}[] = [
  {name:'Central Beach Jet Ski Station', departure:'Sunny Beach', coordinates:[42.6912,27.7125], kind:'jet'},
  {name:'Action Water Sports Kiosk', departure:'Sunny Beach', coordinates:[42.6965,27.7150], kind:'jet'},
  {name:'Old Town South Beach Charter Kiosk', departure:'Nessebar', coordinates:[42.6545,27.7290], kind:'yacht'},
  {name:'North Beach Parasailing Center', departure:'Nessebar', coordinates:[42.6620,27.7210], kind:'para'},
  {name:'Port Burgas Yacht Charter Terminal', departure:'Burgas Marina', coordinates:[42.4910,27.4815], kind:'yacht'},
];

export function directionsLinks([latitude, longitude]: [number,number]) {
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    apple: `maps://?q=${latitude},${longitude}`,
  };
}
