const db = require("./db");

function updateRow() {
  const [id, name] = process.argv.slice(2);
  db.run(
    `UPDATE allies SET name = ? WHERE id = ?`,
    [name, id],
    function (error) {
      if (error) {
        console.error(error.message);
      }
      console.log(`Row ${id} has been updated`);
    }
  );
}

updateRow();