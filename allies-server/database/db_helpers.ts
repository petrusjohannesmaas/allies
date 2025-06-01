import { client } from "./database.ts";
import { Ally, Mission } from "./models.ts";
import { v5, NAMESPACE_DNS } from "@std/uuid";


// Insert an Ally
export async function insertAlly(ally: Ally): Promise<number> {
const result = await client.queryObject<{ id: number }>`
  INSERT INTO allies (category, basic_info, note) VALUES 
  (${ally.category}, ${JSON.stringify(ally.basic_info)}, ${ally.note}) RETURNING id;
`;
  return result.rows[0].id;
}

export async function insertMission(mission: Omit<Mission, "uuid">): Promise<number> {
  // Generate UUID using mission description as a unique identifier
  const data = new TextEncoder().encode(mission.description);
  const uuid = await v5.generate(NAMESPACE_DNS, data);

  const result = await client.queryObject<{ id: number }>`
    INSERT INTO missions (ally_id, uuid, description, due_date) VALUES
    (${mission.ally_id}, ${uuid}, ${mission.description}, ${mission.due_date})
    RETURNING id;
  `;

  return result.rows[0].id;
}

// Fetch an Ally by ID
export async function getAllyById(id: number): Promise<Ally | null> {
  const result = await client.queryObject`
    SELECT * FROM allies WHERE id = ${id};
  `;
  return result.rows.length > 0 ? result.rows[0] as Ally : null;
}

// Fetch Missions for an Ally
export async function getMissionsByAllyId(ally_id: number): Promise<Mission[]> {
  const result = await client.queryObject`
    SELECT * FROM missions WHERE ally_id = ${ally_id};
  `;
  return result.rows as Mission[];
}
