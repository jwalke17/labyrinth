"use strict";

var canvas_id="gl-canvas";

function draw_line(canvas_id,points,thickness) {
	var canvas = document.getElementById(canvas_id);
	var context = canvas.getContext('2d');

	var perp_line = rot_90(norm_vect(subtract_vect(points[1],points[0])));
	var corner_offset = mult_vect(perp_line,thickness/2);
	var corner_offset_neg = mult_vect(corner_offset,-1);
	var corners = [
		add_vect(points[0],corner_offset),
		add_vect(points[0],corner_offset_neg),
		add_vect(points[1],corner_offset_neg),
		add_vect(points[1],corner_offset),
	];

	context.beginPath();
	context.moveTo(corners[0][0], corners[0][1]);
	context.lineTo(corners[1][0], corners[1][1]);
	context.lineTo(corners[2][0], corners[2][1]);
	context.lineTo(corners[3][0], corners[3][1]);
	context.fill();
}

function draw_lines(canvas_id,lines,thickness) {
	for(var i=0;i<lines.length;i++) {
		draw_line(canvas_id,lines[i],thickness);
	}
}
