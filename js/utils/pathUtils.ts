/**
 * Utility functions for handling file paths, especially for GitHub Pages deployment
 */

/**
 * Converts a relative path to an absolute path that works both locally and on GitHub Pages
 * @param relativePath - The relative path to convert
 * @returns - The absolute path adjusted for the current environment
 */
export function getAbsolutePath(relativePath: string): string {
    // Log for debugging
    console.log(`Original path: ${relativePath}`);
    
    // For GitHub Pages or any hosted environment
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Get the base path from the current URL
        const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
        
        // Remove leading slash from relative path if it exists
        const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        
        // Construct the full path
        const fullPath = `${basePath}/${cleanPath}`;
        
        console.log(`Adjusted path for hosted environment: ${fullPath}`);
        return fullPath;
    }
    
    // For local development
    console.log(`Using original path for local environment: ${relativePath}`);
    return relativePath;
} 