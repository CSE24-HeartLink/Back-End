// routes/albumRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Album = require('../models/Album');
const Photo = require('../models/Photo');
const aws = require('aws-sdk');

// AWS S3 configuration
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'your-region'
});
const S3 = new aws.S3();

// Album routes
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const album = await Album.findOne({ groupId });
    res.status(200).json(album);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/collage', async (req, res) => {
  try {
    const { userId, photos } = req.body;
    // Generate collage using the provided photos
    const collageUrl = await generateCollage(photos);
    const photo = new Photo({ userId, url: collageUrl });
    await photo.save();
    res.status(201).json(photo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/photos', async (req, res) => {
  try {
    const { userId, groupId, image } = req.body;
    const uploadResult = await uploadToS3(image, `${userId}/${groupId}`);
    const photo = new Photo({ userId, groupId, url: uploadResult.Location });
    await photo.save();
    res.status(201).json(photo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper functions
async function generateCollage(photos) {
  // Implement collage generation logic here
  // Return the URL of the generated collage
}

async function uploadToS3(image, folder) {
  const params = {
    Bucket: 'your-bucket-name',
    Key: `${folder}/${image.name}`,
    Body: image.data,
    ContentType: image.type
  };
  const uploadResult = await S3.upload(params).promise();
  return uploadResult;
}

module.exports = router;