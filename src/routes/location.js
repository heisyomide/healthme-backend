// routes/location.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/reverse", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng)
    return res.status(400).json({ success: false, message: "Missing coordinates" });

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const { data } = await axios.get(url);

    const address = data?.address;
    const readable = `${address?.city || address?.town || address?.state || ""}, ${
      address?.country || ""
    }`;

    res.json({ success: true, location: readable });
  } catch (err) {
    console.error("Reverse geocode error:", err.message);
    res.status(500).json({ success: false, message: "Failed to get location" });
  }
});

module.exports = router;