import { client } from "./database.ts";
import { Ally, Mission } from "./models.ts";
import { v5, NAMESPACE_DNS } from "@std/uuid";


export async function insertAlly(ally: Omit<Ally, "id">): Promise<number> {
  const result = await client.queryObject<{ id: number }>`
    INSERT INTO allies (category, fname, lname, email, birthday, pfp, note) 
    VALUES (${ally.category}, ${ally.fname}, ${ally.lname}, ${ally.email}, ${ally.birthday}, ${ally.pfp}, ${ally.note}) 
    RETURNING id;
  `;
  return result.rows[0].id;
}


export async function insertMission(mission: Omit<Mission, "uuid">): Promise<number> {
  const data = new TextEncoder().encode(mission.description);
  const uuid = await v5.generate(NAMESPACE_DNS, data);

  const result = await client.queryObject<{ id: number }>`
    INSERT INTO missions (ally_id, uuid, description, due_date) VALUES
    (${mission.ally_id}, ${uuid}, ${mission.description}, ${mission.due_date})
    RETURNING id;
  `;

  return result.rows[0].id;
}

export async function getMissionsForAlly(ally_id: number): Promise<Mission[]> {
  const result = await client.queryObject<Mission>`
    SELECT * FROM missions WHERE ally_id = ${ally_id};
  `;
  return result.rows;
}
