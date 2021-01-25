import { Vector3 } from 'three';

export interface Body {
    label: string;
    pos: number[];
    vec: number[];
    mass: number;
    radius: number;
    theta: number; // Not permanent at all
    satbody: boolean;
    trailingPoints: Vector3[];
    leadingPoints: Vector3[];
}
