const r1 = 0;
const r2 = 1;
const r3 = 2;



function parse_embedding(textarea_id)
{
	var input_string =
		document.getElementById(textarea_id).value;
	console.log("input_string : " + input_string);
	input_string = "{\"embedding\" : [" + input_string + "]}";
	console.log("input_string : " + input_string);

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



Array.prototype.indexOfNode =
	function(x)
	{
		for(i=0; i<this.length; i++)
		{
			if(this[i] === x)
				return i;
		}

		return null;
	};



function are_arrows_equal(a,b)
{
	if(a.from !== b.from)
		return false;

	if(a.to !== b.to)
		return false;

	if(a.tree !== b.tree)
		return false;

	return true;
}



function draw(textarea_id)
{
	var embedding = parse_embedding(textarea_id);
	var embedding_clone = JSON.parse(JSON.stringify(embedding));

	// print embedding
	for(var i=0; i<embedding.length; i++)
	{
		console.log("node " + i + " : " + embedding[i]);
	}

	var selected_node = null;
	var stack_nodi_compressi = [];

	// for all'internal nodes
	for(var i=0; i<embedding_clone.length-3; i++)
	{
		var r3_adjacent_nodes = embedding_clone[r3];
		console.log("Nodi connessi ad r3 : " + r3_adjacent_nodes);

		// for all'internal nodes having an edge in common with r3
		for(var j=0; j<r3_adjacent_nodes.length; j++)
		{
			var node = r3_adjacent_nodes[j];

			if(node === r1 || node === r2 || node === r3 || stack_nodi_compressi.includes(node))
			{
				console.log("Ignoro " + node);
				continue;
			}

			// QUESTA RIGA PROBABILMENTE SI PUÒ SPOSTARE FUORI DA QUESTO FOR
			var nodes_adjacent_selected_node = embedding_clone[node];
			var common_neighbors =
				intersection(r3_adjacent_nodes, nodes_adjacent_selected_node);

			// se r2 e node hanno esattamente 2 vicini in comune, allora
			// node diventa il selected node per la compressione
			if (common_neighbors.length === 2)
			{
				console.log(node + " e " + r3 +
					" hanno esattamente 2 vicini in comune");
				console.log(common_neighbors);

				selected_node = node;
				stack_nodi_compressi.push(node);
				break;
			}
			else
			{
				console.log(node + " e " + r3 + " hanno addirittura " + common_neighbors.length + " vicini \n Dropped");
			}
		}

		// trovato il selected_node, passo alla compressione
		console.log("selected_node : " + selected_node);
		console.log("stack_nodi_compressi : [" + stack_nodi_compressi + "]");
		console.log("numero nodi adiacenti al selezionato : #" + nodes_adjacent_selected_node.length);
		console.log();

		// cancello tutti gli archi incidenti sul selected_node dalle varie
		// liste di adiacenza
		for(var k=0; k<nodes_adjacent_selected_node.length; k++)
		{
			var node_adjacent_selected_node = nodes_adjacent_selected_node[k];
			console.log("nodo adiacente a quello selezionato : " + node_adjacent_selected_node);

			var lista_di_adiacenza = embedding_clone[node_adjacent_selected_node];
			console.log("lista di adiacenza del nodo " + node_adjacent_selected_node + " : [" + lista_di_adiacenza + "]")

			// indice del selected_node nella lista di adiacenza del node_adjacent_selected_node
			var pos = lista_di_adiacenza.indexOfNode(selected_node);
			console.log("pos : " + pos);

			// se non è già connesso ad r3 e non è r3
			if(node_adjacent_selected_node !== r3 && !lista_di_adiacenza.includes(r3))
			{
				console.log("Non essendo connesso a " + r3 + ", sostituisco l'arco verso " + selected_node + " con un arco verso " + r3);
				//replace selected_node with r3
				lista_di_adiacenza[pos] = r3;

				// PROBABILMENTE SI PUÒ USARE r3_adjacent_nodes
				// add this node to r3 adjacency list
				embedding_clone[r3].push(node_adjacent_selected_node);
				//console.log("ECR3 : ")
				//console.log(ECR3);
				//var pos_to_replace = ECR3.indexOfNode(selected_node);
				//console.log("pos to replace : " + pos_to_replace);
				//ECR3[pos_to_replace] = node_adjacent_selected_node;
				//console.log("ECR3[" + pos_to_replace +"] = " + node_adjacent_selected_node);
			}
			else
			{
				console.log("Essendo già connesso a " + r3 + " oppure proprio " + r3 +", mi limito a rimuovere l'arco verso " + selected_node);
				//remove the selected node from this one adjacency list
				lista_di_adiacenza.splice(pos,1);
			}

			console.log(lista_di_adiacenza);
			console.log();
		}

		console.log("/////////////// NODO " + selected_node + " ELIMINATO /////////////");
		console.log("CONNESSI AD R3");
		console.log(embedding_clone[r3]);
		console.log();
	}

	console.log("///////////// DECOMPRESSIONE ///////////////");
	console.log();

	var arrows = [];

	while(stack_nodi_compressi.length > 0)
	{
		var popped_node = stack_nodi_compressi.pop();
		var vicini = embedding_clone[popped_node];
		console.log("popped_node : " + popped_node);
		console.log("vicini : " + vicini);
		// c'è sempre un arco che va dal nodo ad r3
		arrows.push({from : popped_node, to : r3, tree : r3});
		var pos_r3 = vicini.indexOfNode(r3);
		var pos_vers_r1 = pos_r3 == 0 ? vicini.length-1 : pos_r3-1;
		var pos_verso_r2 = pos_r3 == vicini.length-1 ? 0 : pos_r3+1;
		arrows.push({from : popped_node, to : vicini[pos_vers_r1], tree : r1});
		arrows.push({from: popped_node, to : vicini[pos_verso_r2], tree : r2});

		var value_verso_r1 = vicini[pos_vers_r1];
		var value_verso_r2 = vicini[pos_verso_r2];

		// rimuovo da vicini i 3 archi uscenti ormai "colorati"
		vicini.splice(pos_r3,1);
		vicini.splice(vicini.indexOfNode(value_verso_r1), 1);
		vicini.splice(vicini.indexOfNode(value_verso_r2), 1);

		console.log("vicini rimanenti : [" + vicini +"]");

		// tutti i restanti archi incidenti sono entranti e diretti verso r3
		for(var y=0; y<vicini.length; y++)
		{
			console.log("Aggiungo un nodo, " + vicini[y] + ", entrante in " + popped_node + ", di colore rosso");
			arrows.push({from : vicini[y], to : popped_node, tree : r3});

			var pos_da_rimuovere =
				arrows.findIndex(
					function(q)
					{
						console.log("cerco_da_rimuovere : " + q);
						var fuq = are_arrows_equal(
						{from : vicini[y], to : r3, tree : r3}, q);
						console.log(fuq);
						return fuq;
					});

			console.log(arrows[pos_da_rimuovere]);
			console.log("pos da rimuovere : " + pos_da_rimuovere);
			arrows.splice(pos_da_rimuovere, 1);
		}
	}

	// aggiungo gli archi esterni
	arrows.push({from : 0, to : 1, tree : -1});
	arrows.push({from : 1, to : 2, tree : -1});
	arrows.push({from : 2, to : 0, tree : -1});

	console.log("arrows :");

	for(var z=0; z<arrows.length; z++)
	{
		console.log(arrows[z]);
	}

	console.log("numero di archi : " + arrows.length);
	console.log();

	return arrows;
}


function main(id_suffix)
{
	var textarea_id = "txta-" + id_suffix;
	var paragraph_id = "p-" + id_suffix;

	var arrows = draw(textarea_id);
	var arrows_description = "";

	for(var i=0; i<arrows.length; i++)
	{
		var arrow = arrows[i];
		arrows_description += arrow.from + " ---> " + arrow.to +
			(arrow.tree === 0 ? ", azzurro" :
			arrow.tree === 1 ? ", giallo" :
			arrow.tree === 2 ? ", rosso" : ", esterno")
			+ "<br />";
	}

	document.getElementById(paragraph_id).innerHTML = arrows_description;
}
