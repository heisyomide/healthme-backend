const Kyc = require("../models/KYC");

exports.submitKyc = async (req, res) => {
  try {
    const kyc = new Kyc({
      userId: req.user.id, // or req.body.userId
      specialization: req.body.specialization,
      licenseNumber: req.body.licenseNumber,
      yearsOfExperience: req.body.yearsOfExperience,
      bio: req.body.bio,
      certification: req.file ? req.file.filename : null,
      status: "pending",
    });

    await kyc.save();
    res.status(201).json({ message: "KYC submitted successfully", kyc });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit KYC", error: err.message });
  }
};

exports.getAllKycs = async (req, res) => {
  try {
    const kycs = await Kyc.find().populate("userId", "fullName email role");
    res.status(200).json(kycs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch KYCs", error: err.message });
  }
};

exports.getKycById = async (req, res) => {
  try {
    const kyc = await Kyc.findById(req.params.id).populate("userId", "fullName email");
    if (!kyc) return res.status(404).json({ message: "KYC not found" });
    res.status(200).json(kyc);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch KYC", error: err.message });
  }
};