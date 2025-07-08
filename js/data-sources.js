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
            // Try to fetch real data, but fall back to mock data for demo
            const response = await fetch('https://data.lacity.org/resource/d5tf-ez2w.json?$limit=20');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const trafficData = data.map(item => ({
                    lat: parseFloat(item.latitude) || 34.0522,
                    lng: parseFloat(item.longitude) || -118.2437,
                    level: this.getTrafficLevel(item.collision_severity),
                    location: item.location_description || 'Unknown',
                    timestamp: item.date_occurred || new Date().toISOString(),
                    speed: Math.floor(Math.random() * 60) + 10 // Simulated speed
                })).filter(item => this.isInTargetArea(item.lat, item.lng));

                this.setCachedData(cacheKey, trafficData);
                return trafficData.length > 0 ? trafficData : this.generateMockTrafficData();
            } else {
                return this.generateMockTrafficData();
            }
        } catch (error) {
            console.warn('Using mock traffic data due to API error:', error.message);
            return this.generateMockTrafficData();
        }
    }

    // Fetch real-time traffic data from public sources
    async fetchPublicTrafficData() {
        const cacheKey = 'public_traffic';
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            // Generate realistic traffic data for LA roads
            const trafficData = this.generateRealisticTrafficData();
            this.setCachedData(cacheKey, trafficData);
            return trafficData;
        } catch (error) {
            console.warn('Error fetching public traffic data:', error.message);
            return this.generateRealisticTrafficData();
        }
    }

    // Generate realistic traffic data based on actual LA roads
    generateRealisticTrafficData() {
        const laRoads = [
            // Sunset Blvd - main east-west corridor
            { 
                name: 'Sunset Blvd', 
                coordinates: [
                    [34.0770, -118.2700], // West end
                    [34.0772, -118.2680], // Laveta Terrace
                    [34.0773, -118.2670], // Baxter St
                    [34.0775, -118.2653], // 1827 W. Sunset (target address)
                    [34.0776, -118.2640], // Micheltorena St
                    [34.0778, -118.2630], // Easterly Terrace
                    [34.0780, -118.2620]  // East end
                ],
                baseSpeed: 25
            },
            
            // Cross streets (north-south)
            {
                name: 'Micheltorena St',
                coordinates: [
                    [34.0790, -118.2640], // North end
                    [34.0776, -118.2640], // Sunset intersection
                    [34.0760, -118.2640]  // South end
                ],
                baseSpeed: 20
            },
            {
                name: 'Baxter St',
                coordinates: [
                    [34.0800, -118.2670], // North end
                    [34.0773, -118.2670], // Sunset intersection
                    [34.0750, -118.2670]  // South end
                ],
                baseSpeed: 20
            },
            {
                name: 'Silver Lake Blvd',
                coordinates: [
                    [34.0850, -118.2650], // North end
                    [34.0820, -118.2650], // Middle
                    [34.0790, -118.2650], // Near Sunset
                    [34.0760, -118.2650]  // South end
                ],
                baseSpeed: 30
            },
            {
                name: 'Glendale Blvd',
                coordinates: [
                    [34.0800, -118.2580], // North end
                    [34.0780, -118.2580], // Middle
                    [34.0760, -118.2580], // Near area
                    [34.0740, -118.2580]  // South end
                ],
                baseSpeed: 35
            },
            
            // Parallel east-west streets
            {
                name: 'Temple St',
                coordinates: [
                    [34.0781, -118.2700], // West end
                    [34.0781, -118.2650], // Middle
                    [34.0781, -118.2600], // East end
                ],
                baseSpeed: 30
            },
            {
                name: 'Beverly Blvd',
                coordinates: [
                    [34.0759, -118.2900], // West end
                    [34.0759, -118.2850], // Middle
                    [34.0759, -118.2800], // East end
                ],
                baseSpeed: 30
            }
        ];

        const trafficData = [];
        
        laRoads.forEach(road => {
            // Add realistic traffic variation
            const timeOfDay = new Date().getHours();
            const isRushHour = (timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 19);
            const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
            
            // Create traffic data for each coordinate point
            road.coordinates.forEach((coord, i) => {
                let speedMultiplier = 1;
                if (isRushHour && !isWeekend) {
                    speedMultiplier = 0.2 + Math.random() * 0.6; // 20-80% of normal speed
                } else if (isWeekend) {
                    speedMultiplier = 1.1 + Math.random() * 0.4; // 110-150% of normal speed
                } else {
                    speedMultiplier = 0.7 + Math.random() * 0.5; // 70-120% of normal speed
                }
                
                const currentSpeed = Math.max(3, Math.floor(road.baseSpeed * speedMultiplier));
                const level = UTILS.getTrafficLevelFromSpeed(currentSpeed);
                
                trafficData.push({
                    lat: coord[0],
                    lng: coord[1],
                    location: `${road.name} (Segment ${i + 1})`,
                    speed: currentSpeed,
                    level: level,
                    timestamp: new Date().toISOString(),
                    density: Math.floor(Math.random() * 100) + 1 // Traffic density 1-100
                });
            });
        });
        
        return trafficData.filter(item => this.isInTargetArea(item.lat, item.lng));
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
            // Try to fetch real data, but fall back to mock data for demo
            const response = await fetch('https://data.lacity.org/resource/yv23-pmwf.json?$limit=20');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
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
                return constructionData.length > 0 ? constructionData : this.generateMockConstructionData();
            } else {
                return this.generateMockConstructionData();
            }
        } catch (error) {
            console.warn('Using mock construction data due to API error:', error.message);
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
