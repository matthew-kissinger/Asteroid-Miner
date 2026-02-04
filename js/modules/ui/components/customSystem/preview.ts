// preview.ts - System preview rendering and visualization

import type { ApiClient } from '../../../utils/apiClient.ts';

type GeneratedPlanetPreview = {
    name: string;
    url: string | null;
};

export class PreviewManager {
    isMobile: boolean;

    constructor(isMobile: boolean = false) {
        this.isMobile = isMobile;
    }

    showSystemPreview(
        generatedSkyboxUrl: string | null,
        generatedPlanetUrls: GeneratedPlanetPreview[],
        apiClient: ApiClient | null
    ): void {
        this.updateSkyboxPreview(generatedSkyboxUrl, apiClient);
        this.updatePlanetPreviews(generatedPlanetUrls, apiClient);
        this.showPreviewUI();
    }

    updateSkyboxPreview(skyboxUrl: string | null, apiClient: ApiClient | null): void {
        const skyboxPreviewImg = document.getElementById('skybox-preview-img') as HTMLImageElement | null;
        if (skyboxPreviewImg && skyboxUrl && apiClient) {
            skyboxPreviewImg.src = apiClient.getFullImageUrl(skyboxUrl);
        }
    }

    updatePlanetPreviews(planetUrls: GeneratedPlanetPreview[], apiClient: ApiClient | null): void {
        const planetsPreview = document.getElementById('planets-preview');
        if (!planetsPreview) return;

        planetsPreview.innerHTML = '';

        if (!planetUrls || !Array.isArray(planetUrls)) return;

        planetUrls.forEach(planet => {
            const planetDiv = document.createElement('div');
            planetDiv.className = 'planet-preview';

            const planetImageSrc = apiClient && planet.url ?
                apiClient.getFullImageUrl(planet.url) :
                planet.url || '';

            planetDiv.innerHTML = `
                <h4>${planet.name || 'Unknown Planet'}</h4>
                <img src="${planetImageSrc}" alt="${planet.name || 'Planet'}" loading="lazy">
            `;

            planetsPreview.appendChild(planetDiv);
        });
    }

    showPreviewUI(): void {
        const generationProgress = document.getElementById('generation-progress');
        const systemPreview = document.getElementById('system-preview');

        if (generationProgress) {
            generationProgress.style.display = 'none';
        }

        if (systemPreview) {
            systemPreview.style.display = 'block';
        }

        // If on mobile, scroll to top of preview
        if (this.isMobile) {
            setTimeout(() => {
                if (systemPreview) {
                    systemPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 50);
        }
    }

    hidePreview(): void {
        const systemPreview = document.getElementById('system-preview');
        const systemForm = document.getElementById('system-creator-form');

        if (systemPreview) {
            systemPreview.style.display = 'none';
        }

        if (systemForm) {
            systemForm.style.display = 'block';
        }
    }

    showProgress(message: string = 'Initializing...'): void {
        const systemForm = document.getElementById('system-creator-form');
        const generationProgress = document.getElementById('generation-progress');
        const generationStatus = document.getElementById('generation-status');

        if (systemForm) {
            systemForm.style.display = 'none';
        }

        if (generationProgress) {
            generationProgress.style.display = 'block';
        }

        if (generationStatus) {
            generationStatus.textContent = message;
        }
    }

    hideProgress(): void {
        const generationProgress = document.getElementById('generation-progress');
        const systemForm = document.getElementById('system-creator-form');

        if (generationProgress) {
            generationProgress.style.display = 'none';
        }

        if (systemForm) {
            systemForm.style.display = 'block';
        }
    }

    updateGenerationStatus(message: string): void {
        const generationStatus = document.getElementById('generation-status');
        if (generationStatus) {
            generationStatus.textContent = message;
            console.log('Generation status:', message);
        }
    }

    createPlanetPreviewElement(planet: GeneratedPlanetPreview, apiClient: ApiClient | null): HTMLDivElement {
        const planetDiv = document.createElement('div');
        planetDiv.className = 'planet-preview';

        const imageUrl = apiClient && planet.url ?
            apiClient.getFullImageUrl(planet.url) :
            planet.url || '';

        // Add error handling for image loading
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = planet.name || 'Planet';
        img.loading = 'lazy';

        img.onerror = (): void => {
            img.style.display = 'none';
            const errorMsg = document.createElement('div');
            errorMsg.className = 'image-error';
            errorMsg.textContent = 'Image failed to load';
            errorMsg.style.padding = '20px';
            errorMsg.style.textAlign = 'center';
            errorMsg.style.color = '#999';
            planetDiv.appendChild(errorMsg);
        };

        const title = document.createElement('h4');
        title.textContent = planet.name || 'Unknown Planet';

        planetDiv.appendChild(title);
        planetDiv.appendChild(img);

        return planetDiv;
    }

    clearPreviews(): void {
        const skyboxPreviewImg = document.getElementById('skybox-preview-img') as HTMLImageElement | null;
        const planetsPreview = document.getElementById('planets-preview');

        if (skyboxPreviewImg) {
            skyboxPreviewImg.src = '';
        }

        if (planetsPreview) {
            planetsPreview.innerHTML = '';
        }
    }

    isPreviewVisible(): boolean {
        const systemPreview = document.getElementById('system-preview');
        return systemPreview !== null && systemPreview.style.display !== 'none';
    }

    isProgressVisible(): boolean {
        const generationProgress = document.getElementById('generation-progress');
        return generationProgress !== null && generationProgress.style.display !== 'none';
    }

    resetToForm(): void {
        this.hidePreview();
        this.hideProgress();
        this.clearPreviews();
    }
}
