import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

// ✅ Configure S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ Configure Multer-S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set the correct content type
    key: (req, file, cb) => {
      let folder = "uploads/"; // Default folder for all file types

      console.log("file.mimetype", file.mimetype);

      if (file.mimetype.startsWith("image/")) {
        folder = "images/";
      } else if (file.mimetype.startsWith("video/")) {
        folder = "videos/";
      }

      let fileName = `${folder}${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
});

// ✅ Function to get the public URL of the uploaded file
const getPublicUrl = (fileKey) =>
  `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

export { upload, getPublicUrl };
