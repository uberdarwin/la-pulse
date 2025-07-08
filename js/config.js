// Configuration for LA Pulse Application
const CONFIG = {
    // Map Configuration
    MAP: {
        CENTER: [34.0522, -118.2437], // Los Angeles coordinates
        ZOOM: 12,
        MIN_ZOOM: 10,
        MAX_ZOOM: 18
    },
    
    // Target Areas
    AREAS: {
        EAST_LA: {
            name: "East Los Angeles",
            center: [34.0394, -118.1695],
            radius: 2 // miles
        },
        ECHO_PARK: {
            name: "Echo Park",
            center: [34.0778, -118.2607],
            radius: 2 // miles
        },
        ELYSIAN_PARK: {
            name: "Elysian Park",
            center: [34.0781, -118.2376],
            radius: 2 // miles
        }
    },
    
    // API Configuration (Replace with your actual API keys)
    API_KEYS: {
        GOOGLE_MAPS: 'YOUR_GOOGLE_MAPS_API_KEY',
        MAPBOX: 'YOUR_MAPBOX_API_KEY',
        EVENTBRITE: 'YOUR_EVENTBRITE_API_KEY'
    },
    
    // API Endpoints
    ENDPOINTS: {
        DODGERS: 'https://www.mlb.com/dodgers/schedule',
        LADOT_TRAFFIC: 'https://data.lacity.org/resource/d4vt-q4t5.json',
        EVENTS: 'https://www.eventbriteapi.com/v3/events/search/',
        CONSTRUCTION: 'https://data.lacity.org/resource/5yj9-sknz.json'
    },
    
    // Update intervals (in milliseconds)
    UPDATE_INTERVALS: {
        TRAFFIC: 60000, // 1 minute
        EVENTS: 300000, // 5 minutes
        CONSTRUCTION: 900000 // 15 minutes
    },
    
    // Map Styles
    STYLES: {
        TRAFFIC_COLORS: {
            EMPTY: '#FF69B4',      // Pink for empty roads
            LIGHT: '#4CAF50',      // Green for general traffic
            MODERATE: '#FF9800',   // Orange for medium traffic
            HEAVY: '#F44336',      // Dark red for jammed streets
            SEVERE: '#8B0000'      // Darker red for severe jams
        },
        TRAFFIC_SPEEDS: {
            EMPTY: 55,      // 55+ mph
            LIGHT: 35,      // 35-55 mph
            MODERATE: 20,   // 20-35 mph
            HEAVY: 10,      // 10-20 mph
            SEVERE: 5       // 0-10 mph
        },
        EVENT_COLORS: {
            SPORTS: '#FF5722',
            CONCERTS: '#E91E63',
            FESTIVALS: '#9C27B0',
            OTHER: '#607D8B'
        }
    }
};

// Utility functions
const UTILS = {
    // Convert miles to meters
    milesToMeters: (miles) => miles * 1609.34,
    
    // Check if point is within radius of center
    isWithinRadius: (point, center, radiusMiles) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = center[0] * Math.PI/180;
        const φ2 = point[0] * Math.PI/180;
        const Δφ = (point[0]-center[0]) * Math.PI/180;
        const Δλ = (point[1]-center[1]) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        const distance = R * c;
        return distance <= UTILS.milesToMeters(radiusMiles);
    },
    
    // Format date for display
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Get traffic color based on congestion level
    getTrafficColor: (level) => {
        switch(level.toLowerCase()) {
            case 'empty': return CONFIG.STYLES.TRAFFIC_COLORS.EMPTY;
            case 'light': return CONFIG.STYLES.TRAFFIC_COLORS.LIGHT;
            case 'moderate': return CONFIG.STYLES.TRAFFIC_COLORS.MODERATE;
            case 'heavy': return CONFIG.STYLES.TRAFFIC_COLORS.HEAVY;
            case 'severe': return CONFIG.STYLES.TRAFFIC_COLORS.SEVERE;
            default: return CONFIG.STYLES.TRAFFIC_COLORS.MODERATE;
        }
    },
    
    // Get traffic level based on speed
    getTrafficLevelFromSpeed: (speed) => {
        if (speed >= CONFIG.STYLES.TRAFFIC_SPEEDS.EMPTY) return 'empty';
        if (speed >= CONFIG.STYLES.TRAFFIC_SPEEDS.LIGHT) return 'light';
        if (speed >= CONFIG.STYLES.TRAFFIC_SPEEDS.MODERATE) return 'moderate';
        if (speed >= CONFIG.STYLES.TRAFFIC_SPEEDS.HEAVY) return 'heavy';
        return 'severe';
    },
    
    // Get traffic level description
    getTrafficDescription: (level) => {
        switch(level.toLowerCase()) {
            case 'empty': return 'Empty Roads';
            case 'light': return 'Light Traffic';
            case 'moderate': return 'Moderate Traffic';
            case 'heavy': return 'Heavy Traffic';
            case 'severe': return 'Severe Congestion';
            default: return 'Unknown';
        }
    }
};
