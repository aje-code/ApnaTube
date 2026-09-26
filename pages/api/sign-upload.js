import crypto from "crypto";

// This API route generates a signature so the browser can upload
// directly and securely to Cloudinary without exposing the API secret.
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const paramsToSign = {
    timestamp,
    folder: "apnatube",
  };

  const sortedKeys = Object.keys(paramsToSign).sort();
  const stringToSign =
    sortedKeys.map((key) => `${key}=${paramsToSign[key]}`).join("&") +
    apiSecret;

  const signature = crypto
    .createHash("sha1")
    .update(stringToSign)
    .digest("hex");

  res.status(200).json({
    signature,
    timestamp,
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    folder: "apnatube",
  });
}
