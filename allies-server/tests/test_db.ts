import { db, Ally, Mission } from "../database.ts";

async function testInsert() {
  const ally = await Ally.create({
    category: "Friend",
    basic_info: {
      fname: "John",
      lname: "Doe",
      email: "john@example.com",
      birthday: "1990-05-15",
      pfp: "https://example.com/profile.jpg",
    },
    note: "Met at the hackathon, great developer.",
  });

  const mission = await Mission.create({
    ally_id: ally.id,
    uuid: crypto.randomUUID(),
    description: "Help with project",
    due_date: new Date("2025-06-10"),
  });

  console.log("Inserted Ally:", ally);
  console.log("Inserted Mission:", mission);
}

testInsert();
