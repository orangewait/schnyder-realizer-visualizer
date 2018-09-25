var r1, r2, r3;

function intersection(a,b)
{
	var result = [];

	for(var i=0; i<a.length; i++)
	{
		var elem = a[i];

		if(b.includes(elem))
		{
			result.push(elem);
		}
	}

	return result;
}



function are_edges_equal(a,b)
{
	if(a.from !== b.from)
		return false;

	if(a.to !== b.to)
		return false;

	if(a.tree !== b.tree)
		return false;

	return true;
}



function parse_embedding(input_string)
{
	console.log("input_string : " + input_string);
	input_string = "{\"embedding\" : [" + input_string + "]}";
	console.log("modified input_string : " + input_string);

	var embedding = JSON.parse(input_string).embedding;

	// set r1, r2, r3 nodes indexes
	r1 = 0;
	r2 = 1;
	r3 = embedding.length-1;

	return embedding;
}



function get_deletable_node(embedding, deleted_nodes)
{
	var deletable_node = null;
	var ignorable_nodes = [r1,r2,r3].concat(deleted_nodes);

	var r3_neighbors = embedding[r3];
	console.log("r3 neighbors : [" + r3_neighbors + "]");

	// for all internal nodes having an edge in common with r3 ...
	for(var i=0; i<r3_neighbors.length; i++)
	{
		var node = r3_neighbors[i];

		// ... excluding r1,r2,r3 and all deleted nodes
		if(ignorable_nodes.includes(node))
		{
			console.log("Ignoring " + node);
			continue;
		}

		var node_neighbors = embedding[node];
		var common_neighbors = intersection(r3_neighbors, node_neighbors);

		// If r3 and node have exactly 2 common neighbors then
		// node is a deletable node
		if (common_neighbors.length === 2)
		{
			console.log(node + " and " + r3 + " have exactly 2 common neighbors");
			console.log(common_neighbors);

			deletable_node = node;
			break;
		}
		else
		{
			console.log
			(
				node + " and " + r3 + " have " + common_neighbors.length +
				" common neighbors => Ignored"
			);
		}
	}

	return deletable_node;
}



// Deletes the node 'node'.
// Neighbors of 'node', if they are not yet,
// get connectet to r3
function contract_edge_between_r3_and_node(node, embedding)
{
	var node_neighbors = embedding[node];

	console.log("node : " + node);
	console.log("number of node neighbors : #" + node_neighbors.length + "\n");

	// Delete 'node' from the adjacency list of all its neighbors
	for(var i=0; i<node_neighbors.length; i++)
	{
		var node_neighbor = node_neighbors[i];
		var adjacency_list = embedding[node_neighbor];
		var node_index = adjacency_list.indexOf(node);

		console.log("node neighbor : " + node_neighbor);
		console.log("adjacency list : " + node_neighbor + " : [" + adjacency_list + "]")
		console.log("node index in adjacency list : " + node_index);

		if(node_neighbor === r3 || adjacency_list.includes(r3))
		{
			console.log
			(
				"Since " + node_neighbor + " is connected to " + r3 + " or it is " + r3 +
				", remove the edge connecting it to " + node
			);
			//remove node from adjacency_list
			adjacency_list.splice(node_index,1);
		}
		else // se non è già connesso ad r3 e non è r3
		{
			console.log
			(
				"Since " + node_neighbor + " is not connected to " + r3 +
				", replace the edge connecting it to " + node +
				" with an edge connecting it to " + r3
			);
			//replace 'node' with r3
			adjacency_list[node_index] = r3;
			// add this node to r3 adjacency list
			embedding[r3].push(node_neighbor);
		}

		console.log(adjacency_list);
		console.log();
	}
}



// conctract edges and returns the stack of deleted nodes
function contract_edges(embedding)
{
	var deleted_nodes_stack = [];

	// for all internal nodes
	for(var i=0; i<embedding.length-3; i++)
	{
		console.log("deleted_nodes_stack : [" + deleted_nodes_stack + "]");

		var node = get_deletable_node(embedding, deleted_nodes_stack);
		contract_edge_between_r3_and_node(node, embedding);
		deleted_nodes_stack.push(node);

		console.log("/////////////// NODE " + node + " DELETED /////////////");
		console.log("R3 NEIGHBORS : ");
		console.log(embedding[r3]);
		console.log();
	}

	return deleted_nodes_stack;
}




