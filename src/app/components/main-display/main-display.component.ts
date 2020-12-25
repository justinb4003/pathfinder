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
      vec: [0, 0, 0],
      mass: 5.97e24,
      radius: 6371e3,
      theta: 0,
    } as Body;
    this.bodies.push(sun);
    this.bodies.push(earth);
  }

  public getEarthStep(): Vector3 {
    const earthBody = this.bodies.find((b) => b.label == 'Earth');
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
    var earth = new THREE.IcosahedronGeometry(10, 4);
    
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
    
    var sun = new THREE.IcosahedronGeometry(20, 4);
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
