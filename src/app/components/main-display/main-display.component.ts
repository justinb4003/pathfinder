import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from "@angular/core";
import * as THREE from 'three';
import { Vector3 } from 'three';
import { Body } from '../../shared/models/body.model';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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

  // Screen scaling factor
  private ss: number = 1;

  constructor() {}

  public ngOnInit(): void {
    this.initBodies();
    const earthBody = this.bodies.find((b) => b.label === 'Earth');
    this.ss = 100 / earthBody.radius;
  }

  public ngAfterViewInit(): void {
    // console.log(JSON.stringify(this.bodies, null, 4));
    this.addRender();
    /*
    const step1 = this.getSatStep();
    const step2 = this.getSatStep();
    const step3 = this.getSatStep();
    */
  }

  public initBodies(): void {
    const sun = {
      label: "Sun",
      pos: [0, 0, 0],
      vec: [0, 0, 0],
      mass: 1.989e30,
      radius: 6.957e8,
    } as Body;

    const earthRail = {
      label: "Earth On Rail" ,
      pos: [this.AU, 0, 0],
      vec: [0, 3.0e7, 0],
      mass: 5.97e24,
      radius: 6371e3,
      theta: 0,
    } as Body;
		
		const earth = {
      label: "Earth",
      pos: [0, 0, 0],
      vec: [0, 0, 0],
      mass: 5.97e24,
      radius: 6371e3,
      theta: 0,
    } as Body;
    
    const sat = {
      label: "JJB01",
      pos: [earth.radius + 2000e3, 0, 0],
      vec: [0, 6900, 0],
      mass: 1,
      radius: 1,
      theta: 0,
    } as Body;

    this.bodies.push(sun);
    this.bodies.push(earthRail);
    this.bodies.push(earth);
    this.bodies.push(sat);
  }

  public getRailEarthStep(): Vector3 {
    const earthBody = this.bodies.find((b) => b.label == 'Earth On Rail');
    const currX = earthBody.pos[0];
    const currY = earthBody.pos[1];
    const newTheta = earthBody.theta + 0.01
    earthBody.theta = newTheta;
    const newX = Math.cos(newTheta) * this.AU;
    const newY = Math.sin(newTheta) * this.AU;
    const dx = newX - currX;
    const dy = newY - currY;
    earthBody.pos[0] = newX;
    earthBody.pos[1] = newY;
    return new Vector3(dx, dy, 0);
  }
		
