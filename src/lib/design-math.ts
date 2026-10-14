import { mat4, vec3 } from "gl-matrix";
export function monogramTransform(
  offset: number,
  angle: number,
  scale: number,
) {
  if (
    ![offset, angle, scale].every(Number.isFinite) ||
    scale <= 0 ||
    scale > 2 ||
    Math.abs(offset) > 1
  )
    throw new Error("Invalid monogram transform");
  const point = vec3.fromValues(0.05 + offset * 0.3, 0.36, 0.405);
  const matrix = mat4.create();
  mat4.translate(matrix, matrix, point);
  mat4.rotateZ(matrix, matrix, (angle * Math.PI) / 180);
  mat4.scale(matrix, matrix, vec3.fromValues(scale, scale, scale));
  return {
    position: Array.from(point),
    matrix: Array.from(matrix),
    rotation: (angle * Math.PI) / 180,
  };
}
