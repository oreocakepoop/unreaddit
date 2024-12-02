/**
 * Extracts valid image URLs from text content
 * @param {string} inputText - The text containing potential image URLs
 * @returns {string|null} - The first valid image URL found, or null if none found
 */
export function extractImageUrl(inputText) {
    if (!inputText) return null;

    // Regular expression to detect URLs ending with common image extensions
    const imageUrlRegex = /(https?:\/\/[^\s]+(\.jpg|\.jpeg|\.png|\.gif|\.webp))/i;
    
    // Search for a valid image URL
    const match = inputText.match(imageUrlRegex);
    
    if (match) {
        // Return the matched URL (without extra text)
        return match[0];
    }
    
    return null;
}

/**
 * Validates if a URL is a valid image URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if URL is valid image URL, false otherwise
 */
export function isValidImageUrl(url) {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}
