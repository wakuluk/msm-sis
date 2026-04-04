export function formatDisplayValue(value, fallback = "Not provided") {
  if (value == null) {
    return fallback;
  }

  if (typeof value === "string" && value.trim() === "") {
    return fallback;
  }

  return value;
}
