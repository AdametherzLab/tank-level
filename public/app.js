class TankVisualizer {
    constructor(container) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth/container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);
        
        this.camera.position.z = 5;
        this.setupLights();
        this.animate();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(5,5,5);
        this.scene.add(directional);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    updateTank(config, fillLevel) {
        // Clear existing meshes
        while(this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        // Create tank geometry based on config
        const geometry = this.createGeometry(config);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc,
            transparent: true,
            opacity: 0.7
        });
        const tank = new THREE.Mesh(geometry, material);
        this.scene.add(tank);
    }

    createGeometry(config) {
        switch(config.type) {
            case 'cylindrical':
                return new THREE.CylinderGeometry(
                    config.dimensions.diameter/2,
                    config.dimensions.diameter/2,
                    config.dimensions.height,
                    32
                );
            case 'rectangular':
                return new THREE.BoxGeometry(
                    config.dimensions.length,
                    config.dimensions.width,
                    config.dimensions.height
                );
            case 'spherical':
                return new THREE.SphereGeometry(config.dimensions.diameter/2, 32, 32);
        }
    }
}

// Initialize visualization
const vizContainer = document.getElementById('visualization');
const visualizer = new TankVisualizer(vizContainer);

// HTMX response handling
document.body.addEventListener('htmx:afterRequest', (evt) => {
    if(evt.detail.successful) {
        const res = JSON.parse(evt.detail.xhr.response);
        document.getElementById('volumeValue').textContent = res.volume.toFixed(2);
        document.getElementById('percentageValue').textContent = res.percentage.toFixed(1);
    }
});

// Form change handlers
document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', () => {
        const formData = new FormData(document.getElementById('tankForm'));
        const config = {
            type: formData.get('type'),
            dimensions: {
                diameter: parseFloat(formData.get('diameter')),
                height: parseFloat(formData.get('height')),
                length: parseFloat(formData.get('length')),
                width: parseFloat(formData.get('width'))
            }
        };
        
        visualizer.updateTank(config, parseFloat(formData.get('liquidHeight')));
    });
});