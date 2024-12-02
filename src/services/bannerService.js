import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const PICSUM_API_URL = 'https://picsum.photos';

// Validate API key
const validateApiKey = () => {
  // No API key validation needed for Picsum Photos API
};

export const fetchRandomBanner = async () => {
  try {
    // Get random image info first
    const infoResponse = await fetch(`${PICSUM_API_URL}/v2/list?page=${Math.floor(Math.random() * 30)}&limit=1`);
    
    if (!infoResponse.ok) {
      throw new Error(`Picsum API error: ${infoResponse.status} ${infoResponse.statusText}`);
    }

    const [imageInfo] = await infoResponse.json();
    
    if (!imageInfo) {
      throw new Error('No image data received');
    }

    // Construct the image URL with our desired dimensions
    const imageUrl = `${PICSUM_API_URL}/id/${imageInfo.id}/1080/360`;
    
    // Get author info
    const bannerImage = {
      url: imageUrl,
      id: imageInfo.id,
      photographer: imageInfo.author || 'Unknown',
      photographerUrl: imageInfo.url || ''
    };
    
    // Log successful response
    console.log('Successfully fetched banner image:', {
      imageId: bannerImage.id,
      photographer: bannerImage.photographer
    });

    return {
      success: true,
      data: {
        imageUrl: bannerImage.url,
        author: bannerImage.photographer,
        pageUrl: bannerImage.photographerUrl,
        tags: ['picsum', 'photography']
      }
    };

  } catch (error) {
    console.error('Error fetching random banner:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch banner image'
    };
  }
};

export const updateUserBanner = async (userId, bannerData) => {
  try {
    if (!userId || !bannerData?.imageUrl) {
      throw new Error('Invalid banner data or user ID');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      bannerImageURL: bannerData.imageUrl,
      bannerAuthor: bannerData.author || 'Unknown',
      bannerSourceUrl: bannerData.pageUrl || '',
      bannerTags: bannerData.tags || ['picsum', 'photography'],
      bannerUpdatedAt: new Date().toISOString()
    });

    console.log('Successfully updated user banner:', {
      userId,
      imageUrl: bannerData.imageUrl
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating banner:', error);
    return {
      success: false,
      error: error.message || 'Failed to update banner'
    };
  }
};
