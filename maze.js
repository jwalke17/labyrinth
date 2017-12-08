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
	var bot_vector = subtract_vect(corners[2],corners[1]);
	var top_min_dim = min_dim/dot_prod_vect(mult_vect(norm_vect(rot_90(subtract_vect(corners[1],corners[0]))),min_dim),norm_vect(top_vector));
	var bot_min_dim = min_dim/dot_prod_vect(mult_vect(norm_vect(rot_90(subtract_vect(corners[3],corners[2]))),min_dim),norm_vect(bot_vector));
	
	var top_corner;
	var bot_corner;
	var top_pos;
	var bot_pos;
	var top_avoid = [[0,edge_thickness/2+min_dim]].concat(create_avoid_list(gaps[0],gap_width)).concat([[1,edge_thickness/2+min_dim]]);
	var bot_avoid = [[0,edge_thickness/2+min_dim]].concat(create_avoid_list(gaps[2],gap_width)).concat([[1,edge_thickness/2+min_dim]]);
	[top_corner,top_pos] = point_between(corners[0],corners[3],top_avoid,edge_thickness/2);
	[bot_corner,bot_pos] = point_between(corners[1],corners[2],bot_avoid,edge_thickness/2);
	
	if(top_corner==null || bot_corner==null) {
		return [];
	}

	var gap_center;
	var gap_center_pos;
	[gap_center,gap_center_pos] = point_between(top_corner,bot_corner,[[0,edge_thickness/2+min_dim],[1,edge_thickness/2+min_dim]],gap_width/2);
	if(gap_center==null) {
		return [];
	}

	
	var split_vector = subtract_vect(bot_corner,top_corner);
	var l_corners = [top_corner,corners[0],corners[1],bot_corner];
	var r_corners = [bot_corner,corners[2],corners[3],top_corner];
	var l_gap = gap_center_pos;
	var r_gap = 1-l_gap;
	
	var gap_vector = mult_vect(norm_vect(split_vector),gap_width);
	var gap_top = subtract_vect(gap_center,mult_vect(gap_vector,0.5));
	var gap_bot = add_vect(gap_center,mult_vect(gap_vector,0.5));
	var top_len = len_vect(top_vector);
	var bot_len = len_vect(bot_vector);
	var l = subdivide_region(l_corners,[[l_gap],filter_gaps_and_scale(gaps[0],top_pos,gap_width,top_len,false),gaps[1],filter_gaps_and_scale(gaps[2],bot_pos,gap_width,bot_len,false)],gap_width,min_dim,edge_thickness);
	var r = subdivide_region(r_corners,[[r_gap],filter_gaps_and_scale(gaps[2],bot_pos,gap_width,bot_len,true),gaps[3],filter_gaps_and_scale(gaps[0],top_pos,gap_width,top_len,true)],gap_width,min_dim,edge_thickness);
	return [[top_corner,gap_top],[gap_bot,bot_corner]].concat(l).concat(r);
}

function generate_maze(box,gap_width,min_dim,edge_thickness) {
	var lft_ext = mult_vect(norm_vect(subtract_vect(box[1],box[0])),edge_thickness/2);
	var bot_ext = mult_vect(norm_vect(subtract_vect(box[2],box[1])),edge_thickness/2);
	var rgt_ext = mult_vect(norm_vect(subtract_vect(box[3],box[2])),edge_thickness/2);
	var top_ext = mult_vect(norm_vect(subtract_vect(box[0],box[3])),edge_thickness/2);
	var corners = [
		[subtract_vect(box[0],top_ext),add_vect(box[1],bot_ext)],
		[subtract_vect(box[1],lft_ext),add_vect(box[2],rgt_ext)],
		[subtract_vect(box[2],bot_ext),add_vect(box[3],top_ext)],
		[subtract_vect(box[3],rgt_ext),add_vect(box[0],lft_ext)]
	];
	return corners.concat(subdivide_region(box,[[],[],[],[]],gap_width,min_dim,edge_thickness));
}

function display_rand_maze(canvas_id,box,gap_width,min_dim,edge_thickness) {
	var maze = generate_maze(box,gap_width,min_dim,edge_thickness);
	console.log(maze);
	draw_lines(canvas_id,maze,edge_thickness);
}