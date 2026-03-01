import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/products"; // ✅ default for product images

    // ✅ Farmer profile photo upload
    if (req.originalUrl.includes("/farmers/upload-photo")) {
      folder = "uploads/farmers";
    }

    // ✅ Customer profile photo upload
    if (req.originalUrl.includes("/customers/upload-photo")) {
      folder = "uploads/customers";
    }

    // ✅ create folder if not exists
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files allowed"), false);
};

const uploadLocal = multer({
  storage,
  fileFilter,
});

export default uploadLocal;


