import * as THREE from 'three';
import type { VesselConfig, Dimensions } from './types';

export class TankVisualizer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private tankMesh?: THREE.Mesh;
  private liquidMesh?: THREE.Mesh;

  constructor(private container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    
    this.initScene();
    this.setupLights();
    this.setupCamera();
  }

  private initScene() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);
    this.camera.position.z = 5;
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
  }

  private setupCamera() {
    const controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
  }

  private createTankGeometry(config: VesselConfig): THREE.BufferGeometry {
    switch (config.type) {
      case 'cylindrical':
        return this.createCylindricalGeometry(config.dimensions, config.orientation);
      case 'rectangular':
        return this.createRectangularGeometry(config.dimensions);
      case 'spherical':
        return this.createSphericalGeometry(config.dimensions);
      case 'conical':
        return this.createConicalGeometry(config.dimensions);
      case 'elliptical':
        return this.createEllipticalGeometry(config.dimensions);
      default:
        throw new Error('Unsupported vessel type');
    }
  }

  private createCylindricalGeometry(dimensions: Dimensions, orientation?: string) {
    const radius = (dimensions.diameter || 0) / 2;
    const height = dimensions.height || 0;
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    
    if (orientation === 'horizontal') {
      geometry.rotateZ(Math.PI / 2);
    }
    return geometry;
  }

  private createRectangularGeometry(dimensions: Dimensions) {
    return new THREE.BoxGeometry(
      dimensions.length || 0,
      dimensions.width || 0,
      dimensions.height || 0
    );
  }

  private createSphericalGeometry(dimensions: Dimensions) {
    const radius = (dimensions.diameter || 0) / 2;
    return new THREE.SphereGeometry(radius, 32, 32);
  }

  private createConicalGeometry(dimensions: Dimensions) {
    const topRadius = (dimensions.topDiameter || 0) / 2;
    const bottomRadius = (dimensions.bottomDiameter || 0) / 2;
    const height = dimensions.height || 0;
    return new THREE.CylinderGeometry(topRadius, bottomRadius, height, 32);
  }

  private createEllipticalGeometry(dimensions: Dimensions) {
    const major = (dimensions.majorDiameter || 0) / 2;
    const minor = (dimensions.minorDiameter || 0) / 2;
    const length = dimensions.length || 0;
    return new THREE.CapsuleGeometry(major, length, 4, 8);
  }

  updateTank(config: VesselConfig, fillLevel: number) {
    this.clearScene();
    
    // Create tank mesh
    const tankGeometry = this.createTankGeometry(config);
    const tankMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xcccccc,
      transparent: true,
      opacity: 0.7
    });
    this.tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
    this.scene.add(this.tankMesh);

    // Create liquid surface
    const liquidGeometry = this.createLiquidGeometry(config, fillLevel);
    const liquidMaterial = new THREE.MeshPhongMaterial({
      color: 0x0099ff,
      transparent: true,
      opacity: 0.8
    });
    this.liquidMesh = new THREE.Mesh(liquidGeometry, liquidMaterial);
    this.scene.add(this.liquidMesh);
  }

  private createLiquidGeometry(config: VesselConfig, fillLevel: number) {
    switch (config.type) {
      case 'cylindrical':
        return this.createCylindricalLiquid(config.dimensions, fillLevel, config.orientation);
      case 'rectangular':
        return this.createRectangularLiquid(config.dimensions, fillLevel);
      case 'spherical':
        return this.createSphericalLiquid(config.dimensions, fillLevel);
      default:
        return new THREE.PlaneGeometry(1, 1);
    }
  }

  private createCylindricalLiquid(dimensions: Dimensions, fillLevel: number, orientation?: string) {
    const radius = (dimensions.diameter || 0) / 2;
    const height = orientation === 'horizontal' ? dimensions.diameter || 0 : dimensions.height || 0;
    const liquidHeight = Math.min(fillLevel, height);
    
    return new THREE.CylinderGeometry(
      radius,
      radius,
      liquidHeight,
      32
    );
  }

  private createRectangularLiquid(dimensions: Dimensions, fillLevel: number) {
    return new THREE.BoxGeometry(
      dimensions.length || 0,
      dimensions.width || 0,
      Math.min(fillLevel, dimensions.height || 0)
    );
  }

  private createSphericalLiquid(dimensions: Dimensions, fillLevel: number) {
    const radius = (dimensions.diameter || 0) / 2;
    const liquidHeight = Math.min(fillLevel, dimensions.diameter || 0);
    return new THREE.SphereGeometry(
      radius,
      32,
      32,
      0,
      Math.PI * 2,
      0,
      Math.PI * (liquidHeight / (dimensions.diameter || 1))
    );
  }

  private clearScene() {
    if (this.tankMesh) {
      this.scene.remove(this.tankMesh);
      this.tankMesh.geometry.dispose();
    }
    if (this.liquidMesh) {
      this.scene.remove(this.liquidMesh);
      this.liquidMesh.geometry.dispose();
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}
