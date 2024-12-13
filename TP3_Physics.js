const appleMass = 0.075;

TP3.Physics = {
	initTree: function (rootNode) {

		this.computeTreeMass(rootNode);

		var stack = [];
		stack.push(rootNode);

		while (stack.length > 0) {
			var currentNode = stack.pop();
			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			currentNode.vel = new THREE.Vector3();
			currentNode.matrixRotation = new THREE.Matrix4().set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
			currentNode.matrixTranslation = new THREE.Matrix4().set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
			currentNode.strength = currentNode.a0;
		}
	},

	computeTreeMass: function (node) {
		var mass = 0;

		for (var i = 0; i < node.childNode.length; i++) {
			mass += this.computeTreeMass(node.childNode[i]);
		}
		mass += node.a1;
		if (node.appleIndices !== null) {
			mass += appleMass;
		}
		node.mass = mass;

		return mass;
	},

	propagateRotation: function(node, rot){
		if(node){
			const p0 = node.p0;

			// Rotation dans l'espace objet
			const t_1 = new THREE.Matrix4().makeTranslation(-node.p0.x, -node.p0.y, -node.p0.z);
			const t_2 = new THREE.Matrix4().makeTranslation(node.p0.x, node.p0.y, node.p0.z);
			node.p1.applyMatrix4(t_1);
			node.p1.applyMatrix4(rot);
			node.p1.applyMatrix4(t_2);

			node.matrixRotation.multiply(rot);

			// Translation pour nouvelle position selon transformation parent
			const t_vect = new THREE.Vector3().subVectors(node.parentNode.p1, p0);
			const trans2 = new THREE.Matrix4().makeTranslation(t_vect.x, t_vect.y, t_vect.z);

			node.p0.applyMatrix4(trans2);
			node.p1.applyMatrix4(trans2);

			node.matrixTranslation.multiply(trans2);

			for(var i = 0; i < node.childNode.length; i++){
				this.propagateRotation(node.childNode[i], rot);
			}
		}
	},

	applyForces_ : function(node, dt, time) {

	},

	applyForces: function (node, dt, time) {

		var u = Math.sin(1 * time) * 4;
		u += Math.sin(2.5 * time) * 2;
		u += Math.sin(5 * time) * 0.4;

		var v = Math.cos(1 * time + 56485) * 4;
		v += Math.cos(2.5 * time + 56485) * 2;
		v += Math.cos(5 * time + 56485) * 0.4;


		// Projection de mouvement

		// Copies des points nécessaires
		var p1 = node.p1.clone();
		const vt = node.vel.clone().multiplyScalar(dt);
		var new_p1 = p1.clone().add(vt);

		// Calcul de la rotation nécessaire
		var v1 = new THREE.Vector3().subVectors(new_p1, node.p0).normalize();
		var v0 = new THREE.Vector3().subVectors(p1, node.p0).normalize();

		const [ax, ang] = TP3.Geometry.findRotation(v1, v0);
		const quat = new THREE.Quaternion().setFromAxisAngle(ax, ang);
		const rot = new THREE.Matrix4().makeRotationFromQuaternion(quat);

		// Application rotation
		const t1 = new THREE.Matrix4().makeTranslation(-node.p0.x, -node.p0.y, -node.p0.z);
		const t2 = new THREE.Matrix4().makeTranslation(node.p0.x, node.p0.y, node.p0.z);

		node.p1.applyMatrix4(t1);
		node.p1.applyMatrix4(rot);
		node.p1.applyMatrix4(t2);

		node.matrixRotation.multiply(rot);

		// Propagation
		for(var e = 0; e < node.childNode.length; e++){
			this.propagateRotation(node.childNode[e], rot);
		}



		// Ajouter le vent
		node.vel.add(new THREE.Vector3(u / Math.sqrt(node.mass), 0, v / Math.sqrt(node.mass)).multiplyScalar(dt));
		// Ajouter la gravite
		node.vel.add(new THREE.Vector3(0, -0.01 * node.mass, 0).multiplyScalar(dt));


		// Force de restitution
		v0 = new THREE.Vector3().subVectors(p1, node.p0).normalize();
		v1 = new THREE.Vector3().subVectors(node.p1, node.p0).normalize();

		const [ax2, ang2] = TP3.Geometry.findRotation(v1, v0);

		var rest = ax2.clone().multiplyScalar(-Math.sqrt(ang2)/15);

		rest.multiplyScalar(100*node.a0);
		node.vel.add(rest);

		if(node.childNode.length === 0){
			node.vel.multiplyScalar(0.15);
		} else {
			node.vel.multiplyScalar(0.7);
		}




		// TODO: Projection du mouvement, force de restitution et amortissement de la velocite

		// Appel recursif sur les enfants
		for (var i = 0; i < node.childNode.length; i++) {
			this.applyForces(node.childNode[i], dt, time);
		}
	}
}