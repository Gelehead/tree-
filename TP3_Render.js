TP3.Render = {
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		//TODO
		// size of the first cylinder (trunk), will be divided depending on number of "subtrunk"
		baseSize = 10;

		TP3.Geometry.simplifySkeleton(rootNode);
		function drawCylinder(node, scene, alpha, radialDivisions, leavesCutoff, leavesDensity, applesProbability, matrix){
			const length = Math.sqrt(Math.pow(node.p1.x - node.p0.x, 2) + Math.pow(node.p1.x - node.p0.x, 2) + Math.pow(node.p1.y - node.p0.y, 2) + Math.pow(node.p1.z - node.p0.z, 2));
			const geometry = new THREE.CylinderGeometry(node.a1, node.a0, length, radialDivisions);
			const material = new THREE.MeshLambertMaterial({color: 0x8B5A2B});
			const cylinder = new THREE.Mesh( geometry, material );

			const a = new THREE.Vector3(0, 1, 0);
			const [ax, ang] = TP3.Geometry.findRotation(a, new THREE.Vector3(node.p1.x - node.p0.x, node.p1.y - node.p0.y, node.p1.z - node.p0.z));

			const translationMatrix = new THREE.Matrix4();
			translationMatrix.set(1, 0, 0, 0, 0, 1, 0, length/2, 0, 0, 1, 0, 0, 0, 0, 1);
			cylinder.applyMatrix(translationMatrix);
			const rotationMatrix = new THREE.Matrix4();
			rotationMatrix.makeRotationAxis(ax, ang);
			cylinder.applyMatrix(rotationMatrix);
			const translationMatrix2 = new THREE.Matrix4();
			translationMatrix2.set(1, 0, 0, node.p0.x, 0, 1, 0, node.p0.y, 0, 0, 1, node.p0.z, 0, 0, 0, 1);
			cylinder.applyMatrix(translationMatrix2);
			scene.add(cylinder);
		}

		if(rootNode){
			drawCylinder(rootNode, scene, alpha, radialDivisions, leavesCutoff, leavesDensity, applesProbability, matrix);
			for(var i = 0; i < rootNode.childNode.length; i++){
				this.drawTreeRough(rootNode.childNode[i], scene, alpha, radialDivisions, leavesCutoff, leavesDensity, applesProbability, matrix);
			}
		}
	},

	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		//TODO
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