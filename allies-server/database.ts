import { Database, Model, DataTypes } from "https://deno.land/x/denodb/mod.ts";

const db = new Database("postgres", {
  database: "allies_db",
  user: "allies_user",
  password: "securepassword",
  hostname: "localhost",
  port: 5432,
});

// Define Ally Model
class Ally extends Model {
  static table = "allies";
  static timestamps = true;

  static fields = {
    id: { primaryKey: true, autoIncrement: true },
    category: DataTypes.STRING,
    basic_info: DataTypes.JSONB,
    note: DataTypes.TEXT,
  };

  static relationships = {
    missions: { type: "hasMany", model: Mission, foreignKey: "ally_id" },
  };
}

// Define Mission Model
class Mission extends Model {
  static table = "missions";

  static fields = {
    id: { primaryKey: true, autoIncrement: true },
    ally_id: DataTypes.INTEGER,
    uuid: DataTypes.UUID,
    description: DataTypes.STRING,
    due_date: DataTypes.DATE,
  };

  static relationships = {
    ally: { type: "belongsTo", model: Ally, foreignKey: "ally_id" },
  };
}

// Link models and sync database
db.link([Ally, Mission]);
await db.sync();

export { db, Ally, Mission };
