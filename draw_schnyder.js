const r1 = 0;
const r2 = 1;
const r3 = 2;



function parse_embedding(input_string)
{
	console.log("input_string : " + input_string);
	input_string = "{\"embedding\" : [" + input_string + "]}";
	console.log("modified input_string : " + input_string);

	return JSON.parse(input_string).embedding;
}



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



function get_deletable_node(embedding, deleted_nodes)
{
	var deletable_node = null;
	var ignorable_nodes = [r1,r2,r3].concat(deleted_nodes);

	var r3_neighbors = embedding[r3];
	console.log("R3 neighbors : " + r3_neighbors);

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

		// se r3 e node hanno esattamente 2 vicini in comune, allora
		// node è un compressable node
		if (common_neighbors.length === 2)
		{
			console.log(node + " and " + r3 + " have exactly 2 common neighbors");
			console.log(common_neighbors);

			deletable_node = node;
			break;
		}
		else // QUESTO ELSE PENSO SI POSSA RIMUOVERE
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

	// delete all the edges incident on node
	// from the adjacency list of connected nodes
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
			//replace node with r3
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

	console.log("///////////// COMPRESSION ///////////////");

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



function draw(embedding)
{
	// PROBABILMENTE SI PUÒ ELIMINARE
	var embedding_clone = JSON.parse(JSON.stringify(embedding));

	for(var i=0; i<embedding.length; i++)
	{
		console.log("node " + i + " : " + embedding[i]);
	}

	// nomi poco intuitivi
	var deleted_nodes_stack = contract_edges(embedding_clone);

	console.log("///////////// DECOMPRESSION ///////////////");
	console.log();

	var edges = [];

	while(deleted_nodes_stack.length > 0)
	{
		var popped_node = deleted_nodes_stack.pop();
		// ogni nodo sa a chi era connesso al momento della propria compressione
		// solo i suoi vicini si dimenticano di lui
		var vicini = embedding_clone[popped_node];
		console.log("popped_node : " + popped_node);
		console.log("vicini : " + vicini);

		// c'è sempre un arco che va dal nodo ad r3
		edges.push({from : popped_node, to : r3, tree : r3});

		var pos_r3 = vicini.indexOf(r3);
		var pos_vers_r1 = pos_r3 == 0 ? vicini.length-1 : pos_r3-1;
		var pos_verso_r2 = pos_r3 == vicini.length-1 ? 0 : pos_r3+1;
		edges.push({from : popped_node, to : vicini[pos_vers_r1], tree : r1});
		edges.push({from: popped_node, to : vicini[pos_verso_r2], tree : r2});

		var value_verso_r1 = vicini[pos_vers_r1];
		var value_verso_r2 = vicini[pos_verso_r2];

		// rimuovo da vicini i 3 archi uscenti ormai "colorati"
		vicini.splice(pos_r3,1);
		vicini.splice(vicini.indexOf(value_verso_r1), 1);
		vicini.splice(vicini.indexOf(value_verso_r2), 1);

		console.log("vicini rimanenti : [" + vicini +"]");

		// tutti i restanti archi incidenti sono entranti e diretti verso r3
		for(var y=0; y<vicini.length; y++)
		{
			console.log
			(
				"Aggiungo un nodo, " + vicini[y] +
				", entrante in " + popped_node +
				", di colore rosso"
			);
			edges.push({from : vicini[y], to : popped_node, tree : r3});

			var pos_da_rimuovere =
				edges.findIndex(
					function(q)
					{
						console.log("cerco_da_rimuovere : " + q);
						var fuq = are_edges_equal(
						{from : vicini[y], to : r3, tree : r3}, q);
						console.log(fuq);
						return fuq;
					});

			console.log(edges[pos_da_rimuovere]);
			console.log("pos da rimuovere : " + pos_da_rimuovere);
			edges.splice(pos_da_rimuovere, 1);
		}
	}

	// aggiungo gli archi esterni
	edges.push({from : 0, to : 1, tree : -1});
	edges.push({from : 1, to : 2, tree : -1});
	edges.push({from : 2, to : 0, tree : -1});

	console.log("edges :");

	for(var z=0; z<edges.length; z++)
	{
		console.log(edges[z]);
	}

	console.log("numero di archi : " + edges.length);
	console.log();

	return edges;
}



function main(id_suffix)
{
	var textarea_id = "txta-" + id_suffix;
	var paragraph_id = "p-" + id_suffix;

	var user_input = document.getElementById(textarea_id).value;
	var embedding = parse_embedding(user_input);
	var edges = draw(embedding);

	var edges_description = "";

	for(var i=0; i<edges.length; i++)
	{
		var edge = edges[i];
		edges_description += edge.from + " ---> " + edge.to +
			(edge.tree === 0 ? ", azzurro" :
			edge.tree === 1 ? ", giallo" :
			edge.tree === 2 ? ", rosso" : ", esterno")
			+ "<br />";
	}

	document.getElementById(paragraph_id).innerHTML = edges_description;
}
