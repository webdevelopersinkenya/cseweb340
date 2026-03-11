// sync-images-full.js
const fs = require('fs');
const path = require('path');
const pool = require('./database'); // adjust path if needed

const IMAGES_FOLDER = path.join(__dirname, 'public', 'images', 'vehicles');
const PLACEHOLDER = 'placeholder.png';

async function syncImages() {
  try {
    const result = await pool.query('SELECT inv_id, inv_image, inv_thumbnail FROM inventory');

    for (const row of result.rows) {
      // Handle both main image and thumbnail
      const fields = ['inv_image', 'inv_thumbnail'];

      for (const field of fields) {
        let imgPath = row[field];

        // Skip if missing or placeholder
        if (!imgPath || imgPath.includes(PLACEHOLDER)) {
          if (!imgPath || imgPath.trim() === '') {
            await pool.query(
              `UPDATE inventory SET ${field} = $1 WHERE inv_id = $2`,
              [`images/vehicles/${PLACEHOLDER}`, row.inv_id]
            );
          }
          continue;
        }

      // inside the loop over fields ['inv_image', 'inv_thumbnail']

// 1 Remove duplicated "vehicles/vehicles/"
imgPath = imgPath.replace(/vehicles\/vehicles\//g, 'vehicles/');

// 2 Remove double slashes
imgPath = imgPath.replace(/\/+/g, '/');

// 3 Prepend "images/" only if it doesn't already start with it
if (!imgPath.startsWith('images/')) {
  imgPath = 'images/' + imgPath.replace(/^\/+/, '');
}

// 4 Move file in filesystem if misplaced
const fileName = path.basename(imgPath);
const filePath = path.join(IMAGES_FOLDER, fileName);

        // 5 Update database if changed
        if (row[field] !== imgPath) {
          await pool.query(
            `UPDATE inventory SET ${field} = $1 WHERE inv_id = $2`,
            [imgPath, row.inv_id]
          );
          console.log(`Updated DB: ID ${row.inv_id} field ${field} → ${imgPath}`);
        }
      }
    }

    console.log('All images and thumbnails synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing images:', error);
    process.exit(1);
  }
}

syncImages();