/**
 * Utility functions for handling file paths, especially for GitHub Pages deployment
 */

/**
 * Converts a relative path to an absolute path that works both locally and on GitHub Pages
 * @param {string} relativePath - The relative path to convert
 * @returns {string} - The absolute path adjusted for the current environment
 */
export function getAbsolutePath(relativePath) {
    // Handle both local and GitHub Pages environments
    if (window.location.hostname.includes('github.io') || window.location.hostname.includes('github.com')) {
        // For GitHub Pages deployments
        const pathParts = window.location.pathname.split('/');
        const repoName = pathParts.length > 1 ? pathParts[1] : ''; // e.g., 'Asteroid-Miner'
        
        if (repoName) {
            // Handle both cases where path may or may not start with a slash
            const cleanRelativePath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
            
            // Check if path already includes repo name
            if (!cleanRelativePath.startsWith(`/${repoName}/`) && !cleanRelativePath.startsWith(`/${repoName}`)) {
                return `/${repoName}${cleanRelativePath}`;
            }
        }
    }
    
    // For local development or if already in correct format
    return relativePath;
} 