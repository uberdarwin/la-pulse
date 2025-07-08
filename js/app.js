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

    // Initial data load
    dataManager.fetchData();
    
    // Set up control handlers
    setupControlHandlers(dataManager);
    
    console.log('LA Pulse initialized successfully!');
});

// Set up control event handlers
function setupControlHandlers(dataManager) {
    // Refresh data manually
    document.getElementById('refresh-data').addEventListener('click', () => {
        console.log('Manual refresh triggered');
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
            toggleRealtimeButton.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
        } else {
            dataManager.stopAutoRefresh();
            toggleRealtimeButton.style.background = 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)';
        }
    });

    // Event filter handler
    document.getElementById('event-filter').addEventListener('change', (e) => {
        const filter = e.target.value;
        console.log('Event filter changed to:', filter);
        
        // Filter events based on category
        dataManager.dataSources.fetchEvents().then(events => {
            const filteredEvents = filter === 'all' ? events : events.filter(event => 
                event.category.toLowerCase().includes(filter.toLowerCase())
            );
            dataManager.mapManager.updateEventsLayer(filteredEvents);
        });
    });

    // Add click handlers for area navigation
    addAreaNavigation(dataManager.mapManager);
}

// Add area navigation functionality
function addAreaNavigation(mapManager) {
    // Add navigation buttons to the controls
    const controlsDiv = document.getElementById('controls');
    const navigationDiv = document.createElement('div');
    navigationDiv.className = 'control-group';
    navigationDiv.innerHTML = `
        <h3>Quick Navigation</h3>
        <button id="goto-east-la" class="nav-button">East LA</button>
        <button id="goto-echo-park" class="nav-button">Echo Park</button>
        <button id="goto-elysian-park" class="nav-button">Elysian Park</button>
    `;
    
    controlsDiv.appendChild(navigationDiv);
    
    // Add event listeners for navigation
    document.getElementById('goto-east-la').addEventListener('click', () => {
        mapManager.centerOnArea('EAST_LA');
    });
    
    document.getElementById('goto-echo-park').addEventListener('click', () => {
        mapManager.centerOnArea('ECHO_PARK');
    });
    
    document.getElementById('goto-elysian-park').addEventListener('click', () => {
        mapManager.centerOnArea('ELYSIAN_PARK');
    });
}

