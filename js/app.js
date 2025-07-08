// Data fetch and update logic
class DataManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.dataSources = new DataSources();
        this.intervals = [];
    }

    async fetchData() {
        console.log('Fetching data...');
        await this.fetchTrafficData();
        await this.fetchEventData();
        await this.fetchConstructionData();
        // Simulate fetching signal data
        setTimeout(() => this.simulateSignalData(), 1000);
        this.updateInfoPanel();
    }

    async fetchTrafficData() {
        try {
            const trafficData = await this.dataSources.fetchLACityTrafficData();
            this.mapManager.updateTrafficLayer(trafficData);
            console.log(`Loaded ${trafficData.length} traffic data points`);
        } catch (error) {
            console.error('Error fetching traffic data:', error);
        }
    }

    async fetchEventData() {
        try {
            const eventsData = await this.dataSources.fetchEvents();
            this.mapManager.updateEventsLayer(eventsData);
            console.log(`Loaded ${eventsData.length} events`);
        } catch (error) {
            console.error('Error fetching event data:', error);
        }
    }

    async fetchConstructionData() {
        try {
            const constructionData = await this.dataSources.fetchConstructionData();
            this.mapManager.updateConstructionLayer(constructionData);
            console.log(`Loaded ${constructionData.length} construction projects`);
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
        console.log(`Loaded ${signals.length} signal data points`);
    }

    updateInfoPanel() {
        // Update events list
        this.dataSources.fetchEvents().then(events => {
            const eventsListElement = document.getElementById('events-list');
            if (events.length > 0) {
                eventsListElement.innerHTML = events.map(event => `
                    <div class="event-item">
                        <h4>${event.title}</h4>
                        <p><strong>Date:</strong> ${UTILS.formatDate(event.date)}</p>
                        <p><strong>Venue:</strong> ${event.venue}</p>
                        <p><strong>Category:</strong> ${event.category}</p>
                    </div>
                `).join('');
            } else {
                eventsListElement.innerHTML = '<p>No events found in the area</p>';
            }
        });

        // Update traffic status
        this.dataSources.fetchLACityTrafficData().then(traffic => {
            const trafficStatusElement = document.getElementById('traffic-status');
            if (traffic.length > 0) {
                const trafficLevels = traffic.reduce((acc, item) => {
                    acc[item.level] = (acc[item.level] || 0) + 1;
                    return acc;
                }, {});
                
                trafficStatusElement.innerHTML = Object.entries(trafficLevels).map(([level, count]) => `
                    <div class="traffic-item">
                        <span>Traffic ${level}</span>
                        <span class="traffic-status traffic-${level.toLowerCase()}">${count} incidents</span>
                    </div>
                `).join('');
            } else {
                trafficStatusElement.innerHTML = '<p>No traffic incidents reported</p>';
            }
        });
    }

    startAutoRefresh() {
        // Clear existing intervals
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        
        // Set up new intervals
        this.intervals.push(
            setInterval(() => this.fetchData(), CONFIG.UPDATE_INTERVALS.TRAFFIC)
        );
        console.log('Auto-refresh started');
    }

    stopAutoRefresh() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        console.log('Auto-refresh stopped');
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

