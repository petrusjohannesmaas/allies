### **3️⃣ Verify JSONB Storage in PostgreSQL**
To check that **basic_info** is correctly stored as JSONB:
```sql
SELECT basic_info->>'fname' FROM allies WHERE id = 1;
```
✅ **PostgreSQL natively queries JSON data**  

---

### **Next Steps**
Would you like to **test inserting some sample data** or **expand API endpoints** for managing allies and missions? 🚀  
Let me know where you want to go next!