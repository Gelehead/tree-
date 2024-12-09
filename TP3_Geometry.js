class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.sections = []; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
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

				for (let i = 0; i < rootNode.childNode.length; i++){
					rootNode.childNode[i].parentNode = rootNode;
				}
	
				const index = rootNode.childNode.indexOf(sonNode);
				if (index !== -1) rootNode.childNode.splice(index, 1);
				rootNode.childNode.push(...sonNode.childNode);
	
				this.simplifySkeleton(rootNode, rotationThreshold);
			} else {
				this.simplifySkeleton(sonNode, rotationThreshold);
			}
		}
	},

	gothroughtree: function (rootNode){
		//console.log(rootNode);
		for (let i = 0; i < rootNode.childNode.length; i++) {
			this.gothroughtree(rootNode.childNode[i]);
		}
	},

	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {
		for (let i = 0; i < rootNode.childNode.length; i++) {
			this.generateSegmentsHermite(rootNode.childNode[i], lengthDivisions, radialDivisions);
		}

		let p = rootNode.parentNode;
		let v1 = rootNode.p1.clone().sub(rootNode.p0);
		let v0 = p == null ? v1 : p.p1.clone().sub(p.p0);

		//hermite setup
		let h0 = rootNode.p0.clone();
		let h1 = rootNode.p1.clone();
		// t e [0,1]
		rootNode.sections.push([rootNode.p0])
		for (let t = p == null ? 0 : 1 / lengthDivisions ; t <= 1; t += 1 / lengthDivisions) {

			branch_length = (rootNode.a1 * (t)) + (rootNode.a0 * (1 - t))
			
			let { p: pt, dp } = this.hermite(h0, h1, v0, v1, t);

			dp.normalize();
			let r = new THREE.Vector3(0, 0, 1);
			if (Math.abs(dp.dot(r)) > 0.99) {
				r.set(1, 0, 0); // Avoid collinearity
			}

			let n1 = new THREE.Vector3().crossVectors(r, dp).normalize();
			let n2 = new THREE.Vector3().crossVectors(dp, n1).normalize();

			let pointList = [];
			for (let i = 0; i < radialDivisions; i++) {
				let theta = (2 * Math.PI * i) / radialDivisions;
				let lengthI = (rootNode.a1 * (t)) + (rootNode.a0 * (1 - t));

				let offset = n1.clone()
								.multiplyScalar(Math.cos(theta) * lengthI)
								.add(n2.clone().multiplyScalar(Math.sin(theta) * lengthI));
				pointList.push(pt.clone().add(offset));
			}
			if (!rootNode.sections) rootNode.sections = [];
			rootNode.sections.push(pointList);
		}
	},


	hermite: function (h0, h1, v0, v1, t) {
		// Pre-compute powers of t
		let t2 = t * t;
		let t3 = t2 * t;
	
		// Hermite basis functions
		let p0 = 2 * t3 - 3 * t2 + 1;
		let p1 = -2 * t3 + 3 * t2;
		let r0 = t3 - 2 * t2 + t;
		let r1 = t3 - t2;
	
		// Derivatives of the Hermite basis functions
		let dp0 = 6 * t2 - 6 * t;
		let dp1 = -6 * t2 + 6 * t;
		let dr0 = 3 * t2 - 4 * t + 1;
		let dr1 = 3 * t2 - 2 * t;
	
		// Calculate position (pt) and derivative (dpt)
		let pt = h0.clone().multiplyScalar(p0)
			.add(h1.clone().multiplyScalar(p1))
			.add(v0.clone().multiplyScalar(r0))
			.add(v1.clone().multiplyScalar(r1));
	
		let dpt = h0.clone().multiplyScalar(dp0)
			.add(h1.clone().multiplyScalar(dp1))
			.add(v0.clone().multiplyScalar(dr0))
			.add(v1.clone().multiplyScalar(dr1));
	
		return { p: pt, dp: dpt }; // Return position and tangent
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