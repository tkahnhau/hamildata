//////////////////////////////////////////////////
// code template for bundle layout based on     //
// https://github.com/d3/d3/wiki/Bundle-Layout  //
//////////////////////////////////////////////////


function generateBundles(reference, callback) {

    // $('h3').html('Song Connections');
    $(reference).empty();
    $('h3').html("");
    $('#chart')
        .removeClass('chart-bar')
        .addClass('chart-bundle');
    $('#info-box')
        .removeClass('info-bar')
        .addClass('info-bundle info-none')
        .html('<h4>Click on a song title to see with which songs it shares lyrics.</h4>');


  //   // VARIABLE INSTANTIATION

    var diameter = 600, // dimensions of svg element
        radius = diameter / 2,
        innerRadius = radius - 160; // relative dimention of chart

    var cluster = d3.layout.cluster()
        .size([360, innerRadius]) // how many degrees, radius
        .sort(null)

    var bundle = d3.layout.bundle(); // bundle layout

    var line = d3.svg.line.radial()
        .interpolate("bundle")
        .tension(.1) // 0 is straight, 1 is super-curved
        .radius(function(d) { return d.y; })
        .angle(function(d) { return d.x / 180 * Math.PI; });

    var svg = d3.select(reference).append("svg")
        .attr("id", "graph")
        .attr("viewBox", "10 1 515 575")
        .attr("preserveAspectRatio", "xMidYMid")
        .append("g")
        .attr("transform", "translate(" + (radius - 40) + "," + (radius + 10) + ")"); // center the graph in the svg element

    var link = svg.append("g").selectAll(".link"),
        node = svg.append("g").selectAll(".node");


    // BEGIN CODE

    // import json;  use data to 
    d3.json("/bundle_data.json", function(error, data) {
      if (error) throw error;

      var nodes = cluster.nodes(packageHierarchy(data.data)),
          links = packageImports(nodes);

      link = link
          .data(bundle(links))
          .enter().append("path")
          .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
          .attr("class", "link")
          .attr("d", line);

      node = node
          .data(nodes.filter(function(n) { return !n.children; }))
          .enter().append("text")
          .attr("class", "node")
          // .attr("data", function(d) {console.log(d); return d})
          .attr("dy", ".31em") // center text on node
          .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")" + 
                                                  "translate(" + (d.y + 8) + ",0)" + 
                                                  (d.x < 180 ? "" : "rotate(180)"); 
                                          })
          .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
          .text(function(d) { return d.key; })
          .on("mouseover", mouseovered)
          .on("mouseout", mouseouted)
          .on("click", clicked);

      callback && callback(); // check if a callback exists, then run it
    });

    function mouseovered(d) {
      if ($('.node--song1').length === 0) {
          node
              .each(function(n) { n.target = n.source = false; }); // deletes previous source/target matching

          link
              .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
              .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
              .filter(function(l) { return l.target === d || l.source === d; })
              .each(function() { this.parentNode.appendChild(this); });

          d3.select(this)
              .classed("node--hover", true);

          node
              .classed("node--target", function(n) { return n.target; })
              .classed("node--source", function(n) { return n.source; });
      }
    }

    function mouseouted(d) {
      // un-highlight all links
      link
          .classed("link--target", false)
          .classed("link--source", false);

      // unhighlight all nodes
      node
          .classed("node--hover", false)
          .classed("node--target", false)
          .classed("node--source", false);
    }

    function clicked(d) {
      // if no nodes are currently selected
      if ($('.node--song1').length === 0) {
        d3.select(this)
          .classed("node--song1", true); // add song1 class (show lyrics)
      }

      // if the node is currently selected (as either song1 or song2)
      else if (d3.select(this)[0][0]
                   .outerHTML
                   .indexOf('node--song') > -1) {
        
        d3.select(this)
          .classed("node--song1", false); // remove song1 class
        d3.select(this)
          .classed("node--song2", false); // remove song2 class

        // un-highlight all links
        link
          .classed("link-song1-target", false)
          .classed("link-song1-source", false);

        link
          .classed("link-song12-target", false)
          .classed("link-song12-source", false)

        // unhighlight all nodes
        node
          .classed("node-song1-target", false)
          .classed("node-song1-source", false);

        // if song 2 exists, re-class it to song 1
        if ($('.node--song2').length === 1) {
          var song2 = d3.select('.node--song2');
          song2.classed("node--song2", false);
          song2.classed("node--song1", true);
        }
      }
      // if there is a song 1 already, but no song 2
      else if ($('.node--song2').length === 0) {
        d3.select(this)
          .classed("node--song2", true); // add song2 class (compare)
      }
      
      // if there is a song1, and is not a song2, show song1's lyrics
      if ($('.node--song2').length === 0 && $('.node--song1').length === 1) {
        
        $('#info-box').removeClass("info-none")

        node
          .each(function(n) { n.target = n.source = false; }); // deletes previous source/target matching?

        // select data attached to the song 1 node
        song1_d = $('.node--song1')[0]['__data__'];

        // highlight the links whose target/source matches the song1 data
        link
          .classed("link-song1-target", function(l) { if (l.target === song1_d) return l.source.source = true; })
          .classed("link-song1-source", function(l) { if (l.source === song1_d) return l.target.target = true; })
          .filter(function(l) { return l.target === song1_d || l.source === song1_d; })
          .each(function() { this.parentNode.appendChild(this); });

        node
          .classed("node-song1-target", function(n) { return n.target; })
          .classed("node-song1-source", function(n) { return n.source; });

        // pull the song title from the node label and create a heading for the info box.
        var title = d3.select('.node--song1')[0][0].innerHTML;
        $('#info-box').html('<h4 class="song-title">' + title + '</h4 >');

        // AJAX request to server to get character:lyric pairs for given title
        $.get('/get_lyrics.json',
              {'title': title},
              function(results){
                  // initialize empty string
                  var songLyrics = '<table id="lyrics">'
                  // add a new row containing the character name and lyrics for each line
                  for (var i = 0; i < results.lyrics.length; i++) {
                    songLyrics = songLyrics.concat('<tr>', 
                                                      '<td class="char">', 
                                                        results.lyrics[i][0], ': ',
                                                      '</td>', 
                                                      '<td class="lyrics">', 
                                                        results.lyrics[i][1], 
                                                      '</td>', 
                                                   '</tr>');
                    };
                  // insert newly created list of rows into table tags
                  $('#info-box').append(songLyrics, '</table>');
                });
      }
      // if two songs are selected, show common lyrics
      else if ($('.node--song1').length === 1 && $('.node--song2').length === 1) {

        $('#info-box').removeClass("info-none")
        
        // select data attached to the song 1 node
        song1_d = $('.node--song1')[0]['__data__'];
        song2_d = $('.node--song2')[0]['__data__'];


        link
          .classed("link-song1-target", false)
          .classed("link-song1-source", false);

        // highlight the links whose target/source matches the song1 data
        link
          .classed("link-song12-target", function(l) { if (l.target === song1_d && l.source === song2_d) return l.source.source = true; })
          .classed("link-song12-source", function(l) { if (l.source === song1_d && l.target === song2_d) return l.target.target = true; })
          .filter(function(l) { return l.target === song1_d || l.source === song1_d; })
          .each(function() { this.parentNode.appendChild(this); });

        // unhighlight all other nodes 9not song 1 or song 2)
        node
          .classed("node-song1-target", false)
          .classed("node-song1-source", false);

        // populate table header with both song titles
        var title1 = d3.select('.node--song1')[0][0].innerHTML;
        var title2 = d3.select('.node--song2')[0][0].innerHTML;
        $('#info-box').html('<div class="container match">'
                              + '<div class="one-song">'
                                + '<h4 class="song-title">'
                                  + title1
                                + '</h4>'
                              + '</div>'
                              + '<div class="one-song">'
                                + '<h4 class="song-title">'
                                  + title2
                                + '</h4>'
                              + '</div>'
                            + '</div>' // all titles
                            );

        $.get('/compare_songs.json', {'title1': title1, 'title2': title2}, function(results){

                                                    // do for every match found between song 1 and song 2
                                                    for (var match in results){
                                                      html = '<div class="container match">'
                                                      
                                                      var song1Lyrics = '<div class="one-song"><table id="lyrics">';
                                                      
                                                      // insert a new line into the song 1 table
                                                      for (var line in results[match].song1){
                                                        song1Lyrics = song1Lyrics.concat('<tr>', 
                                                                                            '<td class="char">', 
                                                                                              results[match].song1[line]['char'], ': ', 
                                                                                            '</td>', 
                                                                                            '<td class="lyrics">', 
                                                                                              results[match].song1[line]['line'], 
                                                                                            '</td>', 
                                                                                          '</tr>'
                                                                                         );
                                                        
                                                      }
                                                      html = html.concat(song1Lyrics, '</table></div>');
                                                      
                                                      // insert 1 line per matching lyric into song 2 table
                                                      var song2Lyrics = '<div class="one-song"><table id="lyrics">';
                                                      
                                                      for (var line in results[match].song2){
                                                        song2Lyrics = song2Lyrics.concat('<tr>', 
                                                                                            '<td class="char">', 
                                                                                              results[match].song2[line]['char'], ': ', 
                                                                                            '</td>', 
                                                                                            '<td class="lyrics">', 
                                                                                              results[match].song2[line]['line'], 
                                                                                            '</td>', 
                                                                                          '</tr>'
                                                                                         );
                                                      }
                                                      html = html.concat(song2Lyrics, '</table></div></div>');
                                                      
                                                      $('#info-box').append(html);
                                                    }

              });
      }
      // if no songs are selected
      else {
        $('#info-box').removeClass("info-double info-single").addClass("info-none");
        $('#info-box').html('<h4>Click on a song title to see with which songs it shares common lyrics.</h4>');
      }

      
    }


    d3.select(self.frameElement).style("height", diameter + "px");

    // Lazily construct the package hierarchy from class names.
    function packageHierarchy(classes) {
      var map = {};

      function find(name, data) {
        var node = map[name], i;
        if (!node) {
          node = map[name] = data || {name: name, children: []};
          if (name.length) {
            node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
            node.parent.children.push(node);
            node.key = name.substring(i + 1);
          }
        }
        return node;
      }

      classes.forEach(function(d) {
        find(d.name, d);
      });

      return map[""];
    }

    // Return a list of imports for the given array of nodes.
    function packageImports(nodes) {
      var map = {},
          imports = [];

      // Compute a map from name to node.
      nodes.forEach(function(d) {
        map[d.name] = d;
      });

      // For each import, construct a link from the source to target node.
      nodes.forEach(function(d) {
        if (d.imports) d.imports.forEach(function(i) {
          imports.push({source: map[d.name], target: map[i]});
        });
      });

      return imports;
    }

}

