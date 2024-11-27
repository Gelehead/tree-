class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.sections = null; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
	}
}

TP3.Geometry = {

	simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
		const initialChildren = [...rootNode.childNode];
	
		for (let i = 0; i < initialChildren.length; i++) {
			const sonNode = initialChildren[i];
	
			let v1 = new THREE.Vector3(
				rootNode.p1.x - rootNode.p0.x,
				rootNode.p1.y - rootNode.p0.y,
				rootNode.p1.z - rootNode.p0.z
			).normalize();
			
			let v2 = new THREE.Vector3(
				sonNode.p1.x - sonNode.p0.x,
				sonNode.p1.y - sonNode.p0.y,
				sonNode.p1.z - sonNode.p0.z
			).normalize();
			
			if (Math.abs(v1.dot(v2) - 1) <= rotationThreshold) {
				rootNode.p1 = sonNode.p1;
				rootNode.a1 = sonNode.a1;
	
				const index = rootNode.childNode.indexOf(sonNode);
				if (index !== -1) rootNode.childNode.splice(index, 1);
				rootNode.childNode.push(...sonNode.childNode);
	
				this.simplifySkeleton(rootNode, rotationThreshold);
			} else {
				this.simplifySkeleton(sonNode, rotationThreshold);
			}
		}
	},
	

	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {
		if ( rootNode.parentNode == null ) {
			this.generateSegmentsHermite(rootNode.childNode[0]);
			return rootNode;
		} else {
			for (let i = 0; i < rootNode.childNode.length; i++) {
				this.generateSegmentsHermite(rootNode.childNode[i]);
			}
			p = rootNode.parentNode;
			gp = p.parentNode;

			h0 = rootNode.p0;
			h1 = gp.p0;

			let v0 = new THREE.Vector3(
				rootNode.p1.x - rootNode.p0.x,
				rootNode.p1.y - rootNode.p0.y,
				rootNode.p1.z - rootNode.p0.z
			);
			
			let v1 = new THREE.Vector3(
				gp.p1.x - gp.p0.x,
				gp.p1.y - gp.p0.y,
				gp.p1.z - gp.p0.z
			);

			for (let t = 0; t < 1; t += 1/lengthDivisions) {
				// point coordinates (p) and speed (dp) at t [0,1] on the curve
				p, dp = this.hermite(h0, h1, v0, v1, t);
				dp = normalize(dp);
				// arbitrary vector to get normal vectors
				let r = new Vector3(0,0,1);
				var n1 = normalize(cross(r,dp));
				var n2 = normalize(cross(dp, n1));

				//get the points around the radialDivision sided polygon
				var lengthI = 0;
				var theta = 0;
				for (let i = 0; i < radialDivisions ; i++){
					theta = (2*Math.PI*i) / radialDivisions;
					// linear interpolation of radius
					lengthI = (i)*rootNode.a1 + (1-i)*gp.a0;
					rootNode.sections.append(p + lengthI*(Math.cos(theta)*n1 + Math.sin(theta) * n2));
				}
			}
		}
	},

	hermite: function (h0, h1, v0, v1, t) {
		// calculating pt
		var p0 = 2 * Math.pow(t, 3) - 3 * Math.pow(t, 2) + 1;
		var p1 = -2 * Math.pow(t, 3) - 3 * Math.pow(t, 2);
		var r0 = Math.pow(t, 3) - 2*Math.pow(t, 2) + t;
		var r1 = Math.pow(t, 3) - Math.pow(t, 2);

		pt = h0 * p0
		   + h1 * p1
		   + v0 * r0
		   + v1 * r1
	 	;

		// calculating dt
		var dp0 = 6 * Math.pow(t, 2) - 6 * t;
		var dp1 = -6 * Math.pow(t, 2) + 6 * t;
		var dr0 = 3 * Math.pow(t, 2) - 4 * t + 1;
		var dr1 = 3 * Math.pow(t, 2) - 2 * t;

		dpt = h0 * dp0
		   + h1 * dp1
		   + v0 * dr0
		   + v1 * dr1
	 	;

		return [pt, dpt]

	},


	// Trouver l'axe et l'angle de rotation entre deux vecteurs
	findRotation: function (a, b) {
		const axis = new THREE.Vector3().crossVectors(a, b).normalize();
		var c = a.dot(b) / (a.length() * b.length());

		if (c < -1) {
			c = -1;
		} else if (c > 1) {
			c = 1;
		}

		const angle = Math.acos(c);

		return [axis, angle];
	},

	// returns the distance between the 2 points a and b (the length of the ab segment)
	length : function ( a, b ) {
		return MATH.sqrt(
			(a.x - b.x)*(a.x - b.x) - 
			(a.y - b.y)*(a.y - b.y) - 
			(a.z - b.z)*(a.z - b.z)
		);
	},

	// Projeter un vecteur a sur b
	project: function (a, b) {
		return b.clone().multiplyScalar(a.dot(b) / (b.lengthSq()));
	},

	// Trouver le vecteur moyen d'une liste de vecteurs
	meanPoint: function (points) {
		var mp = new THREE.Vector3();

		for (var i = 0; i < points.length; i++) {
			mp.add(points[i]);
		}

		return mp.divideScalar(points.length);
	},

	translate: function(o, v){
		o.translateX(v.x);
		o.translateY(v.y);
		o.translateZ(v.z);
	},

};