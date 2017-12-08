"use strict";

var canvas_id="gl-canvas";

function mult_vect(a,m) {
	return [a[0]*m,a[1]*m];
}

function add_vect(a,b) {
	return [a[0]+b[0],a[1]+b[1]];
}

function dot_prod_vect(a,b) {
	return a[0]*b[0] + a[1]*b[1];
}

function subtract_vect(a,b) {
	return add_vect(a,mult_vect(b,-1));
}

function div_vect(a,d) {
	return mult_vect(a,1/d);
}

function len_vect(a) {
	return Math.sqrt(a[0]*a[0]+a[1]*a[1]);
}

function norm_vect(a) {
	return div_vect(a,len_vect(a));
}

function rot_90(a) {
	return [-a[1],a[0]];
}
