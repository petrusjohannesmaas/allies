import { insertAlly } from "./db_helpers.ts";

/**
 * Example usage: Insert a new ally
 */
const newAllyId = await insertAlly({
  category: "Friend",
  basic_info: {
    fname: "Jane",
    lname: "Doe",
    email: "jane@example.com",
    birthday: "1995-04-18",
    pfp: "https://example.com/profile.jpg",
  },
  note: "Long-time friend and mentor.",
});

console.log(`Inserted new ally with ID: ${newAllyId}`);
