
const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");

// POST /api/complaints
// Submit a new complaint and return its tracking reference.
router.post("/", async (req, res) => {
  try {
    const { customerName, customerPhone, subject, message } = req.body || {};

    if (
      !customerName?.trim() ||
      !customerPhone?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        message: "Please provide your name, phone number, subject, and message."
      });
    }

    if (
      customerName.trim().length < 2 ||
      customerName.trim().length > 100 ||
      customerPhone.trim().length > 20 ||
      subject.trim().length > 150 ||
      message.trim().length < 10 ||
      message.trim().length > 3000
    ) {
      return res.status(400).json({
        message: "Please check your complaint details and try again."
      });
    }

    const complaint = await Complaint.create({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      subject: subject.trim(),
      message: message.trim()
    });

    if (!complaint || !complaint.trackingCode) {
      console.error("Complaint was created without a tracking code.");
      return res.status(500).json({
        message: "The complaint could not receive a tracking reference. Please contact support."
      });
    }

    return res.status(201).json({
      message: "Complaint submitted successfully.",
      trackingCode: complaint.trackingCode,
      status: complaint.status || "Received"
    });
  } catch (error) {
    console.error("Error submitting complaint:", error);

    return res.status(500).json({
      message: "Unable to submit your complaint. Please try again."
    });
  }
});

// POST /api/complaints/track
// Check complaint status using its tracking reference.
router.post("/track", async (req, res) => {
  try {
    const trackingCode = String(req.body?.trackingCode || "")
      .trim()
      .toUpperCase();

    if (!/^LM-[A-F0-9]{16}$/.test(trackingCode)) {
      return res.status(400).json({
        message: "Please enter a valid complaint tracking reference."
      });
    }

    const complaint = await Complaint.findByTrackingCode(trackingCode);

    if (!complaint) {
      return res.status(404).json({
        message: "No complaint was found for that tracking reference."
      });
    }

    return res.status(200).json({
      trackingCode: complaint.trackingCode,
      status: complaint.status,
      createdAt: complaint.createdAt
    });
  } catch (error) {
    console.error("Error tracking complaint:", error);

    return res.status(500).json({
      message: "Unable to check your complaint status right now."
    });
  }
});

module.exports = router;
