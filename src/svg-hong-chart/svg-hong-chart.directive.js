angular.module('hc.svg-hong-chart', [
    'hc.data-utilites',
    'hc.d3.bind-data'
]).directive('svgHongChart', function ( DataUtilites, $window, d3 ) {
    var margin = { top: 15, right: 20, bottom: 33, left: 50 };

    function translate( x, y ) {return { transform: 'translate(' + x + ',' + y + ')' };}

    return {
        restrict: 'A',
        templateUrl: 'src/svg-hong-chart/svg-hong-chart.html',
        scope: { data: '=svgHongChart', tooltip: '=', tooltipYear: '=' },
        link: function ( $scope, $element ) {
            var x = d3.scale.linear();
            var y = d3.scale.linear();
            var xAxis = d3.svg.axis().orient('bottom').tickSize(4, 0);
            var yAxis = d3.svg.axis().orient('left').tickSize(4, 0);

            var currentSvgElement = d3.select($element[ 0 ]).select('svg');
            var svg = currentSvgElement.select('.main');

            var scaleFactor;

            $scope.tooltipFn = function ( yearIndex, chartIndex, toShow ) {
                $scope.tooltipYear = yearIndex;
                var indexes = [ chartIndex ];
                if ( chartIndex === 0 || chartIndex === $scope.data.length - 1 ) {
                    indexes = [ 0, $scope.data.length - 1 ];
                }
                indexes.forEach(function ( chartIndex ) {
                    $scope.data[ chartIndex ].$highlight = toShow;
                });

                $scope.$apply();
            };

            function updateWidth() {
                var htmlWidth = currentSvgElement[ 0 ][ 0 ].parentNode.offsetWidth;
                scaleFactor = htmlWidth > 400 ? 1 : (htmlWidth / 400);
                svg.attr(translate(margin.left, margin.top));
                var width = htmlWidth - margin.left - margin.right;
                var height = htmlWidth / 2 - margin.top - margin.bottom;
                x.range([ 0, width ]);
                y.range([ height, 0 ]);
                xAxis.scale(x);
                yAxis.scale(y);
                svg.select('.x-line').attr('y1', height);
                svg.select('.y-line').attr('x1', width);
                svg.select('.y-line').attr('x1', width);
                currentSvgElement.attr({
                    width: width + margin.left + margin.right,
                    height: height + margin.top + margin.bottom
                });
                svg.attr({ 'font-size': 130 * scaleFactor + '%' });
                svg.selectAll('.x.axis, .logo').attr(translate(0, height));
                svg.select('.x-axis-label').attr(translate(width / 2, height));
                svg.select('.y-axis-label').attr(translate(0, height / 2));
            }

            function render( data, opt_offsetArg, opt_noTransition ) {
                if (data.length < 3)  {return;}
                var tooltipFn = $scope.tooltipFn;
                opt_offsetArg = opt_offsetArg || 0;
                var filteredData = data.filter(function ( d, index ) {
                    return index === 0 || index === data.length - 1 || d.$selected;
                });
                var yRange = DataUtilites.getYRange(filteredData);
                var firstChart = data[ 0 ];
                x.domain([ 0, firstChart.years.length - 1 ]);
                /** uncomment if will decided to start axis from min value instead of ziro */
                    // y.domain([ yRange.min  / 1.01, yRange.max * 1.01 ]);
                y.domain([ 0 / 1.01, yRange.max * 1.01 ]);

                svg.select('.x.axis').call(xAxis.tickFormat(function ( d ) {return opt_offsetArg + d;}));
                svg.select('.y.axis').call(yAxis);

                var xCoord = function ( d, i ) {return x(d.x);};
                var yCoord = function ( d ) {return y(d.y);};
                var line = d3.svg.line().x(xCoord).y(yCoord).interpolate('monotone');

                function cover( years ) {
                    var definedIndex = years.lastIndexOf(undefined);
                    return years.map(function ( y, x ) {
                        if ( y === undefined ) {
                            return { x: definedIndex, y: firstChart.years[ definedIndex ] };
                        } else {
                            return { x: x, y: y };
                        }
                    })
                }

                function key( k ) {return function ( d ) {return d[ k ];}; }

                var tooltip = $scope.tooltip;
                svg.transition().duration(opt_noTransition ? 0 : 500).each(function () {
                    svg.select('.chart-lines').bindData('path', filteredData, {
                        stroke: key('color'),
                        'stroke-dasharray': function ( d, i ) {
                            return d.style === 'dashed' ? '10,3' : 0;
                        },
                        'stroke-width': key('width')
                    }, 'id').transition().attr({ d: function ( chart ) {return line(cover(chart.years));} });

                    svg.select('.chart-lines').bindData('g', filteredData, {
                        fill: key('color'),
                        'stroke-width': 1
                    }, 'id').bindData('circle', function ( data ) {
                        return cover(data.years);
                    }).attr({ r: scaleFactor * 4 }).transition().attr({ cx: xCoord, cy: yCoord });

                    svg.select('.chart-lines-hover').bindData('g', filteredData, null, 'id').bindData('circle', function ( data ) {
                        return cover(data.years);
                    }).on({
                        mouseenter: function ( d, yearIndex, currentChartIndex ) {
                            tooltipFn(yearIndex, currentChartIndex, true);
                            var circles = svg.selectAll('.chart-lines g circle:nth-child(' + (yearIndex + 1) + ')').attr({ r: scaleFactor * 6 });
                            var circle = d3.select(circles[ 0 ][ currentChartIndex ]).classed({ big: true });
                            var x = circle.attr('cx');
                            var y = circle.attr('cy');
                            var targetLines = svg.select('.target-lines').attr({ opacity: 0.2 });
                            targetLines.select('.x-line').attr({ x1: x, x2: x });
                            targetLines.select('.y-line').attr({ y1: y, y2: y });

                            tooltip.style({
                                opacity: 0.9,
                                left: (d3.event.pageX + 10) + 'px',
                                top: (d3.event.pageY - 28) + 'px'
                            });
                        },
                        mouseleave: function ( d, yearIndex, chartIndex ) {
                            tooltipFn(yearIndex, chartIndex, false);
                            svg.selectAll('.chart-lines g')[ 0 ].forEach(function ( d ) {
                                d3.select(d3.select(d).selectAll('circle')[ 0 ][ yearIndex ]).attr({ r: scaleFactor * 4 }).classed({
                                    big: false
                                });
                            });
                            svg.select('.target-lines').attr({ opacity: 0 });
                            tooltip.style('opacity', 0);
                        }
                    }).attr({ cx: xCoord, cy: yCoord, r: scaleFactor * 12 });

                    var lastChart = filteredData[ filteredData.length - 1 ];
                    svg.select('.bau-reduce-area').attr({ visibility: 'visible' }).transition().attr({
                        d: d3.svg.area().y0(y).x(function ( d, i ) {
                            return x(i);
                        }).y1(function ( d, i ) {
                            return y(lastChart.years[ i ]);
                        })(firstChart.years)
                    });
                });
            }

            updateWidth();

            $scope.$watchGroup([ 'data', 'data[data.length - 1].version' ], function () {
                render($scope.data || [], 2016);
            });

            function updateWindow() {
                updateWidth();
                render($scope.data || [], 2016, true);
            }

            angular.element($window).on('resize', updateWindow);
            $scope.$on('$destroy', function () {
                angular.element($window).unbind('resize', updateWindow);
            });

        }
    }
});