public getEarthStep(): Vector3 {
    const dt = 3600 * 24 * 7;
    const sunBody = this.bodies.find((b) => b.label == 'Sun');
    const earthBody = this.bodies.find((b) => b.label == 'Earth');

    const dx = earthBody.vec[0] * dt;
    const dy = earthBody.vec[1] * dt;
    const dz = earthBody.vec[2] * dt;
  
	  earthBody.pos[0] += dx;
    earthBody.pos[1] += dy;
    earthBody.pos[2] += dz;
    
    /* This is where you went wrong! */
    const x1 = earthBody.pos[0];
    const x2 = sunBody.pos[0];
    const y1 = earthBody.pos[1];
    const y2 = sunBody.pos[1];
    const xd = x2 - x1;
    const yd = y2 - y1;
    const xs = xd * xd;
    const ys = yd * yd;
    const dist = Math.sqrt(xs + ys);
    const F = -this.G*sunBody.mass / (dist*dist);
    const theta = Math.atan(yd / xd);
    // console.log('theta', theta, Math.sin(theta));
    let xf = Math.cos(theta) * F;
    let yf = Math.sin(theta) * F;

    if (!isFinite(xf)) { xf = 0; }
    if (!isFinite(yf)) { yf = 0; }
    /* See above ... STILL BROKE!*/

    earthBody.vec[0] += xf;
    earthBody.vec[1] += yf;
 
    return new Vector3(dx, dy, 0);
  }


  public getSatStep(): Vector3 {
    const dt = 100;
    const s = this.bodies.find((b) => b.label === 'JJB01');
    const e = this.bodies.find((b) => b.label === 'Earth');
    // console.log('Sat vector', s.vec);
    const dx = s.vec[0] * dt;
    const dy = s.vec[1] * dt;
    const dz = s.vec[2] * dt;

    // console.log('Orig', s.pos);
    s.pos[0] += dx;
    s.pos[1] += dy;
    // console.log('Moved', s.pos);

    // Now calculate gravity forces
    const xd = (s.pos[0] - e.pos[0]);
    const yd = (s.pos[1] - e.pos[1]);
    const dist = Math.sqrt(yd*yd + xd*xd);
    const F = -this.G*e.mass / (dist*dist);
    let theta = Math.atan(yd / xd);
    if (s.pos[0] < 0) {
      theta = Math.PI/2 + (Math.PI/2 + theta);
    }
    /*
    console.log(
      theta.toFixed(2),
      'Deg: ', (theta * (180/Math.PI)).toFixed(2),
      Math.cos(theta).toFixed(2),
      Math.sin(theta).toFixed(2),
    );
    */
    const xa = Math.cos(theta) * F;
    const ya = Math.sin(theta) * F;
    s.vec[0] += xa * dt;
    s.vec[1] += ya * dt;
    // console.log(xa, ya);

    return new Vector3(dx, dy, dz);

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

    const controls = new OrbitControls( camera, renderer.domElement );

    const earthBody = this.bodies.find((b) => b.label == 'Earth') || null;
    const satBody = this.bodies.find((b) => b.label == 'JJB01') || null;

    //Create Scene with geometry, material-> mesh
    var scene = new THREE.Scene();
    //var earthRail = new THREE.IcosahedronGeometry(10, 4);
    var earth = new THREE.IcosahedronGeometry(earthBody.radius * this.ss, 4);
    var sat = new THREE.IcosahedronGeometry(4, 2);
    
    const bpos = satBody.pos;
    sat.translate(bpos[0] * this.ss, bpos[1] * this.ss, bpos[2] * this.ss);
    
    /*
    var earthRailMat = new THREE.MeshBasicMaterial({
      color: 0x0011FF,
      wireframe: true,
      wireframeLinewidth: 1,
    });
    var earthRailMesh = new THREE.Mesh(earthRail, earthRailMat);
    scene.add(earthRailMesh);
    */
		  
    var earthMat = new THREE.MeshBasicMaterial({
      color: 0x0000FF,
      wireframe: true,
      wireframeLinewidth: 1,
    });
    var earthMesh = new THREE.Mesh(earth, earthMat);
    scene.add(earthMesh);
   
    var satMat = new THREE.MeshBasicMaterial({
      color: 0xFF00FF,
      wireframe: true,
      wireframeLinewidth: 1,
    });
    var satMesh = new THREE.Mesh(sat, satMat);
    scene.add(satMesh);
    
    /*
    var sun = new THREE.IcosahedronGeometry(20, 4);
    sun.translate(0, 0, 0);
    var sunMat = new THREE.MeshBasicMaterial({
      color: 0xFFFF11,
      wireframe: true,
      wireframeLinewidth: 1,
    });
    var sunMesh = new THREE.Mesh(sun, sunMat);
    scene.add(sunMesh);
    */
    
    console.log('renderer added');

    const self = this;
    controls.update();
    const animate = function () {
      requestAnimationFrame( animate );
      controls.update();
      /*
      earth.rotateX(0.001);
      earth.rotateY(0.005);
      */
			
      /*
      var earthRailStep = self.getRailEarthStep();
      earthRail.translate(earthRailStep.x * ss, earthRailStep.y * ss, earthRailStep.z * ss);
			
			var earthStep = self.getEarthStep();
      earth.translate(earthStep.x * ss, earthStep.y * ss, earthStep.z * ss);
      */

      var satStep = self.getSatStep();
      sat.translate(satStep.x * self.ss, satStep.y * self.ss, satStep.z * self.ss);

      renderer.render( scene, camera );
    };

    animate();
  }
}
