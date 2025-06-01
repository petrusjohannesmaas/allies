# PostgreSQL JSON Queries

Since **basic_info** is stored as a JSONB field in PostgreSQL, you can **query individual properties** using SQL’s **JSON functions and operators**.

---

### **1️⃣ Query Specific Fields in `basic_info`**
If you want to **retrieve a specific piece of data** (e.g., `fname`), use the **->> operator**:
```typescript
const result = await client.queryObject`
  SELECT basic_info->>'fname' AS first_name FROM allies WHERE id = ${1};
`;
console.log(result.rows); // Output: [{ first_name: "Jane" }]
```
✅ **->** → Extracts the JSONB object.  
✅ **->>** → Extracts a text value from the JSONB object.  

---

### **2️⃣ Query Full `basic_info` as JSON**
If you need the **entire JSONB object**, simply do:
```typescript
const result = await client.queryObject`
  SELECT basic_info FROM allies WHERE id = ${1};
`;
console.log(result.rows); 
```
Output:
```json
[
  {
    "basic_info": {
      "fname": "Jane",
      "lname": "Doe",
      "email": "jane@example.com",
      "birthday": "1995-04-18",
      "pfp": "https://example.com/profile.jpg"
    }
  }
]
```
✅ **Maintains full JSON structure**  

---

### **3️⃣ Filtering Based on JSON Fields**
If you want to **query allies with a specific `fname`**, you can use:
```typescript
const result = await client.queryObject`
  SELECT * FROM allies WHERE basic_info->>'fname' = 'Jane';
`;
console.log(result.rows);
```
✅ **Filters based on JSON key values**  

---

### **Next Steps**
Want to extend this with **search functionality**, like querying based on partial matches or multiple fields? 🚀  
Let me know how you'd like to refine it further!