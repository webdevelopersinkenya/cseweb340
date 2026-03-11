// fix-image-paths.js
const pool = require('./database'); // adjust path to your database config

async function fixImagePaths() {
  try {
    // Select all vehicles
    const result = await pool.query('SELECT inv_id, inv_image FROM inventory');

    for (const row of result.rows) {
      if (!row.inv_image) continue; // skip if no image

      // Remove duplicate "vehicles/" from path
      let newImage = row.inv_image.replace(/\/?vehicles\/vehicles\//g, 'vehicles/');

      // Ensure it starts with "images/" (optional, for consistency)
      if (!newImage.startsWith('images/')) {
        newImage = 'images/' + newImage;
      }

      // Only update if changed
      if (newImage !== row.inv_image) {
        await pool.query(
          `UPDATE inventory 
           SET inv_image = $1 
           WHERE inv_id = $2`,
          [newImage, row.inv_id]
        );
        console.log(`Updated vehicle ID ${row.inv_id}: ${row.inv_image} → ${newImage}`);
      }
    }

    console.log('All image paths normalized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating image paths:', error);
    process.exit(1);
  }
}

fixImagePaths();