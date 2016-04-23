Promise.all([
    'stubs/abatement-measures.csv',
    'stubs/abatement-measures-v1.csv',
    'stubs/targets-and-baseline.csv'
].map(function ( url ) {
    return new Promise(function ( resolve ) { d3.csv(url, resolve); });
})).then(function ( array ) {
    var mapping = { suffix: 'ReductionYear', key: 'Type' };
    return [ mapping, mapping, { key: 'Year' } ].map(function ( mapping, index ) {
        return DataUtilites.formatData(array[ index ], mapping.suffix, mapping.key);
    });
}).then(function ( data ) {
    var hongChart = d3.select('svg').hongChart();

    hongChart.render(data[ 2 ], 2016);
    //window.setTimeout(function(){
    //    hongChart.render(data[ 1 ], 1);
    //}, 500)
    window.onresize = function updateWindow() {
        hongChart.updateWidth();
        hongChart.render(data[ 2 ], 2016, true);
    };
});
