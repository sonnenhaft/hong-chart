window.d3.selection.prototype.hongChart = function () {
    var margin = { top: 25, right: 40, bottom: 20, left: 25 };
    var currentSvgElement = this;

    function translate( x, y ) {return { transform: 'translate(' + x + ',' + y + ')' };}

    var x = d3.scale.linear();
    var y = d3.scale.linear();
    var xAxis = d3.svg.axis().orient('bottom').tickSize(5, 0).tickFormat(function ( d ) {return d;});
    var yAxis = d3.svg.axis().orient('left').tickSize(3, 0);
    var svg = currentSvgElement.select('.main').attr(translate(margin.left, margin.top));

    var scaleFactor = 1;

    function updateWidth() {
        var htmlWidth = currentSvgElement[ 0 ][ 0 ].parentElement.offsetWidth;
        scaleFactor = htmlWidth > 325 ? 1 : 0.15 + 0.85*(htmlWidth / 325);
        var width = htmlWidth - margin.left - margin.right;
        var height = htmlWidth / 2 - margin.top - margin.bottom;
        x.range([ 0, width ]);
        y.range([ height, 0 ]);
        xAxis.scale(x);
        yAxis.scale(y);
        currentSvgElement.attr({
            width: width + margin.left + margin.right,
            height: height + margin.top + margin.bottom
        });
        svg.attr({ 'font-size': 100 * scaleFactor + '%' });
        svg.select('.x.axis').attr(translate(0, height));
        svg.select('.x-axis-label').attr(translate(width, height));
    }

    updateWidth();

    function render( data, opt_offsetArg, opt_noTransition ) {
        opt_offsetArg = opt_offsetArg || 0;
        var r = data.range;
        x.domain([ r.x.min, r.x.max ]);
        y.domain([ r.y.min, r.y.max ]);

        svg.select('.x.axis').call(xAxis).selectAll('line').attr('y1', '-3');
        svg.select('.y.axis').call(yAxis).selectAll('line').attr('x1', '3');

        var xCoord = function ( d, i ) { return x(opt_offsetArg + i); };
        var yCoord = function ( d ) {return y(d || r.y.min);};
        var line = d3.svg.line().x(xCoord).y(yCoord).interpolate('monotone');

        svg.transition().duration(opt_noTransition ? 0 : 500).each(function () {

            svg.select('.lines').bindData('path', data.data, {
                'class': 'line',
                'stroke': function ( chart ) {return chart.color;}
            }).transition().attr({ d: function ( chart ) {return line(chart.years)} });

            svg.select('.lines').bindData('g', data.data, {
                'class': 'dots',
                fill: function ( d ) {return d.color;}
            }).bindData('circle', function ( data ) {
                return data.years
            }).transition().attr({
                cx: xCoord,
                cy: yCoord,
                r: function ( value ) { return value === undefined ? 0 : 3*scaleFactor;}
            });
        });
    }

    return {
        updateWidth: updateWidth,
        render: render
    };
};
