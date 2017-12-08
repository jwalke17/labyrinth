"use strict";

var predictability = 2;
function rand_func() {
	var offset = Math.pow(Math.random(),predictability);
	var direction = (Math.random()-0.5)*2;
	var ret = 0.5 + direction*offset/2;
	return ret;
}

function point_between(start,finish,avoid,add_radius) {
	var rand_val = rand_func();
	var vect = subtract_vect(finish,start);
	var len = len_vect(vect);
	var segments = [];
	var prev_avoid = null;
	var prev_end = 0;
	for(var i=0;i<avoid.length;i++) {
		var this_avoid = avoid[i];
		var this_start = this_avoid[0]*len-this_avoid[1]-add_radius;
		var this_end = this_avoid[0]*len+this_avoid[1]+add_radius;
		if(prev_end<this_start) {
			segments.push([prev_end,this_start]);
		}
		prev_end = this_end;
	}
	if(prev_end<1) {
		segments.push([prev_end,1]);
	}


	// var seg_no = Math.floor(rand_val * segments.length) % segments.length;


	var seg_no = 0;
	for(var i=0;i<segments.length;i++) {
		var this_seg = segments[i];
		if(this_seg[1]<=rand_val) {
			seg_no = i;
		}
	}


	if(segments.length==0) {
		return [null,null];
	}
	var segment = segments[seg_no];
	var seg_len = segment[1]-segment[0];
	var seg_offset = rand_val * seg_len;
	// var seg_offset = 0.5 * seg_len;
	var pos = seg_offset + segment[0];
	var small_vect = mult_vect(vect,pos/len);
	var point = add_vect(start,small_vect);
	if(pos>len) {
		console.log("WARNING: out of bounds!",pos,len);
		console.log(start,finish,avoid);
	}
	return [point,pos/len];
}

function create_avoid_list(points,radius) {
	var ret = [];
	for(var i=0;i<points.length;i++) {
		ret.push([points[i],radius]);
	}
	return ret;
}

function filter_gaps_and_scale(gaps,threshold,gap_width,full_len,gt) {
	var ret = [];
	var scaled_gap_width = gap_width/full_len;
	for(var i=0;i<gaps.length;i++) {
		var this_gap = gaps[i];
		if(gt) {
			if(this_gap>=threshold-scaled_gap_width && this_gap<=1) {
				// console.log(this_gap,threshold,this_gap/(1-threshold));
				ret.push(this_gap/(1-threshold))
			}
		} else {
			if(this_gap<=threshold+scaled_gap_width) {
				// console.log(this_gap,threshold,this_gap/(threshold));
				ret.push(this_gap/threshold)
			}
		}
	}
	return ret;
}

function subdivide_region(corners,gaps,gap_width,min_dim,edge_thickness) {
	var top_vector = subtract_vect(corners[3],corners[0]);
	var bottom_vector = subtract_vect(corners[2],corners[1]);
	var top_min_dim = min_dim/dot_prod_vect(mult_vect(norm_vect(rot_90(subtract_vect(corners[1],corners[0]))),min_dim),norm_vect(top_vector));
	var bottom_min_dim = min_dim/dot_prod_vect(mult_vect(norm_vect(rot_90(subtract_vect(corners[3],corners[2]))),min_dim),norm_vect(bottom_vector));
	
	var top_corner;
	var top_pos;
	[top_corner,top_pos] = point_between(corners[0],corners[3],[[0,edge_thickness/2+min_dim]].concat(create_avoid_list(gaps[0],gap_width)).concat([[1,edge_thickness/2+min_dim]]),edge_thickness/2);
	var bottom_corner;
	var bottom_pos;
	[bottom_corner,bottom_pos] = point_between(corners[1],corners[2],[[0,edge_thickness/2+min_dim]].concat(create_avoid_list(gaps[2],gap_width)).concat([[1,edge_thickness/2+min_dim]]),edge_thickness/2);
	
	if(top_corner==null || bottom_corner==null) {
		return [];
	}

	var gap_center;
	var gap_center_pos;
	[gap_center,gap_center_pos] = point_between(top_corner,bottom_corner,[[0,edge_thickness/2+min_dim],[1,edge_thickness/2+min_dim]],gap_width/2);
	if(gap_center==null) {
		return [];
	}

	
	var split_vector = subtract_vect(bottom_corner,top_corner);
	var l_corners = [top_corner,corners[0],corners[1],bottom_corner];
	var r_corners = [bottom_corner,corners[2],corners[3],top_corner];
	var l_gap = gap_center_pos;
	var r_gap = 1-l_gap;
	
	var gap_vector = mult_vect(norm_vect(split_vector),gap_width);
	var gap_top = subtract_vect(gap_center,mult_vect(gap_vector,0.5));
	var gap_bottom = add_vect(gap_center,mult_vect(gap_vector,0.5));
	var top_len = len_vect(top_vector);
	var bottom_len = len_vect(bottom_vector);
	var l = subdivide_region(l_corners,[[l_gap],filter_gaps_and_scale(gaps[0],top_pos,gap_width,top_len,false),gaps[1],filter_gaps_and_scale(gaps[2],bottom_pos,gap_width,bottom_len,false)],gap_width,min_dim,edge_thickness);
	var r = subdivide_region(r_corners,[[r_gap],filter_gaps_and_scale(gaps[2],bottom_pos,gap_width,bottom_len,true),gaps[3],filter_gaps_and_scale(gaps[0],top_pos,gap_width,top_len,true)],gap_width,min_dim,edge_thickness);
	return [[top_corner,gap_top],[gap_bottom,bottom_corner]].concat(l).concat(r);
}

function generate_maze(corners,gap_width,min_dim,edge_thickness) {
	var left_ext = mult_vect(norm_vect(subtract_vect(corners[1],corners[0])),edge_thickness/2);
	var bottom_ext = mult_vect(norm_vect(subtract_vect(corners[2],corners[1])),edge_thickness/2);
	var right_ext = mult_vect(norm_vect(subtract_vect(corners[3],corners[2])),edge_thickness/2);
	var top_ext = mult_vect(norm_vect(subtract_vect(corners[0],corners[3])),edge_thickness/2);
	var box = [
		[subtract_vect(corners[0],left_ext),add_vect(corners[1],left_ext)],
		[subtract_vect(corners[1],bottom_ext),add_vect(corners[2],bottom_ext)],
		[subtract_vect(corners[2],right_ext),add_vect(corners[3],right_ext)],
		[subtract_vect(corners[3],top_ext),add_vect(corners[0],top_ext)]
	];
	return box.concat(subdivide_region(corners,[[],[],[],[]],gap_width,min_dim,edge_thickness));
}

function display_rand_maze(canvas_id,corners,gap_width,min_dim,edge_thickness) {
	draw_lines(canvas_id,generate_maze(corners,gap_width,min_dim,edge_thickness),edge_thickness);
}