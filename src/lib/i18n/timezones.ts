import { TimezoneMetadata } from "./types";

export const TIMEZONES: TimezoneMetadata[] = [
  // Africa
  { identifier: "Africa/Lagos", name: "West Africa Time (Lagos)", offset: "UTC+1", region: "Africa" },
  { identifier: "Africa/Accra", name: "Greenwich Mean Time (Accra)", offset: "UTC+0", region: "Africa" },
  { identifier: "Africa/Nairobi", name: "East Africa Time (Nairobi)", offset: "UTC+3", region: "Africa" },
  { identifier: "Africa/Johannesburg", name: "South Africa Standard Time (Johannesburg)", offset: "UTC+2", region: "Africa" },
  { identifier: "Africa/Cairo", name: "Eastern European Time (Cairo)", offset: "UTC+2", region: "Africa" },
  { identifier: "Africa/Casablanca", name: "Western European Time (Casablanca)", offset: "UTC+1", region: "Africa" },
  { identifier: "Africa/Douala", name: "West Africa Time (Douala)", offset: "UTC+1", region: "Africa" },
  { identifier: "Africa/Dakar", name: "Greenwich Mean Time (Dakar)", offset: "UTC+0", region: "Africa" },
  { identifier: "Africa/Kigali", name: "Central Africa Time (Kigali)", offset: "UTC+2", region: "Africa" },
  { identifier: "Africa/Addis_Ababa", name: "East Africa Time (Addis Ababa)", offset: "UTC+3", region: "Africa" },

  // Americas
  { identifier: "America/New_York", name: "Eastern Time (New York / Toronto)", offset: "UTC-5", region: "Americas" },
  { identifier: "America/Chicago", name: "Central Time (Chicago / Houston)", offset: "UTC-6", region: "Americas" },
  { identifier: "America/Denver", name: "Mountain Time (Denver)", offset: "UTC-7", region: "Americas" },
  { identifier: "America/Los_Angeles", name: "Pacific Time (Los Angeles)", offset: "UTC-8", region: "Americas" },
  { identifier: "America/Sao_Paulo", name: "Brasilia Time (São Paulo)", offset: "UTC-3", region: "Americas" },
  { identifier: "America/Mexico_City", name: "Central Time (Mexico City)", offset: "UTC-6", region: "Americas" },

  // Europe
  { identifier: "Europe/London", name: "Greenwich Mean Time / BST (London)", offset: "UTC+0", region: "Europe" },
  { identifier: "Europe/Paris", name: "Central European Time (Paris / Berlin)", offset: "UTC+1", region: "Europe" },
  { identifier: "Europe/Berlin", name: "Central European Time (Berlin)", offset: "UTC+1", region: "Europe" },
  { identifier: "Europe/Amsterdam", name: "Central European Time (Amsterdam)", offset: "UTC+1", region: "Europe" },
  { identifier: "Europe/Zurich", name: "Central European Time (Zurich)", offset: "UTC+1", region: "Europe" },
  { identifier: "Europe/Moscow", name: "Moscow Standard Time (Moscow)", offset: "UTC+3", region: "Europe" },

  // Asia / Middle East / Pacific
  { identifier: "Asia/Dubai", name: "Gulf Standard Time (Dubai)", offset: "UTC+4", region: "Middle East" },
  { identifier: "Asia/Riyadh", name: "Arabian Standard Time (Riyadh)", offset: "UTC+3", region: "Middle East" },
  { identifier: "Asia/Kolkata", name: "India Standard Time (Kolkata / Mumbai)", offset: "UTC+5:30", region: "Asia" },
  { identifier: "Asia/Singapore", name: "Singapore Standard Time (Singapore)", offset: "UTC+8", region: "Asia" },
  { identifier: "Asia/Shanghai", name: "China Standard Time (Shanghai / Beijing)", offset: "UTC+8", region: "Asia" },
  { identifier: "Asia/Tokyo", name: "Japan Standard Time (Tokyo)", offset: "UTC+9", region: "Asia" },
  { identifier: "Australia/Sydney", name: "Australian Eastern Time (Sydney)", offset: "UTC+10", region: "Pacific" },
  { identifier: "Pacific/Auckland", name: "New Zealand Standard Time (Auckland)", offset: "UTC+12", region: "Pacific" },
];

export function getTimezoneMetadata(identifier: string): TimezoneMetadata {
  return (
    TIMEZONES.find((t) => t.identifier === identifier) || {
      identifier: identifier || "Africa/Lagos",
      name: identifier || "Africa/Lagos",
      offset: "UTC+1",
      region: "Global",
    }
  );
}
