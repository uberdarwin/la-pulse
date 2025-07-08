// Data fetch and update logic
class DataManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
    }

    fetchData() {
        this.fetchTrafficData();
        this.fetchEventData();
        this.fetchConstructionData();
        // Simulate fetching signal data
        setTimeout(() => this.simulateSignalData(), 1000);
    }

    async fetchTrafficData() {
        try {
            const response = await fetch(CONFIG.ENDPOINTS.LADOT_TRAFFIC);
            const data = await response.json();
            this.mapManager.updateTrafficLayer(data);
        } catch (error) {
            console.error('Error fetching traffic data:', error);
        }
    }

    async fetchEventData() {
        try {
            const response = await fetch(`${CONFIG.ENDPOINTS.EVENTS}?location.latitude=34.0522&location.longitude=-118.2437&location.within=5mi&token=${CONFIG.API_KEYS.EVENTBRITE}`);
            const data = await response.json();
            const eventDetails = data.events.map(event => ({
                lat: event.venue.address.latitude,
                lng: event.venue.address.longitude,
                title: event.name.text,
                date: event.start.utc,
                venue: event.venue.name,
                category: event.category ? event.category.name : 'Other',
                attendance: event.capacity || 'Unknown'
            }));
            this.mapManager.updateEventsLayer(eventDetails);
        } catch (error) {
            console.error('Error fetching event data:', error);
        }
    }

    async fetchConstructionData() {
        try {
            const response = await fetch(CONFIG.ENDPOINTS.CONSTRUCTION);
            const data = await response.json();
            this.mapManager.updateConstructionLayer(data);
        } catch (error) {
            console.error('Error fetching construction data:', error);
        }
    }

    simulateSignalData() {
        // Simulate signal strength data within the area
        const signals = Array.from({ length: 10 }, () => ({
            lat: CONFIG.MAP.CENTER[0] + (Math.random() - 0.5) * 0.02,
            lng: CONFIG.MAP.CENTER[1] + (Math.random() - 0.5) * 0.02,
            type: 'LTE',
            strength: `${Math.floor(Math.random() * 100)}%`,
            provider: 'Provider X',
            timestamp: new Date().toISOString()
        }));
        this.mapManager.updateSignalsLayer(signals);
    }

    startAutoRefresh() {
        setInterval(() => this.fetchData(), CONFIG.UPDATE_INTERVALS.TRAFFIC);
        setInterval(() => this.fetchData(), CONFIG.UPDATE_INTERVALS.EVENTS);
        setInterval(() => this.fetchData(), CONFIG.UPDATE_INTERVALS.CONSTRUCTION);
    }
}

// Instantiate and initialize modules on page load
document.addEventListener('DOMContentLoaded', () => {
    const mapManager = new MapManager();
    const dataManager = new DataManager(mapManager);

    dataManager.fetchData();
    dataManager.startAutoRefresh();

    // Refresh data manually
    document.getElementById('refresh-data').addEventListener('click', () => {
        dataManager.fetchData();
    });

    // Toggle real-time updates
    let isRealTime = false;
    const toggleRealtimeButton = document.getElementById('toggle-realtime');
    toggleRealtimeButton.addEventListener('click', () => {
        isRealTime = !isRealTime;
        toggleRealtimeButton.textContent = isRealTime ? 'Disable Real-time' : 'Enable Real-time';
        if (isRealTime) {
            dataManager.startAutoRefresh();
        } else {
            clearInterval(this.trafficInterval);
            clearInterval(this.eventsInterval);
            clearInterval(this.constructionInterval);
        }
    });
});

