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
		//TODO
	},

	hermite: function (h0, h1, v0, v1, t) {
		//TODO
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