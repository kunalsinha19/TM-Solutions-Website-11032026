const multer = require("multer");
const ApiError = require("../utils/apiError");

// Use memory storage — convert to base64 data URI so the logo persists
// across container restarts / Railway redeploys (stored in MongoDB, not disk).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new ApiError(400, "Only image uploads are allowed."));
    }
    return cb(null, true);
  },
});

const uploadLogo = [
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded.");
    }
    // Store as a base64 data URI in MongoDB — survives container restarts
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    res.json({
      success: true,
      url: dataUri,
      file: {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
      },
    });
  },
];

module.exports = { uploadLogo };
