# Cloudinary Setup Instructions

## 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account (25GB storage + 25GB bandwidth/month)
3. Verify your email address

## 2. Get Your Credentials

After logging in to Cloudinary dashboard:

1. You'll see your **Dashboard** with API credentials
2. Copy these three values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

## 3. Update Your .env File

Open `backend/.env` and replace the placeholder values:

```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

## 4. Test the Upload

### Using Postman or Thunder Client:

**Upload Image:**
- Method: `POST`
- URL: `http://localhost:5000/api/upload/court-image`
- Headers:
  - `Authorization: Bearer YOUR_JWT_TOKEN`
- Body:
  - Type: `form-data`
  - Key: `image` (type: File)
  - Value: Select an image file from your computer

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/cricket-courts/abc123.jpg",
    "publicId": "cricket-courts/abc123",
    "width": 1200,
    "height": 800
  }
}
```

**Delete Image:**
- Method: `DELETE`
- URL: `http://localhost:5000/api/upload/court-image`
- Headers:
  - `Authorization: Bearer YOUR_JWT_TOKEN`
- Body (JSON):
```json
{
  "publicId": "cricket-courts/abc123"
}
```

## 5. How to Use in Court Creation

When creating a court, first upload the image:

1. Call `POST /api/upload/court-image` with the image file
2. Get back the `url` from the response
3. Use that `url` in `POST /api/courts` request:

```json
{
  "name": "Court 1",
  "description": "Professional cricket court",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/cricket-courts/abc123.jpg",
  "features": ["Flood Lights", "Turf Pitch"],
  "status": "active"
}
```

## Features Implemented

✅ **Automatic Optimization:**
- Max dimensions: 1200x800px
- Auto quality compression
- Auto format (WebP for modern browsers)

✅ **Security:**
- JWT authentication required
- Only admins can upload
- Only image files allowed (jpg, png, webp, etc.)
- Max file size: 5MB

✅ **Organization:**
- All court images stored in `cricket-courts` folder
- Easy to manage in Cloudinary dashboard

✅ **CDN Delivery:**
- Fast loading worldwide
- Automatic caching
- Responsive images

## Frontend Integration Example

```typescript
// Upload image first
const formData = new FormData();
formData.append('image', imageFile);

const uploadResponse = await fetch('http://localhost:5000/api/upload/court-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { data } = await uploadResponse.json();
const imageUrl = data.url;

// Then create court with the image URL
const courtResponse = await fetch('http://localhost:5000/api/courts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Court 1',
    description: 'Professional cricket court',
    imageUrl: imageUrl,
    features: ['Flood Lights', 'Turf Pitch'],
    status: 'active'
  })
});
```

## Notes

- Images are stored permanently in Cloudinary
- Even if you delete the court from database, image stays in Cloudinary
- You can manually delete images from Cloudinary dashboard
- Free tier is sufficient for this project (5-7 courts with 1-2 images each)
