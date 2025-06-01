import { insertMission } from "./db_helpers.ts";

const newMissionId = await insertMission({
  ally_id: 1,
  description: "Help with project",
  due_date: new Date("2025-06-10"),
});

console.log(`Inserted mission with ID: ${newMissionId}`);