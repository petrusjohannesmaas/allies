const db = require("./db");

function insertRow() {
  const [name, email , age] = process.argv.slice(2);
  db.run(
    `INSERT INTO allies (name, email, age) VALUES (?, ?, ?)`,
    [name, email, age],
    function (error) {
      if (error) {
        console.error(error.message);
      }
      console.log(`Inserted a row with the ID: ${this.lastID}`);
    }
  );
}

export default insertRow;