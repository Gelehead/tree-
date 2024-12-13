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

			const apples = [];

			// Creation of leaves
			if(node.a1 < alpha*leavesCutoff){

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
				if(Math.random()*100 < applesProbability*100){
					const appleGeometry = new THREE.BoxBufferGeometry(alpha, alpha, alpha);
					appleGeometry.applyMatrix(transformationMatrix);
					apples.push(appleGeometry);
				}
			}


			return [[cylinder], leaves, apples];

		}

		// Recursion of tree creation
		function getTreeGeometry(node){
			var branches = [], leaves =  [], apples = [];
			if(node){
				[branches, leaves, apples] = getCylinder(node, scene, alpha, radialDivisions);
				for(let i = 0; i < node.childNode.length; i++){
					const [lc, lv, la] = getTreeGeometry(node.childNode[i], scene, alpha, radialDivisions);
					branches = branches.concat(lc);
					leaves = leaves.concat(lv);
					apples = apples.concat(la);
				}
			}
			return [branches, leaves, apples]
		}


		// Fusion of geometries
		const [Tgeometries, Lgeometries, Ageometries] = getTreeGeometry(rootNode, scene, alpha, radialDivisions);

		const treeGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(Tgeometries, false);
		const leavesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(Lgeometries, false);
		const appleGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(Ageometries, false);

		// Creation of meshes
		const bmat = new THREE.MeshLambertMaterial({color: 0x8B5A2B});
		const lmat = new THREE.MeshPhongMaterial({color: 0x3A5F0B});
		const amat = new THREE.MeshPhongMaterial({color: 0x5F0B0B});
		const tree = new THREE.Mesh(treeGeometry, bmat);
		const leavesMesh = new THREE.Mesh(leavesGeometry, lmat);
		const applesMesh = new THREE.Mesh(appleGeometry, amat);

		// Displaying tree and leaves
		scene.add(tree);
		scene.add(leavesMesh);
		scene.add(applesMesh);
	},

	// give vertices to draw
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

		const f32vertices = new Float32Array(vertices);
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(f32vertices, 3));
		
		return geometry;
	},
	
	

	// Generate leaves for the given branch
	drawLeaves: function(alpha, leavesDensity, rootNode) {
		const leaves = [];
		for (let j = 0; j < leavesDensity; j++) {
			// Random position within a cube of size alpha/2 around the branch
			const offsetX = (Math.random() - 0.5) * alpha * 3;
			const offsetY = (Math.random() - 0.5) * alpha * 3;
			const offsetZ = (Math.random() - 0.5) * alpha * 3;


			// Random position on the branch, x e [0,1], the position between p0 and p1
			const x = Math.random();
			const branchPosition = rootNode.p0.clone()
									.multiplyScalar(x)
									.add(
										rootNode.p1.clone()
											.multiplyScalar((1-x))
			);

			const offset = new THREE.Vector3(offsetX, offsetY, offsetZ);
			const leafPosition = branchPosition.add(offset);

			// Create leaf geometry and randomly rotate it
			const leafGeometry = new THREE.PlaneBufferGeometry(alpha, alpha);
			leafGeometry.rotateX(Math.random() * Math.PI);
			leafGeometry.rotateY(Math.random() * Math.PI);
			leafGeometry.rotateZ(Math.random() * Math.PI);

			// Apply translation to the leaf geometry
			const transform = new THREE.Matrix4().makeTranslation(
				leafPosition.x,
				leafPosition.y,
				leafPosition.z
			);
			leafGeometry.applyMatrix4(transform);

			leaves.push(leafGeometry);
		}
		return leaves;
	},

	// Generate apples (if required)
	drawApples: function(alpha, applesProbability, position) {
		if (Math.random() > applesProbability) return null; // Skip apple generation

		// code repetition, womp womp
		const offsetX = (Math.random() - 0.5) * alpha;
		const offsetY = ((Math.random() - 0.5) * alpha) / 2;
		const offsetZ = (Math.random() - 0.5) * alpha;

		const offset = new THREE.Vector3(offsetX, offsetY, offsetZ);
		const applePosition = position.add(offset);

		const appleGeometry = new THREE.BoxBufferGeometry(alpha, alpha, alpha);

		// Rotating the apple geometry randomly
		appleGeometry.rotateX(Math.random() * Math.PI);
		appleGeometry.rotateY(Math.random() * Math.PI);
		appleGeometry.rotateZ(Math.random() * Math.PI);

		// Apply translation to the apple geometry
		const transform = new THREE.Matrix4().makeTranslation(
			applePosition.x,
			applePosition.y,
			applePosition.z
		);
		appleGeometry.applyMatrix4(transform);

		const indices = [
			0, 1, 2, 2, 3, 0,  
			4, 5, 6, 6, 7, 4,  
			0, 3, 7, 7, 4, 0,  
			1, 2, 6, 6, 5, 1,  
			3, 2, 6, 6, 7, 3,  
			0, 1, 5, 5, 4, 0   
		];

		appleGeometry.setIndex(indices);

		return appleGeometry;
	},

	// Principal drawing function
	drawTreeHermite: function(
		rootNode,
		scene,
		alpha,
		leavesCutoff = 0.1,
		leavesDensity = 10,
		applesProbability = 0.05,
		matrix = new THREE.Matrix4()
	) 
	{
		let leaves = [];
		let apples = [];
		let branches = [];

		// Draw branches
		for (let i = 0; i < rootNode.sections.length - 1; i++) {
			const branch = this.traceCylinder(
				rootNode.sections[i],
				rootNode.sections[i + 1]
			);
			branches.push(branch)
		}

		// Handle terminal branches and thin branches for leaves and apples
		if (rootNode.a0 < (alpha * leavesCutoff) || rootNode.childNode.length === 0) {
			const branchLeaves = this.drawLeaves(alpha, leavesDensity, rootNode);
			if (branchLeaves) leaves.push(...branchLeaves);

			const branchApple = this.drawApples(alpha, applesProbability, rootNode.p1);
			if (branchApple) apples.push(branchApple);
		}

		// Recurse into child nodes
		if (rootNode.childNode && rootNode.childNode.length > 0) {
			for (const child of rootNode.childNode) {
				const branchJoint = this.traceCylinder(rootNode.sections[rootNode.sections.length - 1], child.sections[1]);

				// Gather leaves and apples from child nodes
				const childResults = this.drawTreeHermite(
					child,
					scene,
					alpha,
					leavesCutoff,
					leavesDensity,
					applesProbability,
					matrix
				);
				leaves.push(...childResults.leaves);
				apples.push(...childResults.apples);
				branches.push(branchJoint);
				branches.push(...childResults.branches);
			}
		}

		// Final rendering for the root node
		if (!rootNode.parentNode) {
			// Create a parent group for the entire tree
			const tree = new THREE.Group();

			// Merge and add branches to the tree
			if (branches.length > 0) {
				const branchesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(
					branches,
					false
				);

				branchesGeometry.computeVertexNormals();
				const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
				const branchMesh = new THREE.Mesh(branchesGeometry, woodMaterial);

				tree.add(branchMesh); // Add branches to the tree group
			}

			// Merge and add leaves to the tree
			if (leaves.length > 0) {
				const leavesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(
					leaves,
					false
				);
				const leafMaterial = new THREE.MeshPhongMaterial({
					color: 0x3a5f0b,
					side: THREE.DoubleSide,
				});
				const leavesMesh = new THREE.Mesh(leavesGeometry, leafMaterial);

				tree.add(leavesMesh); // Add leaves to the tree group
			}

			// Merge and add apples to the tree
			if (apples.length > 0) {
				const applesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(
					apples,
					false
				);
				const appleMaterial = new THREE.MeshPhongMaterial({
					color: 0xff0000,
				});
				const applesMesh = new THREE.Mesh(applesGeometry, appleMaterial);

				tree.add(applesMesh); // Add apples to the tree group
			}
			
			scene.add(tree);
		}

		return { leaves, apples, branches };
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