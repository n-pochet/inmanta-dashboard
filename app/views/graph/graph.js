'use strict';



var resv = angular.module('InmantaApp.graphView', ['ui.router', 'inmantaApi','dialogs.main','InmantaApp.resourceDetail'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('graph', {
            url: "/environment/:env/version/:version/graph",
            views: {
                "body": {
                    templateUrl: "views/graph/graph.html",
                    controller: "graphController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);



resv.controller('graphController', ['$scope', 'inmantaService', "$stateParams","dialogs",
            function($scope, inmantaService, $stateParams,dialogs) {
		
$scope.dryrun = function() {
             inmantaService.dryrun($stateParams.env,$stateParams.version).then(function(d){$rootScope.$broadcast('refresh')});
            
        }

var types = {
    "std::File": "\ue022",
    "std::Package": "\ue139",
    "std::Directory": "\ue118",
    "std::Service": "\ue137",
    "exec::Run": "\ue162",
    "vm::Host": "\ue017"
}

var colors = {
    "deployed": "#5cb85c",
    "ERROR": "#d9534f",
    "WAITING": "#5bc0de"
}

function getIconCode(type) {
    var out = types[type]
    if (out)
        return out;
    return "?";
}

function getColorCode(type) {
    var out = colors[type]
    if (out)
        return out;
    return "#337ab7";
}
        

        $scope.resources = null
    inmantaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });


                $scope.state = $stateParams
                var diagonal = d3.svg.diagonal()
                var width = 2000,
                    height = 2000,
                    node,
                    link,
                    root;

                var maxFreedom = 400;
                var levelspacing = 300;
                var linkDistance = 280;
		var cutoff = 0.08

                var force = d3.layout.force()
                    .on("tick", tick)
                    .charge(function(d) {
                        return -600;
                    })
                    .linkDistance(function(d) {
                        var bd = Math.abs(linkDistance * (d.target.depth - d.source.depth))
                        return bd;
                    })
                    .size([width, height]);

		var zoom = d3.behavior.zoom().size([width,height]).on("zoom", zoom)

                var vis = d3.select("#chart").append("svg")
                    .attr("width", "100%")
                    .attr("height", "2000px")
		    .append("g")
			    
		 zoom(d3.select("#chart"))
                 
               function zoom() {
		  vis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + 			")");
	        }
        zoom.translate([0,-(height-window.innerHeight)*0.5])
        zoom.event(d3.select("#chart"))

                inmantaService.getResources($stateParams.env, $stateParams.version).then(function(json) {
                    var idcounter = 0;
                    var idx = {}
                    var midx = {}

                    var nodes = [];
                    var links = [];

                    //make nodes and node index
                    json.resources.forEach(function(n) {
                        var node = {
                            name: n.id,
                            req: n.attributes.requires,
                            parents: [],
                            children: [],
                            id: idcounter++,
                            sname: n.id_attribute_value.substring(0, 25),
                            icon: getIconCode(n.entity_type),
                            agent: n.agent_name,
                            source: n,
                            color: getColorCode(n.status)
                        }
                        nodes.push(node)
                        idx[n.id] = node
                        if (n.entity_type == "vm::Host") {
                            midx[n.id_attribute_value] = node
                        }
                    });

                    // make links and cross link nodes
                    nodes.forEach(function(n) {
                        n.req.forEach(function(id) {
                            n.parents.push(idx[id])
                            idx[id].children.push(n);
                            links.push({
                                target: n,
                                source: idx[id],
                                id: idcounter++
                            })
                        });
                        var h = midx[n.agent];
                        if (h) {
                            n.parents.push(h)
                            h.children.push(n);
                            links.push({
                                target: n,
                                source: h,
                                id: idcounter++,
                                toHost: true
                            })
                        }
                    });
                    update(nodes, links);
                });

                function update(nodes, links) {
                    flatten(nodes, links);


                    // make sure we set .px/.py as well as node.fixed will use those .px/.py to 'stick' the node to:
                    if (!root.px) {
                        // root have not be set / dragged / moved: set initial root position
                        root.px = root.x = width / 2;
                        root.py = root.y = circle_radius(root) + 2;
                    }

                    // Restart the force layout.
                    force
                        .nodes(nodes)
                        .links(links)
                        .start();

                    //nodes = cluster.nodes(root);

                    // Update the links…
                    link = vis.selectAll("line.link")
                        .data(links.filter(function(l) {
                            return !l.toHost || l.target.depth < 3;
                        }), function(d) {
                            return d.id;
                        });

                    // Enter any new links.
                    link.enter().append("path")
                        .attr("class", "link")
                        .attr("d", diagonal);
                    // Exit any old links.
                    link.exit().remove();

                    // Update the nodes…
                    node = vis.selectAll("g.node").data(nodes, function(d) {
                        return d.id;
                    })

                    var neg = node.enter().append("g")
                        .attr("class", "node")
                        .attr("transform", function(d) {
                            return "translate(" + d.y + "," + d.x + ")";
                        })
                    neg.on("click", click)
                        .call(force.drag);
                    neg.on("mousedown", function(d) { //drag has priority on zoom
                                                       d3.event.stopPropagation();});

                    neg.append("text")
                        .attr("dx", function(d) {
                            return d.children ? -8 : 8;
                        })
                        .attr("dy", 3)
                        .style("text-anchor", function(d) {
                            return d.children ? "end" : "start";
                        })
                        .text(function(d) {
                            return d.sname;
                        });

                    neg.append('text')
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'central')
                        .attr('font-family', 'Glyphicons Halflings')
                        .attr('font-size', function(d) {
                            return '1em'
                        })
                        .attr('fill', function(d) {
                            return d.color
                        })
                        .text(function(d) {
                            return d.icon;
                        });

                    node.transition()
                        .attr("transform", function(d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        })



                    // Exit any old nodes.
                    node.exit().remove();
                }

                function tick(e) {

                    var alpha = e.alpha;

                    // max distance away from line
                    // alpha always > 0.005 
                    // compensate to get lines
                    var freedom = Math.max((e.alpha - cutoff) * maxFreedom, 0);
		    //console.log(e.alpha,freedom)
                    force.nodes().forEach(function(d) {

                        if (!d.fixed) {
                            var r = circle_radius(d) + 4,
                                dl;

                            // #1.0: hierarchy: same level nodes have to remain with a 1 LY band vertically:
                            if (d.children) {
                                //itended X position
                                var pl =  d.depth * levelspacing + r;

                                //distance away
                                var delta = pl - d.x;

                                //if too far, correct
                                if (Math.abs(delta) > freedom) {
                                    d.x = pl
                                }
                            }
                        }
                    });

                    //redraw
                    link.attr("d", diagonal);
                    node.attr("transform", function(d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    })

                }

                // Color leaf nodes orange, and packages white or blue.
                function color(d) {
                    return d.color;
                }

                function circle_radius(d) {
                    return d.children ? 4.5 : Math.sqrt(d.size) / 10;
                }

                // Toggle children on click.
                function click(d) {
                    if (d3.event.defaultPrevented) return;
                    dialogs.create('views/resourceDetail/resourceDetail.html','resourceDetailCtrl',{resource: d.source,env:$stateParams.env},{})
                }

                // Assign one parent to each node
                // Also assign each node a reasonable starting x/y position: we can do better than random placement since we're force-layout-ing a hierarchy!
                function flatten(nodes, links) {
                    var 
                        max_width=0, max_depth = 1;

                    //get depth of node  (longest chain of parents)
                    function getDepth(node) {
                        if (node.depth) {
                            return node.depth;
                        }
                        var order = Math.max.apply(null, node.parents.map(getDepth));
                        order = Math.max(order, 0) + 1;
                        node.depth = order;
                        return order;
                    }

                    //get weight of node  (recursive total nr of children)
                    function getWeight(node) {
                        if (node.weight) {
                            return node.weight;
                        }
                        var order = node.children.map(getWeight).reduce(function(a, b) {
                            return a + b;
                        }, 0) + 1;
                        node.weight = order;
                        return order;
                    }

                    nodes.forEach(getDepth);
                    nodes.forEach(getWeight);


                    //create root node, above all depth 0 nodes
                    root = {
                        name: "root",
                        parents: [],
                        children: [],
                        depth: 0,
                        parent: null
                    };
                    root.fixed = true;
                    root.px = root.py = 0;

                    nodes.forEach(function(n) {
                        if (n.depth == 1) {
                            root.children.push(n);
                            n.parents.push(root);
                        }
                    });

                    //determine initial placement in grid

                    function recurse(node, x) {
			max_width = Math.max(max_width, x);
                        if (node.children) {
//sort by weight, so the most important nodes are placed first (to the top) in the inital layout
			    node.children.sort(function(a, b) {
                        	return b.weight - a.weight;
                    	    });
                            max_depth = Math.max(max_depth, node.depth + 1);
                            node.size = node.children.reduce(function(p, v, i) {
                                return p + recurse(v, x + p);
                            }, 1);
                        }



                        if (!node.x) {
                            node.x = node.depth;
                            node.y = x + node.size/2;
                        }
                        return node.size;
                    }

                    root.size = recurse(root, 0);

                    // now correct/balance the x positions:
                  
                    
                    var ky = (height - 20) / max_width;

                  

                    var kx = (width - 20) / max_depth;

                   
		    var i
                    for (i = nodes.length; --i >= 0;) {
                        var node = nodes[i];
                        if (!node.px) {
                            node.y *= ky;
                            node.y += 10 + ky / 2;
                            node.x *= kx;
                            node.x += 10 + kx / 2;
                        }
                    }

                    return nodes;
                }
            }])
