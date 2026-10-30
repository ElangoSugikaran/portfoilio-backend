import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

// The CLOUDINARY_URL is automatically picked up by the SDK if it's in process.env,
// but we explicitly configure it here using our validated env variable to be safe.
cloudinary.config({
  cloudinary_url: env.CLOUDINARY_URL,
});

export { cloudinary };
