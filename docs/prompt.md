I don't want to use data:any because the whole reason of creating models and helper functions is to have type safety.

I think we need to change our schema to be purely relational and not have any JSON fields.

How can we change this into a relational schema?

```json
{
	"ally": {
		"id": "",
        "category": "",
        "fname": "",
        "lname": "",
        "email": "",
        "birthday": "",
        "pfp": "",
        "note": "",
		"missions": [{
			"uuid": "",
			"description": "",
			"due_date": ""
		}, {}],

	}
}
```

Here's out progress so far. Let's work on this.

#### **2️⃣ Database Configuration**

✅ Install and configure **PostgreSQL** Docker container and local client.
✅ Create migration script.
✅ Test **models** for **Allies** and **Missions** with JSONB fields.
🏗️ Refactor the database schema to not use any JSON fields.
🏗️ Redo our migration script to use the new schema.
🏗️ Create new models for **Allies** and **Missions**.