// Data Sources and API Integration
class DataSources {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Generic cache management
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Fetch LA City traffic data
    async fetchLACityTrafficData() {
        const cacheKey = 'la_traffic';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            // LA City Open Data Portal - Traffic collision data
            const response = await fetch('https://data.lacity.org/resource/d5tf-ez2w.json?$limit=100');
            const data = await response.json();
            
            const trafficData = data.map(item => ({
                lat: parseFloat(item.latitude) || 34.0522,
                lng: parseFloat(item.longitude) || -118.2437,
                level: this.getTrafficLevel(item.collision_severity),
                location: item.location_description || 'Unknown',
                timestamp: item.date_occurred || new Date().toISOString(),
                speed: Math.floor(Math.random() * 60) + 10 // Simulated speed
            })).filter(item => this.isInTargetArea(item.lat, item.lng));

            this.setCachedData(cacheKey, trafficData);
            return trafficData;
        } catch (error) {
            console.error('Error fetching LA City traffic data:', error);
            return this.generateMockTrafficData();
        }
    }

    // Fetch Dodgers schedule and events
    async fetchDodgersSchedule() {
        const cacheKey = 'dodgers_schedule';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            // Mock Dodgers data (replace with real API when available)
            const dodgersEvents = [
                {
                    lat: 34.0739,
                    lng: -118.2400,
                    title: 'Dodgers vs Giants',
                    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    venue: 'Dodger Stadium',
                    category: 'sports',
                    attendance: '52000'
                },
                {
                    lat: 34.0739,
                    lng: -118.2400,
                    title: 'Dodgers vs Padres',
                    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    venue: 'Dodger Stadium',
                    category: 'sports',
                    attendance: '52000'
                }
            ];

            this.setCachedData(cacheKey, dodgersEvents);
            return dodgersEvents;
        } catch (error) {
            console.error('Error fetching Dodgers schedule:', error);
            return [];
        }
    }

    // Fetch events from various sources
    async fetchEvents() {
        const cacheKey = 'events';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            // Combine multiple event sources
            const dodgersEvents = await this.fetchDodgersSchedule();
            const otherEvents = await this.fetchOtherEvents();
            
            const allEvents = [...dodgersEvents, ...otherEvents];
            this.setCachedData(cacheKey, allEvents);
            return allEvents;
        } catch (error) {
            console.error('Error fetching events:', error);
            return this.generateMockEvents();
        }
    }

    // Fetch other local events
    async fetchOtherEvents() {
        // Mock event data for Echo Park and surrounding areas
        return [
            {
                lat: 34.0778,
                lng: -118.2607,
                title: 'Echo Park Music Festival',
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                venue: 'Echo Park Lake',
                category: 'festivals',
                attendance: '5000'
            },
            {
                lat: 34.0781,
                lng: -118.2376,
                title: 'Elysian Park Concert',
                date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                venue: 'Elysian Park',
                category: 'concerts',
                attendance: '3000'
            }
        ];
    }

    // Fetch construction data
    async fetchConstructionData() {
        const cacheKey = 'construction';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            // LA City construction permits
            const response = await fetch('https://data.lacity.org/resource/yv23-pmwf.json?$limit=50');
            const data = await response.json();
            
            const constructionData = data.map(item => ({
                lat: parseFloat(item.latitude) || 34.0522,
                lng: parseFloat(item.longitude) || -118.2437,
                location: item.street_address || 'Unknown',
                type: item.construction_type || 'General Construction',
                startDate: item.issued_date || new Date().toISOString(),
                endDate: item.expiration_date || 'TBD',
                impact: 'Lane closures expected'
            })).filter(item => this.isInTargetArea(item.lat, item.lng));

            this.setCachedData(cacheKey, constructionData);
            return constructionData;
        } catch (error) {
            console.error('Error fetching construction data:', error);
            return this.generateMockConstructionData();
        }
    }

    // Check if coordinates are within target areas
    isInTargetArea(lat, lng) {
        return Object.values(CONFIG.AREAS).some(area => 
            UTILS.isWithinRadius([lat, lng], area.center, area.radius)
        );
    }

    // Get traffic level based on collision severity
    getTrafficLevel(severity) {
        if (!severity) return 'moderate';
        switch (severity.toLowerCase()) {
            case 'fatal': return 'severe';
            case 'severe injury': return 'heavy';
            case 'other visible injury': return 'moderate';
            default: return 'light';
        }
    }

    // Generate mock traffic data as fallback
    generateMockTrafficData() {
        return Array.from({ length: 20 }, (_, i) => ({
            lat: CONFIG.MAP.CENTER[0] + (Math.random() - 0.5) * 0.02,
            lng: CONFIG.MAP.CENTER[1] + (Math.random() - 0.5) * 0.02,
            level: ['light', 'moderate', 'heavy'][Math.floor(Math.random() * 3)],
            location: `Location ${i + 1}`,
            timestamp: new Date().toISOString(),
            speed: Math.floor(Math.random() * 60) + 10
        }));
    }

    // Generate mock events as fallback
    generateMockEvents() {
        return [
            {
                lat: 34.0739,
                lng: -118.2400,
                title: 'Sample Sports Event',
                date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                venue: 'Local Stadium',
                category: 'sports',
                attendance: '25000'
            },
            {
                lat: 34.0778,
                lng: -118.2607,
                title: 'Sample Concert',
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                venue: 'Local Venue',
                category: 'concerts',
                attendance: '2000'
            }
        ];
    }

    // Generate mock construction data as fallback
    generateMockConstructionData() {
        return [
            {
                lat: 34.0522,
                lng: -118.2437,
                location: 'Main St & 1st Ave',
                type: 'Road Repair',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                impact: 'Lane closures expected'
            }
        ];
    }
}

// Export for use in other modules
window.DataSources = DataSources;
