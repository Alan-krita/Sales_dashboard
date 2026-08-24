let SUPABASE_URL = "https://your-project.supabase.co"; // Replace with your Supabase URL
let SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5c..."; // Replace with your Supabase Anon Key
let TABLE_NAME = "orders"; // Replace with your table name

// Dashboard Global State (Do not modify)
let isLiveMode = false;
let currentDataset = [];
let filteredDataset = [];
let selectedMonthFilter = "All";

const USER_NAME_MAP = {
  1001: "Faizan", 1002: "Talha", 1003: "Nidhi", 1004: "Bhageshri", 1005: "Sanika", 1006: "Prabhat", 1007: "Farooq", 1008: "Aarav", 1009: "Rhea", 1010: "Ananya",
  1911: "Faizan", 1912: "Talha", 1913: "Nidhi", 1914: "Faizan", 1915: "Sanika", 1916: "Prabhat", 1917: "Bhageshri",
  1943: "Faizan", 1944: "Talha", 1945: "Nidhi", 1946: "Faizan", 1947: "Sanika", 1948: "Prabhat", 1949: "Bhageshri"
};

function resolveRepName(item) {
  if (!item) return "Sales Rep";
  let val = item.created_by;
  if (!val || val === "") val = item.user_id;
  if (USER_NAME_MAP[val]) return USER_NAME_MAP[val];
  if (USER_NAME_MAP[item.user_id]) return USER_NAME_MAP[item.user_id];
  if (typeof val === "string" && isNaN(Number(val)) && val.trim().length > 0 && !val.startsWith("User_")) return val.trim();
  if (typeof val === "number" || !isNaN(Number(val))) {
    const idNum = Math.abs(Number(val));
    const names = ["Faizan", "Talha", "Nidhi", "Bhageshri", "Sanika", "Prabhat", "Farooq", "Aarav", "Rhea", "Ananya"];
    return names[idNum % names.length];
  }
  return String(val);
}
