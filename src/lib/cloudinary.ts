import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: 'dk7iscykg', // process.env.CLOUDINARY_CLOUD_NAME
  api_key: '479643753769294', // process.env.CLOUDINARY_API_KEY
  api_secret: 'COLo8c_tmuuAA2ka6P7VLBDlbgw', // process.env.CLOUDINARY_API_SECRET
  secure: true
});

console.log('Cloudinary configured with hardcoded values for testing');

export default cloudinary; 