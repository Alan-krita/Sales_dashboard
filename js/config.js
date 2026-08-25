// CONFIGURATION
let SUPABASE_URL = "https://pkwoweaiztetzasqukip.supabase.co";
let SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrd293ZWFpenRldHphc3F1a2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Mjc2MjQsImV4cCI6MjA5OTQwMzYyNH0.ZY4g45X8YvPhu5y6D5MXHnglD3Obx9jMllMaVLX45ck";
let POSTMAN_API_KEY = "https://pkwoweaiztetzasqukip.supabase.co/rest/v1/rpc/get_sales_dashboard";
let TABLE_NAME = "orders";

let currentDataset = [];
let filteredDataset = [];
let isLiveMode = true;
let selectedMonthFilter = "June 2026";

const USER_NAME_MAP = {
  1001: "Faizan", 1002: "Talha", 1003: "Nidhi", 1004: "Bhageshri", 1005: "Sanika", 1006: "Prabhat", 1007: "Farooq", 1008: "Aarav", 1009: "Rhea", 1010: "Ananya",
  1911: "Faizan", 1912: "Talha", 1913: "Nidhi", 1914: "Faizan", 1915: "Sanika", 1916: "Prabhat", 1917: "Bhageshri",
  1943: "Faizan", 1944: "Talha", 1945: "Nidhi", 1946: "Faizan", 1947: "Sanika", 1948: "Prabhat", 1949: "Bhageshri"
};

function resolveRepName(item) {
  if (!item) return "Sales Rep";
  let val = item.created_by;
  if (!val || val === "") val = item.user_id;
  
  if (typeof val === "string") {
    val = val.replace(/^User_/, "").replace(/^Rep\s+/, "").trim();
  }

  if (USER_NAME_MAP[val]) return USER_NAME_MAP[val];
  if (USER_NAME_MAP[item.user_id]) return USER_NAME_MAP[item.user_id];
  
  if (typeof val === "string" && isNaN(Number(val)) && val.trim().length > 0) return val.trim();
  if (typeof val === "number" || !isNaN(Number(val))) {
    const idNum = Math.abs(Number(val));
    const names = ["Faizan", "Talha", "Nidhi", "Bhageshri", "Sanika", "Prabhat", "Farooq", "Aarav", "Rhea", "Ananya"];
    return names[idNum % names.length];
  }
  return String(val);
}
