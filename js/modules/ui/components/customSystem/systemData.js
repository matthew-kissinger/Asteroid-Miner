// systemData.js - System data structures, presets, configurations

export class SystemDataManager {
    constructor() {
        this.starClasses = this.getStarClasses();
        this.planetDefaults = this.getPlanetDefaults();
    }

    getStarClasses() {
        return [
            { value: 'O', label: 'O - Blue Giant (Hot, Blue)', color: 0x9bb0ff },
            { value: 'B', label: 'B - Blue-White', color: 0xaabfff },
            { value: 'A', label: 'A - White', color: 0xcad7ff },
            { value: 'F', label: 'F - Yellow-White', color: 0xf8f7ff },
            { value: 'G', label: 'G - Yellow (Sun-like)', color: 0xfff4ea, selected: true },
            { value: 'K', label: 'K - Orange', color: 0xffd2a1 },
            { value: 'M', label: 'M - Red Dwarf', color: 0xffcc6f }
        ];
    }

    getPlanetDefaults() {
        return {
            size: { min: 300, max: 1000, default: 450 },
            distance: { min: 4000, max: 60000, default: 8000 },
            speed: { min: 1, max: 10, default: 5 },
            rings: false
        };
    }

    getStarColorForClass(starClass) {
        const starClassData = this.starClasses.find(sc => sc.value === starClass);
        return starClassData ? starClassData.color : 0xfff4ea; // Default to G-class if undefined
    }

    createSystemData(systemName, starClass, skyboxUrl, planets, lightIntensityMultiplier = 0.8) {
        return {
            id: `Custom-${Date.now()}`,
            name: systemName,
            starClass: starClass,
            classification: 'Custom',
            description: `Custom star system with ${planets.length} planets`,
            skyboxUrl: skyboxUrl,
            lightIntensityMultiplier: lightIntensityMultiplier,
            planetData: planets.map((planet, i) => {
                return {
                    name: planet.name,
                    textureUrl: planet.textureUrl || null,
                    size: planet.size,
                    distance: planet.distance,
                    speed: planet.speed,
                    color: this.getStarColorForClass(starClass),
                    rings: planet.rings
                };
            })
        };
    }

    calculatePlanetDistance(planetIndex, baseDistance = 4000, increment = 6000) {
        return baseDistance + planetIndex * increment;
    }

    convertSpeedSliderToOrbitSpeed(sliderValue) {
        // Convert 1-10 range to 0.001-0.002 range
        return 0.001 + (sliderValue - 1) * (0.001 / 9);
    }

    getDefaultPlanetData(planetIndex) {
        return {
            name: '',
            description: '',
            size: this.planetDefaults.size.default,
            distance: this.calculatePlanetDistance(planetIndex),
            speed: this.convertSpeedSliderToOrbitSpeed(this.planetDefaults.speed.default),
            rings: this.planetDefaults.rings
        };
    }

    getSystemPresets() {
        return {
            solar: {
                name: 'Sol System',
                starClass: 'G',
                skyboxDescription: 'Deep space with distant stars and nebulae',
                planets: [
                    {
                        name: 'Mercury',
                        description: 'A small, rocky planet closest to the star',
                        size: 350,
                        distance: 4000,
                        speed: 0.002,
                        rings: false
                    },
                    {
                        name: 'Venus',
                        description: 'A hot, cloudy planet with a thick atmosphere',
                        size: 420,
                        distance: 6000,
                        speed: 0.0018,
                        rings: false
                    },
                    {
                        name: 'Earth',
                        description: 'A blue planet with oceans and continents',
                        size: 450,
                        distance: 8000,
                        speed: 0.0015,
                        rings: false
                    }
                ]
            },
            binary: {
                name: 'Binary System',
                starClass: 'F',
                skyboxDescription: 'A system with twin stars casting complex shadows',
                planets: [
                    {
                        name: 'Proxima',
                        description: 'A tidally locked world with extreme temperature differences',
                        size: 380,
                        distance: 12000,
                        speed: 0.001,
                        rings: false
                    },
                    {
                        name: 'Gemini Prime',
                        description: 'A large gas giant with spectacular ring systems',
                        size: 800,
                        distance: 25000,
                        speed: 0.0008,
                        rings: true
                    }
                ]
            },
            exotic: {
                name: 'Exotic System',
                starClass: 'O',
                skyboxDescription: 'A violent nebula with intense radiation and stellar phenomena',
                planets: [
                    {
                        name: 'Crystalline',
                        description: 'A planet of living crystal formations and energy storms',
                        size: 600,
                        distance: 15000,
                        speed: 0.0012,
                        rings: true
                    }
                ]
            }
        };
    }

    validateSystemData(systemData) {
        const errors = [];

        if (!systemData.name || systemData.name.trim().length < 3) {
            errors.push('System name must be at least 3 characters long');
        }

        if (!systemData.starClass || !this.starClasses.find(sc => sc.value === systemData.starClass)) {
            errors.push('Invalid star class selected');
        }

        if (!systemData.planetData || systemData.planetData.length === 0) {
            errors.push('System must have at least one planet');
        }

        if (systemData.planetData && systemData.planetData.length > 8) {
            errors.push('System cannot have more than 8 planets');
        }

        systemData.planetData?.forEach((planet, index) => {
            if (!planet.name || planet.name.trim().length < 2) {
                errors.push(`Planet ${index + 1} name must be at least 2 characters long`);
            }

            if (planet.size < this.planetDefaults.size.min || planet.size > this.planetDefaults.size.max) {
                errors.push(`Planet ${index + 1} size must be between ${this.planetDefaults.size.min} and ${this.planetDefaults.size.max}`);
            }

            if (planet.distance < this.planetDefaults.distance.min || planet.distance > this.planetDefaults.distance.max) {
                errors.push(`Planet ${index + 1} distance must be between ${this.planetDefaults.distance.min} and ${this.planetDefaults.distance.max}`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}