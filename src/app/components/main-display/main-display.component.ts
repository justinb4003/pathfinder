import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import * as THREE from "three";
import { Vector3 } from "three";
import { Body } from "../../shared/models/body.model";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export interface vecDelta {
  x: number;
  y: number;
  z: number;
}

@Component({
  selector: 'app-main-display',
    templateUrl: './main-display.component.html',
  styleUrls: ['./main-display.component.scss'],
})

export class MainDisplayComponent implements OnInit, AfterViewInit {
  @ViewChild("glmain")
  public glmain!: ElementRef;

  private animId: number;

  public bodies: Body[] = [];

  public fgSat: FormGroup; 

  private AU: number = 1.496e11;
  private G: number = 6.6743e-11;

  constructor(
    private fb: FormBuilder,
  ) {}

  public ngOnInit(): void {
    this.initBodies();
    this.fgSat = this.fb.group(
      { 
        satAlt: this.fb.control('200'), 
        satVel: this.fb.control('7900'),
      });
  }

  public ngAfterViewInit(): void {
    // console.log(JSON.stringify(this.bodies, null, 4));
    this.addRenderer();
    this.beginAnimation();
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
      satbody: false,
    } as Body;

    const earth = {
      label: "Earth",
      pos: [0, 0, 0],
      vec: [0, 0, 0],
      mass: 5.97e24,
      radius: 6371e3,
      theta: 0,
      satbody: false,
    } as Body;

    const sat = {
      label: "JJB01",
      pos: [earth.radius + 200e3, 0, 0],
      vec: [0, -9000, 0],
      mass: 1,
      radius: 1,
      theta: 0,
      satbody: true,
    } as Body;

    this.bodies.push(sun);
    this.bodies.push(earth);
    this.bodies.push(sat);
  }

  public performSatStep(): void {
    const dt = 5;
    const e = this.bodies.find((b) => b.label === "Earth");

    this.bodies.filter((b) => b.satbody === true).forEach((s) => {

      // console.log('Sat vector', s.vec);
      const dx = s.vec[0] * dt;
      const dy = s.vec[1] * dt;
      const dz = s.vec[2] * dt;

      // console.log('Orig', s.pos);
      s.pos[0] += dx;
      s.pos[1] += dy;
      // console.log('Moved', s.pos);

      // Now calculate gravity forces
      const xd = s.pos[0] - e.pos[0];
      const yd = s.pos[1] - e.pos[1];
      const dist = Math.sqrt(yd * yd + xd * xd);
      if (dist < e.radius) {
        // Sat explodes, or something. So, shove it in the Earth for now
        s.pos = [0, 0, 0];
        // Null out the velocity so it'll just stay in there.
        s.vec = [0, 0, 0];
        console.log('Sat dead.');
      }
      const F = (-this.G * e.mass) / (dist * dist);
      let theta = Math.atan(yd / xd);
      if (s.pos[0] < 0) {
        theta = Math.PI / 2 + (Math.PI / 2 + theta);
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
    });
  }

  private renderer: THREE.WebGLRenderer; 
  private container: any;
  private container_width: number;
  private container_height: number;

  public addRenderer(): void {
    //Add Renderer
    this.renderer = new THREE.WebGLRenderer();
    this.container = this.glmain.nativeElement;
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight;
    this.container_width = w;
    this.container_height = h;
    this.renderer.setSize(w, h);
    this.container.appendChild(this.renderer.domElement);
  }

  public beginAnimation(): void {

    const earthBody = this.bodies.find((b) => b.label == "Earth") || null;
    
    var scene = new THREE.Scene();

    //Add Camera
    var camera = new THREE.PerspectiveCamera(
      75,
      this.container_width / this.container_height,
      2,
      earthBody.radius * 2000
    );
    camera.position.z = -earthBody.radius * 10;


    var ambLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambLight);

    /*
    var northLight = new THREE.DirectionalLight(0xffffff);
    northLight.position.set(0, 0, earthBody.radius * 200).normalize();
    scene.add(northLight);

    var southLight = new THREE.DirectionalLight(0xffffff);
    southLight.position.set(0, 0, -earthBody.radius * 200).normalize();
    scene.add(southLight);
    */

    const controls = new OrbitControls(camera, this.renderer.domElement);

    //Create Scene with geometry, material-> mesh
    //var earthRail = new THREE.IcosahedronGeometry(10, 4);
    var earth = new THREE.SphereGeometry(earthBody.radius, 32, 32);

    let texture  = new THREE.TextureLoader().load('assets/earthmap1k.jpg');
    var earthMat = new THREE.MeshPhongMaterial({
      map: texture,
    });
    var earthMesh = new THREE.Mesh(earth, earthMat);
    scene.add(earthMesh);

    var satmeshes: THREE.Mesh[] = [];

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

    console.log("renderer added");

    const self = this;
    controls.update();
    const satBody = this.bodies.find((b) => b.label == "JJB01") || null;

    const animate = function () {
      self.animId = requestAnimationFrame(animate);
      controls.update();

      self.performSatStep();

      const satbodies = self.bodies.filter((b) => b.satbody === true);
      while (satmeshes.length < satbodies.length) {
        const sat = new THREE.IcosahedronGeometry(earthBody.radius / 100, 2);
        const satMat = new THREE.MeshBasicMaterial({
          color: 0xff00ff,
          wireframe: true,
          wireframeLinewidth: 1,
        });

        console.log('adding mesh');
        const satMesh = new THREE.Mesh(sat, satMat);
        scene.add(satMesh);
        satmeshes.push(satMesh);
      }
     
      for(const [index, satBody] of satbodies.entries()) {
        satmeshes[index].position.set(satBody.pos[0], satBody.pos[1], satBody.pos[2]);
      }

      self.renderer.render(scene, camera);
    };
    animate();
  }

  public stopAnimation(): void {
    cancelAnimationFrame(this.animId);
  }

  public addSat(): void {
    const earth = this.bodies.find((b) => b.label === 'Earth');
    const km = +this.fgSat.controls.satAlt.value;
    const posx = earth.radius + km * 1e3;
    const vely = this.fgSat.controls.satVel.value * -1.0;
    const sat = {
      label: "dynamic",
      pos: [posx, 0, 0],
      vec: [0, vely, 0],
      mass: 1,
      radius: 1,
      theta: 0,
      satbody: true,
    } as Body;

    console.log(this.bodies.length);
    this.bodies.push(sat);
    console.log(this.bodies.length);
    console.log('added new body to system');
  }
}
