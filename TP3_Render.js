TP3.Render = {
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {

		TP3.Geometry.simplifySkeleton(rootNode);

		// Computing leaf position
		function leafPosition(length, final){
			//REWORK NEEDED LEAVES GO TOO FAR AWAY
			const r = alpha/2 * Math.sqrt(Math.random());
			let f = 0;
			if(final)
				f = Math.random()*length;
			const a = Math.random() * 2 * Math.PI;
			return new THREE.Vector3(Math.cos(a)*r, (Math.random()*length*2) - length + f, Math.sin(a)*r);
		}

		function getCylinder(node){
			// Parameters
			const branchVector = new THREE.Vector3().subVectors(node.p1, node.p0);
			const length = branchVector.length();
			const cylinder = new THREE.CylinderBufferGeometry(node.a1, node.a0, length, radialDivisions);

			// Computing rotation parameters
			const a = new THREE.Vector3(0, 1, 0);
			const [ax, ang] = TP3.Geometry.findRotation(a, branchVector);

			// Transformation matrix
			const translationMatrix = new THREE.Matrix4();
			translationMatrix.set(1, 0, 0, 0, 0, 1, 0, length/2, 0, 0, 1, 0, 0, 0, 0, 1);
			const rotationMatrix = new THREE.Matrix4();
			rotationMatrix.makeRotationAxis(ax, ang);
			const translationMatrix2 = new THREE.Matrix4();
			translationMatrix2.set(1, 0, 0, node.p0.x, 0, 1, 0, node.p0.y, 0, 0, 1, node.p0.z, 0, 0, 0, 1);

			// Application of transformation
			const transformationMatrix = new THREE.Matrix4;
			transformationMatrix.multiply(translationMatrix2);
			transformationMatrix.multiply(rotationMatrix);
			transformationMatrix.multiply(translationMatrix);

			cylinder.applyMatrix4(transformationMatrix);

			const leaves = [];

			// Creation of leaves
			if(node.a1 <alpha*leavesCutoff){
				for(let j = 0; j < leavesDensity; j++){
					const leafPos = leafPosition(length, node.childNode.length === 0);
					const mat2 = new THREE.Matrix4();
					mat2.set(1, 0, 0, leafPos.x, 0, 1, 0, leafPos.y, 0, 0, 1, leafPos.z, 0, 0, 0,1);
					const leafGeometry = new THREE.PlaneBufferGeometry(alpha, alpha);
					leafGeometry.rotateX(Math.random()*Math.PI);
					leafGeometry.rotateY(Math.random()*Math.PI);
					leafGeometry.rotateZ(Math.random()*Math.PI);
					leafGeometry.applyMatrix(transformationMatrix);
					leafGeometry.applyMatrix(mat2);
					leaves.push(leafGeometry);
				}
			}


			return [[cylinder], leaves];

		}

		// Recursion of tree creation
		function getTreeGeometry(node){
			var branches = [], leaves =  [];
			if(node){
				[branches, leaves] = getCylinder(node, scene, alpha, radialDivisions);
				for(let i = 0; i < node.childNode.length; i++){
					const [lc, lv] = getTreeGeometry(node.childNode[i], scene, alpha, radialDivisions);
					branches = branches.concat(lc);
					leaves = leaves.concat(lv)
				}
			}
			return [branches, leaves]
		}


		// Fusion of geometries
		const [Tgeometries, Lgeometries] = getTreeGeometry(rootNode, scene, alpha, radialDivisions);

		const treeGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(Tgeometries, false);
		const leavesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(Lgeometries, false);

		// Creation of meshes
		const bmat = new THREE.MeshLambertMaterial({color: 0x8B5A2B});
		const lmat = new THREE.MeshPhongMaterial({color: 0x3A5F0B});
		const tree = new THREE.Mesh(treeGeometry, bmat);
		const leavesMesh = new THREE.Mesh(leavesGeometry, lmat)

		// Displaying tree and leaves
		scene.add(tree);
		scene.add(leavesMesh);

	},

	traceCylinder: function (section_1, section_2){
		const vertices = [];	
		for (let j = 0; j < section_1.length; j++) {
			const nextJ = (j + 1) % section_1.length;

			// Triangle 1
			vertices.push(
				section_2[j].x, section_2[j].y, section_2[j].z,  
				section_1[j].x, section_1[j].y, section_1[j].z,  
				section_1[nextJ].x, section_1[nextJ].y, section_1[nextJ].z 
			);

			// Triangle 2
			vertices.push(
				section_2[j].x, section_2[j].y, section_2[j].z, 
				section_1[nextJ].x, section_1[nextJ].y, section_1[nextJ].z, 
				section_2[nextJ].x, section_2[nextJ].y, section_2[nextJ].z  
			);
		}

		return vertices;
	},

	drawCylinder: function(vertices){
		const wood_mat = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });

		const f32vertices = new Float32Array(vertices);
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(f32vertices, 3));
		
		geometry.computeVertexNormals();

		const log = new THREE.Mesh(geometry, wood_mat);
		scene.add(log);
	},

	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		if (!rootNode || !rootNode.sections || rootNode.sections.length < 2) {return;}	
	
		for (let i = 0; i < rootNode.sections.length - 1; i++) {
			const vertices = this.traceCylinder(rootNode.sections[i], rootNode.sections[i + 1])
			this.drawCylinder(vertices);
		}
	
		// Recurse into child nodes
		if (rootNode.childNode && rootNode.childNode.length > 0) {
			for (const child of rootNode.childNode) {
				console.log(rootNode.sections);	
				const vert = this.traceCylinder(rootNode.sections[rootNode.sections.length - 1], child.sections[1]);
				this.drawCylinder(vert);
				this.drawTreeHermite(child, scene, alpha, leavesCutoff, leavesDensity, applesProbability, matrix);
			}
		}
	},
	
	
	

	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, rootNode) {
		//TODO
	},

	drawTreeSkeleton: function (rootNode, scene, color = 0xffffff, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: color });
		var line = new THREE.LineSegments(geometry, material);
		line.applyMatrix4(matrix);
		scene.add(line);

		return line.geometry;
	},

	updateTreeSkeleton: function (geometryBuffer, rootNode) {

		var stack = [];
		stack.push(rootNode);

		var idx = 0;
		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}
			geometryBuffer[idx * 6] = currentNode.p0.x;
			geometryBuffer[idx * 6 + 1] = currentNode.p0.y;
			geometryBuffer[idx * 6 + 2] = currentNode.p0.z;
			geometryBuffer[idx * 6 + 3] = currentNode.p1.x;
			geometryBuffer[idx * 6 + 4] = currentNode.p1.y;
			geometryBuffer[idx * 6 + 5] = currentNode.p1.z;

			idx++;
		}
	},


	drawTreeNodes: function (rootNode, scene, color = 0x00ff00, size = 0.05, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.PointsMaterial({ color: color, size: size });
		var points = new THREE.Points(geometry, material);
		points.applyMatrix4(matrix);
		scene.add(points);

	},


	drawTreeSegments: function (rootNode, scene, lineColor = 0xff0000, segmentColor = 0xffffff, orientationColor = 0x00ff00, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];
		var pointsS = [];
		var pointsT = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			const segments = currentNode.sections;
			for (var i = 0; i < segments.length - 1; i++) {
				points.push(TP3.Geometry.meanPoint(segments[i]));
				points.push(TP3.Geometry.meanPoint(segments[i + 1]));
			}
			for (var i = 0; i < segments.length; i++) {
				pointsT.push(TP3.Geometry.meanPoint(segments[i]));
				pointsT.push(segments[i][0]);
			}

			for (var i = 0; i < segments.length; i++) {

				for (var j = 0; j < segments[i].length - 1; j++) {
					pointsS.push(segments[i][j]);
					pointsS.push(segments[i][j + 1]);
				}
				pointsS.push(segments[i][0]);
				pointsS.push(segments[i][segments[i].length - 1]);
			}
		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var geometryS = new THREE.BufferGeometry().setFromPoints(pointsS);
		var geometryT = new THREE.BufferGeometry().setFromPoints(pointsT);

		var material = new THREE.LineBasicMaterial({ color: lineColor });
		var materialS = new THREE.LineBasicMaterial({ color: segmentColor });
		var materialT = new THREE.LineBasicMaterial({ color: orientationColor });

		var line = new THREE.LineSegments(geometry, material);
		var lineS = new THREE.LineSegments(geometryS, materialS);
		var lineT = new THREE.LineSegments(geometryT, materialT);

		line.applyMatrix4(matrix);
		lineS.applyMatrix4(matrix);
		lineT.applyMatrix4(matrix);

		scene.add(line);
		scene.add(lineS);
		scene.add(lineT);

	}
}