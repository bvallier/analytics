//***** DEFINE DATAFRAMES AND DIVS ********************************************* 
    var zip_lu;
    var zip_region_lu = {};
    var zip_colors    = {};
    var tooltip_info  = {};
    var tt_div // holder for tooltip
    var region_array = []; // holder for region outlines

//***** LOAD REGION AND TOOLTIP DATA ********************************************* 
    function load_data() {
        var temp_tip = {};
        d3.tsv('/data/zip_lookup.tsv',  function(d) { 
            // load data
            zip_lu  = d;
            // get unique list of regions
            regions = d3.map(zip_lu, function(d){ return d.region_name; }).keys();

            d3.csv('/data/tooltip_info.csv', function(d) {
                // load data
                tooltip_dat = d;
                tooltip_dat.forEach(function(d) { temp_tip[d.region] = {'pct_haz':         d.pct_haz, 
                                                                        'pct_nonhaz':      d.pct_nonhaz, 
                                                                        'pct_all_regions': d.pct_all_regions};});
            });
                    
            // build tooltip 
            zip_lu.forEach(function(d) {
                zip_colors[d.location_zip] = d.fill_color;
                zip_region_lu[d.location_zip] = d.region_name;
                // superflous now, but if redefined to the zip level we need to set defaults if no information                   
                if ( temp_tip[d.sales_region] === undefined ) {
                    tooltip_info[d.location_zip] = {'pct_haz': 'NaN', 'pct_nonhaz': 'NaN', 'pct_all_regions': 'NaN'};
                } else {
                    tooltip_info[d.location_zip] = temp_tip[d.sales_region];
                } 
                });
            });
    };  

//***** GENERATE MAP *********************************************
    function basemap() {   
        // load zip lookup and build color lookups
        load_data();

        var div   = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);
        var svg   = d3.select('body').append('svg').attr('width', '100%').attr('height', '500')
        var path  = d3.geo.path();
        var g     = svg.append('g').attr('id', 'map');
        var reg_g = svg.append('g').attr('id', 'reg_g');
        
        
        // read in boundaries and set SVG strokes 
        d3.json('/data/zips_us_topo.json', function(error, us) {
            // json from: https://gist.github.com/jefffriesen/6892860#file-zips_us_topo-json
            g.attr('class', 'counties')
                .selectAll('path')
                .data(topojson.feature(us, us.objects.zip_codes_for_the_usa).features)
                    .enter().append('path')
                        .attr('class', 'zip')
                        .attr('data-zip',   function(d) { return d.properties.zip;   })
                        .attr('data-state', function(d) { return d.properties.state; })
                        .attr('data-name',  function(d) { return d.properties.name;  })
                        .attr('d',          path)
                        .style('fill',      function(d) { if ( zip_colors[d.properties.zip] === undefined ) {
                                                                return '#34495e';
                                                          } else {
                                                                return zip_colors[d.properties.zip];
                                                          }})
                        .style('stroke', '#bdc3c7')
                        .style('stroke-width', '.01px')
                        .on('mouseover', function(d) {
                            div.transition().duration(200).style('opacity', .9);		
                            div.html('<b>Zip: '+ d.properties.zip + '<br/>'  + 
                                     'County Name: ' + d.properties.name + '<br/>Region Stats: <br/>' +
                                     '&nbsp&nbsp&nbsp%    Haz: ' + d3.format('.2%')(tooltip_info[d.properties.zip]['pct_haz'])         + '<br/>'  + 
                                     '&nbsp&nbsp&nbsp% Un-Haz: ' + d3.format('.2%')(tooltip_info[d.properties.zip]['pct_nonhaz'])      + '<br/>'  + 
                                     '&nbsp&nbsp&nbsp% Nation: ' + d3.format('.2%')(tooltip_info[d.properties.zip]['pct_all_regions']) + '</b>')
                               .style('top',  (d3.event.pageY+10) + 'px')
                               .style('left', (d3.event.pageX+10) + 'px');	
                            })					
                        .on('mouseout', function(d) {
                            div.transition().duration(500)		
                               .style('opacity', 0);
                        })

                g.append("path")
                  .datum(topojson.mesh(us, us.objects.zip_codes_for_the_usa, function(a, b) { return a !== b; }))
                  .style('fill', 'none').style('stroke-width', '.01').style('stroke', '#fff')
                  .attr("d", path);

                regions.forEach(function(reg) { 
                    region_array.push(us.objects.zip_codes_for_the_usa.geometries.filter(function(d) { return  d3.set([reg]).has(zip_region_lu[d.properties.zip]); }))
                }) //https://stackoverflow.com/questions/24409545/how-can-i-prevent-new-elements-overwriting-existing-elements-in-d3-js 

                regions.forEach(function(reg, i) {
                    reg_g.append("path")
                        .datum(topojson.merge(us, region_array[i]))
                        .attr('class', i)
                        .style('fill', 'None')
                        .style('stroke-width', '1')
                        .style('stroke', '#000')
                        .attr("d", path);
                }) // https://bl.ocks.org/mbostock/5416405 & https://bl.ocks.org/mbostock/9867796
        })
        };