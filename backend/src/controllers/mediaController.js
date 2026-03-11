const fs = require("fs");
const path = require("path");
const multer = require("multer");
const ApiError = require("../utils/apiError");

const uploadDir = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();
    const ext = path.extname(safeName) || ".png";
    const base = path.basename(safeName, ext) || "logo";
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new ApiError(400, "Only image uploads are allowed."));
    }
    return cb(null, true);
  }
});

const uploadLogo = [
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded.");
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url,
      file: {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      }
    });
  }
];

module.exports = {
  uploadLogo
};
