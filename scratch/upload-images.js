const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local not found!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing Supabase URL or Service Role Key in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const bucketName = 'menu-images';

async function uploadAndSync() {
  try {
    console.log(`📡 1. Checking if bucket "${bucketName}" exists...`);
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets && buckets.some(b => b.name === bucketName);
      if (!exists) {
        console.log(`🌱 Bucket "${bucketName}" does not exist. Creating public bucket...`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        if (createError) throw createError;
        console.log(`✅ Bucket "${bucketName}" created successfully!`);
      } else {
        console.log(`✅ Bucket "${bucketName}" already exists.`);
      }
    } catch (bucketErr) {
      console.log("⚠️ Bucket existence check fallback:", bucketErr.message);
    }

    const imagesDir = path.join(__dirname, '../images');
    if (!fs.existsSync(imagesDir)) {
      console.error(`Error: Images directory not found at "${imagesDir}"!`);
      process.exit(1);
    }

    const files = fs.readdirSync(imagesDir);
    console.log(`📁 2. Found ${files.length} local images to upload.`);

    // Fetch all menu items from DB to map them correctly
    const { data: menuItems, error: menuErr } = await supabase
      .from('menu_items')
      .select('id, name, image_url');

    if (menuErr) throw menuErr;
    console.log(`📋 3. Fetched ${menuItems.length} menu items from database.`);

    for (const filename of files) {
      const filePath = path.join(imagesDir, filename);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      console.log(`⚡ Uploading "${filename}"...`);
      const fileBuffer = fs.readFileSync(filePath);
      const ext = filename.split('.').pop().toLowerCase();
      const mimeType = ext === 'webp' ? 'image/webp' : 'image/png';

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filename, fileBuffer, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) {
        console.warn(`⚠️ Warning: Failed to upload "${filename}":`, uploadError.message);
        continue;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filename);
      const publicUrl = publicUrlData.publicUrl;
      console.log(`🔗 Public URL: ${publicUrl}`);

      // Find matching database items
      // Check if image_url suffix matches the filename
      const matchingItems = menuItems.filter(item => {
        if (!item.image_url) return false;
        return item.image_url.endsWith(filename);
      });

      if (matchingItems.length > 0) {
        for (const item of matchingItems) {
          console.log(`📝 Updating DB record for "${item.name}" (ID: ${item.id})...`);
          const { error: updateErr } = await supabase
            .from('menu_items')
            .update({ image_url: publicUrl })
            .eq('id', item.id);
          
          if (updateErr) {
            console.error(`❌ Failed to update DB for "${item.name}":`, updateErr.message);
          } else {
            console.log(`✅ DB updated for "${item.name}"!`);
          }
        }
      } else {
        console.log(`ℹ️ No matching DB record found for filename "${filename}".`);
      }
    }

    console.log("\n🎉 Seeding complete! All images uploaded to Supabase Cloud and synchronized successfully!");
  } catch (err) {
    console.error("❌ Process failed:", err);
    process.exit(1);
  }
}

uploadAndSync();
