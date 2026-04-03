const bcrypt = require('bcrypt');

async function run() {
  const hash = await bcrypt.hash("admin4321", 10);
  console.log("Hashed Password:", hash);
}

run();