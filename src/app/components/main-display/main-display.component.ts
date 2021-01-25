import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { Body } from "../../shared/models/body.model";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ThemePalette } from '@angular/material/core';

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
        colorCtr: this.fb.control(null),
      });
  }

  public ngAfterViewInit(): void {
    this.addRenderer();
    this.beginAnimation();
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

    const earthFake = {
      label: "Fake Earth",
      pos: [-100e6, 0, 0],
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
      trailingPoints: [],
    } as Body;

    this.bodies.push(earth);
    // this.bodies.push(earthFake);
    this.bodies.push(sat);
  }

  public performSatStep(): void {
    const dt = 5;

    this.bodies.filter((b) => b.satbody === true).forEach((s) => {
			this.bodies.filter((b) => b.satbody ===false).forEach((e) => {
				// console.log('Sat vector', s.vec);
				s.trailingPoints.push(new Vector3(s.pos[0], s.pos[1], s.pos[2]));
				if (s.trailingPoints.length > 200) {
					s.trailingPoints.shift();
				}
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
				const xa = Math.cos(theta) * F;
				const ya = Math.sin(theta) * F;
				s.vec[0] += xa * dt;
				s.vec[1] += ya * dt;
			});
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
      200,
      earthBody.radius * 20000
    );
    camera.position.z = -earthBody.radius * 3;


    var ambLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambLight);

    const controls = new OrbitControls(camera, this.renderer.domElement);

    //Create Scene with geometry, material-> mesh
    //var earthRail = new THREE.IcosahedronGeometry(10, 4);
		this.bodies.filter((b) => b.satbody === false).forEach((p) => {
			var earth = new THREE.SphereGeometry(earthBody.radius, 32, 32);

			let texture  = new THREE.TextureLoader().load('assets/earthmap1k.jpg');
			var earthMat = new THREE.MeshPhongMaterial({
				map: texture,
			});
			var earthMesh = new THREE.Mesh(earth, earthMat);
			earthMesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
			scene.add(earthMesh);
		});


    var satmeshes: THREE.Mesh[] = [];
    var sattrails: THREE.Line[] = [];


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
        let colorstr = '#ff00ff';
        const colorControl = self.fgSat.controls.colorCtr.value;
        if (colorControl) {
          colorstr = `#${self.fgSat.controls.colorCtr.value.hex}`;
        }
        const satMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colorstr),
          wireframe: true,
          wireframeLinewidth: 1,
        });
        const satMesh = new THREE.Mesh(sat, satMat);
        scene.add(satMesh);
        satmeshes.push(satMesh);

        const trailMat = new THREE.LineBasicMaterial( { color: 0xffffff } );
        const geometry = new THREE.BufferGeometry().setFromPoints( satBody.trailingPoints );
        const line = new THREE.Line( geometry, trailMat );
        scene.add(line);
        sattrails.push(line);
      }

      for(const [index, satBody] of satbodies.entries()) {
        satmeshes[index].position.set(satBody.pos[0], satBody.pos[1], satBody.pos[2]);
        /* Generate trails */
        sattrails[index].geometry = new THREE.BufferGeometry().setFromPoints( satBody.trailingPoints );
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
      trailingPoints: [],
      leadingPoints: [],
    } as Body;

    this.bodies.push(sat);
  }
}
