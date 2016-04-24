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
        scaleFactor = htmlWidth > 325 ? 1 : 0.15 + 0.85 * (htmlWidth / 325);
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
    return {
        updateWidth: updateWidth,
        tooltipFn: function () {},
        setTooltipFn: function ( fn ) {
            this.tooltipFn = fn;
        },
        render: function ( data, opt_offsetArg, opt_noTransition ) {
            var tooltipFn = this.tooltipFn;
            opt_offsetArg = opt_offsetArg || 0;
            var filteredData = data.filter(function ( d, i ) {return d.$selected;});
            var yRange = window.DataUtilites.getYRange(filteredData);
            var bauChart = data[ 0 ];
            x.domain([ 0 + opt_offsetArg, bauChart.years.length - 1 + opt_offsetArg ]);
            y.domain([ yRange.min / 1.01, yRange.max * 1.01 ]);

            svg.select('.x.axis').call(xAxis).selectAll('line').attr('y1', '-3');
            svg.select('.y.axis').call(yAxis).selectAll('line').attr('x1', '3');

            var xCoord = function ( d ) {return x(opt_offsetArg + d.x);};
            var yCoord = function ( d ) {return y(d.y);};
            var line = d3.svg.line().x(xCoord).y(yCoord).interpolate('monotone');

            function cover( years ) {
                var definedIndex = years.lastIndexOf(undefined);
                return years.map(function ( y, x ) {
                    if ( y === undefined ) {
                        return { x: definedIndex, y: bauChart.years[ definedIndex ] };
                    } else {
                        return { x: x, y: y };
                    }
                })
            }

            function key( k ) {return function ( d ) {return d[ k ];}; }

            var tooltip = d3.select('.tooltip');
            svg.transition().duration(opt_noTransition ? 0 : 500).each(function () {
                svg.select('.chart-lines').bindData('path', filteredData, null, 'id').attr({
                    stroke: key('color')
                }).transition().attr({ d: function ( chart ) {return line(cover(chart.years));} });

                svg.select('.chart-lines').bindData('g', filteredData, null, 'id').attr({
                    fill: key('color')
                }).bindData('circle', function ( data ) {
                    return cover(data.years);
                }).on({
                    mouseenter: function () {
                        d3.select(this).transition().duration(250).attr({ r: 3 * scaleFactor * 2 });
                    },
                    mouseover: function ( d, yearIndex, chartIndex ) {
                        tooltipFn(yearIndex, chartIndex, true);
                        tooltip.transition().duration(250).style({
                            opacity: 0.9,
                            left: (d3.event.pageX + 10) + 'px',
                            top: (d3.event.pageY - 28) + 'px'
                        });
                    },
                    mouseout: function ( d, yearIndex, chartIndex ) {
                        tooltipFn(yearIndex, chartIndex, false);
                        d3.select(this).transition().duration(700).attr({ r: 3 * scaleFactor });
                        tooltip.transition().duration(1500).style('opacity', 0);
                    }
                }).transition().attr({ cx: xCoord, cy: yCoord, r: 3 * scaleFactor });
            });
        }
    };
};