// Insert into 'edges' the node outgoing edges and
// remove the incident nodes from the adjacency list
function set_node_outgoing_edges(node, adjacency_list, edges)
{
	/*
		A Schnyder realizer node has always 3 outgoing edges.
		Every outgoing edge is oriented torwards a different
		external node.

		The r3-oriented edge, during the node decontraction, is
		the edge from 'node' to r3

		The r1-oriented edge is the first edge counterclockwise
		of the r3-oriented edge.

		The r2-oriented edge is the first edge clockwise of the
		r3-oriented edge.
	*/

	console.log("Set node outgoing edges");

	var r3_oriented_end = adjacency_list.indexOf(r3);

	// Index of the node the r1-oriented edge ends at
	var r1_oriented_end = r3_oriented_end == 0 ?
		adjacency_list.length - 1 : r3_oriented_end - 1;

	// Index of the node the r2-oriented edge ends at
	var r2_oriented_end = r3_oriented_end == adjacency_list.length - 1 ?
		0 : r3_oriented_end + 1;

	edges.push({from : node, to : r3, tree : r3});
	edges.push({from : node, to : adjacency_list[r1_oriented_end], tree : r1});
	edges.push({from: node, to : adjacency_list[r2_oriented_end], tree : r2});

	// Remove (r1,r2,r3)-oriented end nodes from the adjacency list

	var first = adjacency_list[0];

	if(first === r2) // [ r2 | ... | r1 | r3 ]
	{
		adjacency_list.splice(adjacency_list.length - 2, 2);
		adjacency_list.splice(0, 1);
	}
	else if (first === r3) // [ r3 | r2 | ... | r1 ]
	{
		adjacency_list.splice(adjacency_list.length - 1, 1);
		adjacency_list.splice(0, 2);
	}
	else // [ ... | r1 | r3 | r2 | ... ]
	{
		adjacency_list.splice(r1_oriented_end, 3);
	}
}



// Set all connected edges as ingoing r3-oriented edges
function set_node_ingoing_edges(node, node_neighbors, edges)
{
	console.log("Set node ingoing edges");

	for(var i=0; i<node_neighbors.length; i++)
	{
		console.log
		(
			"Add an edge, " + node_neighbors[i] +
			" -> " + node +
			" r3-oriented"
		);

		edges.push({from : node_neighbors[i], to : node, tree : r3});
	}
}



// Remove edges between nodes and r3 (added during the compression phase)
// which didn't exist in the graph
function remove_invalid_r3_incident_edges(node_neighbors, edges)
{
	console.log
	(
		"Number of invalid r3-incident edges to remove : #" +
		node_neighbors.length
	);

	for(var i=0; i<node_neighbors.length; i++)
	{
		var node = node_neighbors[i];

		var r3_edge_index =
			edges.findIndex
			(
				function(q)
				{
					return are_edges_equal
					(
						q, {from : node, to : r3, tree : r3}
					);
				}
			);

		console.log("Remove invalid edge between " + node + " and r3");

		edges.splice(r3_edge_index, 1);
	}

	console.log();
}



function schnyder_realizer(embedding)
{
	var embedding_clone = JSON.parse(JSON.stringify(embedding));

	console.log("///////////// COMPRESSION ///////////////");

	var deleted_nodes_stack = contract_edges(embedding_clone);

	console.log("///////////// DECOMPRESSION ///////////////\n\n");

	var edges = [];

	while(deleted_nodes_stack.length > 0)
	{
		var node = deleted_nodes_stack.pop();
		var node_neighbors = embedding_clone[node];

		console.log("Decompressing node : " + node);
		console.log("node_neighbors : [" + node_neighbors+ "]");

		set_node_outgoing_edges(node, node_neighbors, edges);
		remove_invalid_r3_incident_edges(node_neighbors, edges);
		set_node_ingoing_edges(node, node_neighbors, edges);
	}

	return edges;
}



// Returns the schnyder realizer edges and the external edges
function graph_schnyder_realized(embedding)
{
	var edges = schnyder_realizer(embedding);

	edges.push({from : r1, to : r2, tree : -1});
	edges.push({from : r2, to : r3, tree : -1});
	edges.push({from : r3, to : r1, tree : -1});

	return edges;
}
