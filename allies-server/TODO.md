Here’s the **Phase 1 To-Do List** for getting the backend up and running.

### **Phase 1: Server-Side Development**

#### **1️⃣ Project Setup**

✅ Install **Deno** and **Deno CLI**.
✅ Initialize a new **Deno project**.
✅ Configure **TypeScript settings** for strong typing.
✅ Import **Deno modules** for **dotenv** and **std/dotenv**.
✅ Create a **.gitignore** file to exclude unnecessary files.


#### **2️⃣ Database Configuration**

✅ Install and configure **PostgreSQL** Docker container and local client.
✅ Create migration script.
✅ Test **models** for **Allies** and **Missions**.
✅ Clean up the database schema to not use any JSON fields.
✅ Redo the migration script to use the new schema.
✅ Create new models for **Allies** and **Missions**.


#### **3️⃣ API Routes Definition**

✅ Create a basic server with a test route to insert.
- Implement **CRUD endpoints**:
  ✅ `POST /allies` → Add a new ally.
  - `GET /allies` → Retrieve all allies.
  - `GET /allies/:id` → Get details of a specific ally.
  - `PUT /allies/:id` → Update ally information.
  - `DELETE /allies/:id` → Remove an ally.
- Define **missions management routes**:
  - `POST /missions` → Create a mission linked to an ally.
  - `GET /missions/:ally_id` → Get all missions for an ally.

#### **4️⃣ API Request Handling**

- Set up **Deno HTTP module** to handle requests.
- Implement proper **error handling**.
- Define **data validation** for input fields.

#### **5️⃣ Local Testing**

- Use **Deno’s built-in fetch API** or **Postman** to test API routes.
- Verify **database persistence**.
- Ensure **edge cases** are accounted for (invalid data, missing fields).

---

Once we get these foundational elements in place, we’ll be ready to scale into **containerization and client-side development**. Let me know which task you want to tackle first, and we'll break it down step by step! 🚀  
Ready to get started?
