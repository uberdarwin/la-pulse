// Map Management Module
class MapManager {
    constructor() {
        this.map = null;
        this.layers = {
            traffic: L.layerGroup(),
            events: L.layerGroup(),
            construction: L.layerGroup(),
            signals: L.layerGroup()
        };
        this.markers = {
            traffic: [],
            events: [],
            construction: [],
            signals: []
        };
        this.circles = [];
        this.init();
    }

    init() {
        // Initialize the map
        this.map = L.map('map', {
            center: CONFIG.MAP.CENTER,
            zoom: CONFIG.MAP.ZOOM,
            minZoom: CONFIG.MAP.MIN_ZOOM,
            maxZoom: CONFIG.MAP.MAX_ZOOM
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add all layers to map
        Object.values(this.layers).forEach(layer => layer.addTo(this.map));

        // Draw target areas
        this.drawTargetAreas();

        // Set up event listeners
        this.setupEventListeners();
    }

    drawTargetAreas() {
        // Draw circles for target areas
        Object.values(CONFIG.AREAS).forEach(area => {
            const circle = L.circle(area.center, {
                color: '#00bcd4',
                fillColor: '#00bcd4',
                fillOpacity: 0.1,
                radius: UTILS.milesToMeters(area.radius),
                weight: 2,
                dashArray: '5, 5'
            }).addTo(this.map);

            circle.bindPopup(`
                <div>
                    <h4>${area.name}</h4>
                    <p>Monitoring radius: ${area.radius} miles</p>
                </div>
            `);

            this.circles.push(circle);
        });
    }

    setupEventListeners() {
        // Layer toggle controls
        document.getElementById('traffic-layer').addEventListener('change', (e) => {
            this.toggleLayer('traffic', e.target.checked);
        });

        document.getElementById('events-layer').addEventListener('change', (e) => {
            this.toggleLayer('events', e.target.checked);
        });

        document.getElementById('construction-layer').addEventListener('change', (e) => {
            this.toggleLayer('construction', e.target.checked);
        });

        document.getElementById('signals-layer').addEventListener('change', (e) => {
            this.toggleLayer('signals', e.target.checked);
        });
    }

    toggleLayer(layerName, show) {
        if (show) {
            this.layers[layerName].addTo(this.map);
        } else {
            this.map.removeLayer(this.layers[layerName]);
        }
    }

    clearLayer(layerName) {
        this.layers[layerName].clearLayers();
        this.markers[layerName] = [];
    }

    addTrafficMarker(data) {
        const color = UTILS.getTrafficColor(data.level);
        const radius = data.level === 'severe' ? 12 : data.level === 'heavy' ? 10 : 8;
        
        const marker = L.circleMarker([data.lat, data.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            radius: radius,
            weight: 2
        });

        marker.bindPopup(`
            <div>
                <h4>${UTILS.getTrafficDescription(data.level)}</h4>
                <p><strong>Location:</strong> ${data.location}</p>
                <p><strong>Current Speed:</strong> ${data.speed} mph</p>
                <p><strong>Condition:</strong> ${data.level.charAt(0).toUpperCase() + data.level.slice(1)}</p>
                <p><strong>Updated:</strong> ${UTILS.formatDate(data.timestamp)}</p>
            </div>
        `);

        this.layers.traffic.addLayer(marker);
        this.markers.traffic.push(marker);
        return marker;
    }

    addEventMarker(data) {
        const color = CONFIG.STYLES.EVENT_COLORS[data.category.toUpperCase()] || 
                     CONFIG.STYLES.EVENT_COLORS.OTHER;

        const marker = L.marker([data.lat, data.lng], {
            icon: L.divIcon({
                className: 'event-marker',
                html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        });

        marker.bindPopup(`
            <div>
                <h4>${data.title}</h4>
                <p><strong>Date:</strong> ${UTILS.formatDate(data.date)}</p>
                <p><strong>Venue:</strong> ${data.venue}</p>
                <p><strong>Category:</strong> ${data.category}</p>
                <p><strong>Expected Attendance:</strong> ${data.attendance || 'TBD'}</p>
            </div>
        `);

        this.layers.events.addLayer(marker);
        this.markers.events.push(marker);
        return marker;
    }

    addConstructionMarker(data) {
        const marker = L.marker([data.lat, data.lng], {
            icon: L.divIcon({
                className: 'construction-marker',
                html: `<div style="background-color: #FF9800; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;">🚧</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        });

        marker.bindPopup(`
            <div>
                <h4>Road Construction</h4>
                <p><strong>Location:</strong> ${data.location}</p>
                <p><strong>Type:</strong> ${data.type}</p>
                <p><strong>Duration:</strong> ${data.startDate} - ${data.endDate}</p>
                <p><strong>Impact:</strong> ${data.impact}</p>
            </div>
        `);

        this.layers.construction.addLayer(marker);
        this.markers.construction.push(marker);
        return marker;
    }

    addSignalMarker(data) {
        const marker = L.circleMarker([data.lat, data.lng], {
            color: '#9C27B0',
            fillColor: '#9C27B0',
            fillOpacity: 0.6,
            radius: 6,
            weight: 2,
            className: 'pulse-marker'
        });

        marker.bindPopup(`
            <div>
                <h4>Signal Strength</h4>
                <p><strong>Type:</strong> ${data.type}</p>
                <p><strong>Strength:</strong> ${data.strength}</p>
                <p><strong>Provider:</strong> ${data.provider || 'Unknown'}</p>
                <p><strong>Last Updated:</strong> ${UTILS.formatDate(data.timestamp)}</p>
            </div>
        `);

        this.layers.signals.addLayer(marker);
        this.markers.signals.push(marker);
        return marker;
    }

    updateTrafficLayer(trafficData) {
        this.clearLayer('traffic');
        trafficData.forEach(data => this.addTrafficMarker(data));
    }

    updateEventsLayer(eventsData) {
        this.clearLayer('events');
        eventsData.forEach(data => this.addEventMarker(data));
    }

    updateConstructionLayer(constructionData) {
        this.clearLayer('construction');
        constructionData.forEach(data => this.addConstructionMarker(data));
    }

    updateSignalsLayer(signalsData) {
        this.clearLayer('signals');
        signalsData.forEach(data => this.addSignalMarker(data));
    }

    // Center map on specific area
    centerOnArea(areaName) {
        const area = CONFIG.AREAS[areaName];
        if (area) {
            this.map.setView(area.center, 14);
        }
    }

    // Get current map bounds
    getBounds() {
        return this.map.getBounds();
    }

    // Check if coordinates are within current view
    isInView(lat, lng) {
        const bounds = this.getBounds();
        return bounds.contains([lat, lng]);
    }
}
