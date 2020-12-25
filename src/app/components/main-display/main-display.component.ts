import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from "@angular/core";
import * as THREE from 'three';
import { Vector3 } from "three";
import { Body } from '../../shared/models/body.model';

export interface vecDelta {
  x: number,
  y: number,
  z: number,
}


@Component({
  selector: "app-main-display",
  templateUrl: "./main-display.component.html",
  styleUrls: ["./main-display.component.scss"],
})

export class MainDisplayComponent implements OnInit, AfterViewInit {
  @ViewChild("glmain")
  public glmain!: ElementRef;

  public bodies: Body[] = [];

  private AU: number = 1.496e11;
  private G: number = 6.67430e-11;

  constructor() {}

  public ngOnInit(): void {
    this.initBodies();
  }

  public ngAfterViewInit(): void {
    // console.log(JSON.stringify(this.bodies, null, 4));
    this.addRender();
  }

  public initBodies(): void {
    const sun = {
      label: "Sun",
      pos: [0, 0, 0],
      vec: [0, 0, 0],
      mass: 1.989e30,
      radius: 6.957e8,
    } as Body;

    const earth = {
      label: "Earth",
      pos: [this.AU, 0, 0],
      vec: [0, 3.0e7, 0],
      mass: 5.97e24,
      radius: 6371e3,
      theta: 0,
    } as Body;
    this.bodies.push(sun);
    this.bodies.push(earth);
  }

  public getEarthStep(): Vector3 {
    const earthBody = this.bodies.find((b) => b.label == 'Earth');
    const sunBody = this.bodies.find((b) => b.label == 'Sun');
    
    const dx = earthBody.vec[0] * 10;
    const dy = earthBody.vec[1] * 10;
    earthBody.pos[0] += dx;
    earthBody.pos[1] += dy;
    // Calc the new velocities
    var bodyDist = Math.hypot(
      earthBody.pos[0] - sunBody.pos[0],
      earthBody.pos[1] - sunBody.pos[1]
    );
    let fSun = (this.G * sunBody.mass) / (bodyDist**2) 
    // Need theta? No, stop doing cos/sin for this
    // Needs to translate to 3d, not stuck in 2d mode, go back to diffeq
    // Not that hard.  Just write it down, work it out.
    // Pick back up at 9pm, solve the earth stepping problem
    // Do it with 3d vectors but leave it 2d math in reality for now
    // Work in orbit on the camera
    // Now put in actual numbers for a starting vector setup
    // Watch it fly!
    // May need to load in multiple starting points or epochs

    return new Vector3(dx, dy, 0);
  }

  public addRender(): void {
    //Add Renderer
    const renderer = new THREE.WebGLRenderer();
    var container = this.glmain.nativeElement;
    var w = container.offsetWidth;
    var h = container.offsetHeight;
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    //Add Camera
    var camera = new THREE.PerspectiveCamera(75, w / h, 2, 1000);
    camera.position.z = 400;

    //Create Scene with geometry, material-> mesh
    var scene = new THREE.Scene();
    var earth = new THREE.IcosahedronGeometry(10, 2);
    
    const earthBody = this.bodies.find((b) => b.label == 'Earth') || null;
    const ss = 200 / this.AU;
    const bpos = earthBody.pos;
    earth.translate(bpos[0] * ss, 0, 0);
    
    var earthMat = new THREE.MeshBasicMaterial({
      color: 0x0011FF,
      wireframe: true,
      wireframeLinewidth: 1,
    });
    var earthMesh = new THREE.Mesh(earth, earthMat);
    scene.add(earthMesh);
    
    var sun = new THREE.IcosahedronGeometry(20, 3);
    sun.translate(0, 0, 0);
    var sunMat = new THREE.MeshBasicMaterial({
      color: 0xFFFF11,
      wireframe: true,
      wireframeLinewidth: 1,
    });
    var sunMesh = new THREE.Mesh(sun, sunMat);

    scene.add(sunMesh);
    
    console.log('renderer added');

    const self = this;
    const animate = function () {
      requestAnimationFrame( animate );
      /*
      earth.rotateX(0.001);
      earth.rotateY(0.005);
      */
      
      var earthStep = self.getEarthStep();
      const ss = 200 / self.AU;
      earth.translate(earthStep.x * ss, earthStep.y * ss, earthStep.z * ss);

      renderer.render( scene, camera );
    };

    animate();
  }
}
