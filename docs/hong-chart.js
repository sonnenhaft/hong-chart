angular.module('hc.d3.bind-data', []).factory('d3', ["$window", function ( $window ) {
    return $window.d3;
}]).run(["d3", function ( d3 ) {
    d3.selection.prototype.bindData = function ( tag, data, opt_attrs, opt_idKey ) {
        var enteredSelection;
        if ( opt_idKey ) {
            enteredSelection = this.selectAll(tag).data(data, function ( d ) {return d[opt_idKey];});
        } else {
            enteredSelection = this.selectAll(tag).data(data);
        }
        enteredSelection.enter().append(tag).attr(opt_attrs);
        enteredSelection.exit().remove();
        return enteredSelection;
    };
}]);

angular.module('hc.data-utilites', []).value('DataUtilites', {
    _getRange: function ( minMax, value ) {
        if ( value === undefined ) {
            return minMax;
        } else {
            return {
                min: Math.min(minMax.min, value),
                max: Math.max(minMax.max, value)
            };
        }
    },
    _getXRange: function ( data, yearSuffix ) {
        return Object.keys(data).filter(function ( key ) {
            return yearSuffix ? key.indexOf(yearSuffix) !== -1 : key;
        }).map(function ( key ) {
            return (yearSuffix ? key.replace(yearSuffix, '') : key) - 0;
        }).filter(function ( year ) {
            return !isNaN(year);
        }).reduce(this._getRange, { min: 9999, max: 0 });
    },
    itemMapper: function ( range, yearSuffix, key ) {
        return function ( item, index ) {
            var years = [];
            for ( var year = range.min; year <= range.max; year++ ) {
                var newVar = yearSuffix + year;
                var val = item[ newVar ];
                years.push(val !== '' ? val - 0 : undefined);
            }
            return {
                id: index,
                style: item.Style,
                color: item.Colour,
                title: item.Mouseover,
                width: item.Width,
                name: item[ key ],
                shortName: item.ShortName,
                isDropdown: item.Type === 'dropdown',
                ID: item.ID,
                years: years
            };
        };
    },
    getYRange: function ( data ) {
        return data.reduce(function ( years, yearData ) {
            return years.concat(yearData.years);
        }, []).reduce(this._getRange, { min: 9999, max: 0 });
    },
    formatData: function ( data, yearSuffix, key ) {
        yearSuffix = yearSuffix || '';
        var range = this._getXRange(data[ 0 ], yearSuffix);
        return data.map(this.itemMapper(range, yearSuffix, key)).filter(function(item){
            return item.name;
        });
    }
});

angular.module('hc.checkboxes-menu', [
    'hc.d3.bind-data'
]).directive('checkboxesMenu', ["$timeout", "d3", function ( $timeout, d3 ) {
    var SHIFT_YEARS = [];
    for ( var year = 2016; year <= 2030; year++ ) {
        SHIFT_YEARS.push(year);
    }

    return {
        scope: { title: '=', data: '=', onUpdate: '&', yearsShift: '=' },
        transclude: true,
        templateUrl: 'src/checkboxes-menu/checkboxes-menu.html',
        link: function ( $scope, $element ) {
            $scope.$watch('data', function () {
                $timeout(function () {
                    var tooltip = d3.selectAll($element).select('.check-tooltip');
                    d3.selectAll($element).selectAll('.checkbox').datum($scope.data || []).on({
                        mousemove: function ( d, i ) {
                            tooltip.style({
                                opacity: 0.9,
                                left: (d3.event.pageX + 10) + 'px',
                                top: (d3.event.pageY - 50) + 'px'
                            }).text(d[ i ].title);
                        },
                        mouseleave: function () {
                            tooltip.style({ opacity: 0 });
                        }
                    });
                });
            });

            if ( !$scope.yearsShift ) {return;}
            $scope.shiftYears = SHIFT_YEARS;
            var removeWatch = $scope.$watch('data', function ( data ) {
                if ( !data ) {return;}
                removeWatch();
                $scope.data.forEach(function ( chart ) {
                    chart.$selected = true;
                    chart.$shiftYear = SHIFT_YEARS[ 0 ];
                });
            });

        }
    };
}]);

angular.module('hong-layout', [
    'hc.checkboxes-menu',
    'hc.svg-hong-chart',
    'hc.data-utilites',
    'hc.d3.bind-data',
    'hc.hong-tooltip'
]).directive('hongLayout', ["$timeout", "DataUtilites", "$q", "d3", function ( $timeout, DataUtilites, $q, d3 ) {
    var getCsv = function ( url ) {return $q(function ( resolve ) { d3.csv(url, resolve); }); };
    return {
        templateUrl: 'src/hong-layout/hong-layout.html',
        link: function ( $scope, $element ) {
            $q.all({
                abatementMeasures: getCsv('stubs/AbatementMeasures_v5.csv'),
                targetsAndBaseLine: getCsv('stubs/TargetsAndBaseline_v1.csv')
            }).then(function ( csvData ) {
                return {
                    abatementMeasures: DataUtilites.formatData(csvData.abatementMeasures, 'ReductionYear', 'Name'),
                    targetsAndBaseLine: DataUtilites.formatData(csvData.targetsAndBaseLine, null, 'Year')
                };
            }).then(function ( csvData ) {
                var measures = $scope.abatementMeasures = csvData.abatementMeasures;
                var charts = $scope.targetsAndBaseLine = csvData.targetsAndBaseLine;
                charts.$version = measures.$version = 0;
                charts.forEach(function ( d ) {
                    d.$selected = true;
                });

                var map = measures.reduce(function ( map, d ) {
                    map[ d.ID ] = d;
                    return map;
                }, {});

                measures.filter(function ( measure ) {
                    return measure.isDropdown;
                }).forEach(function ( dropdownMeasure ) {
                    var parent = map[ dropdownMeasure.ID.slice(0, dropdownMeasure.ID.indexOf('.')) ];
                    measures.splice(measures.indexOf(dropdownMeasure), 1);
                    parent.dropdowns = parent.dropdowns || [];
                    parent.dropdowns.push(dropdownMeasure);
                    if ( parent.dropdowns.length === 1 ) {
                        parent.$selectedDropDown = parent.dropdowns[ 0 ];
                    }
                });

                $scope.renderChart = function () {
                    charts.$version++;
                    measures.$version++;
                };

                var abatementChartCopy = charts[ 0 ].years;
                charts[ charts.length - 1 ].years = abatementChartCopy.slice();
                $scope.applyAbatement = function () {
                    var abatementChart = charts[ charts.length - 1 ];
                    abatementChart.years = abatementChartCopy.slice();
                    measures.filter(function ( measure ) {
                        return measure.$selected;
                    }).forEach(function ( selection ) {
                        var $shiftYear = selection.$shiftYear - 2016;
                        selection = selection.dropdowns ? selection.$selectedDropDown : selection;
                        abatementChart.years.forEach(function ( year, yearIndex ) {
                            var shiftedYear = yearIndex + $shiftYear;
                            if ( abatementChart.years.length - 1 >= shiftedYear && selection.years.length - 1 >= yearIndex ) {
                                abatementChart.years[ shiftedYear ] -=  selection.years[ yearIndex ];
                            }
                        });
                    });
                    $scope.renderChart();
                };

                $timeout(function () {
                    $scope.tooltip = d3.select($element[ 0 ]).select('.hong-tooltip');
                    $scope.applyAbatement();
                });
            });
        }
    };
}]);

angular.module('hc.hong-tooltip', [
    'hc.d3.bind-data'
]).directive('hongTooltip', ["d3", "$window", "$timeout", function ( d3, $window, $timeout ) {
    var margin = { top: 12, right: 5, bottom: 0, left: 5 };

    function translate( x, y ) {return { transform: 'translate(' + x + ',' + y + ')' };}

    return {
        replace: true,
        templateUrl: 'src/hong-tooltip/hong-tooltip.html',
        scope: { abatement: '=', charts: '=', year: '=' },
        link: function ( $scope, $element ) {
            var x = d3.scale.linear();
            var y = d3.scale.linear();
            var currentSvgElement = d3.select($element[ 0 ]).selectAll('svg');
            var svg = currentSvgElement.selectAll('.main');

            var htmlWidth = 250; //currentSvgElement[0][0].parentNode.offsetWidth;
            var height = 35;
            svg.attr(translate(margin.left, margin.top));
            var width = htmlWidth - margin.left - margin.right;
            x.range([ 0, width ]);
            y.range([ height, 0 ]);
            currentSvgElement.attr({
                width: width + margin.left + margin.right,
                height: height + margin.top + margin.bottom
            });
            d3.select($element[ 0 ]).select('.under-chart svg').attr({ height: 70 });

            function render( data, opt_noTransition ) {
                if ( !data || !data.length ) {return;}
                var val = function ( d ) {return d.value;};
                var maxYValue = d3.max(data, val);

                x.domain([ 0, data.length ]);
                y.domain([ maxYValue, 0 ]);

                var height = function ( d ) { return y(d.value);};
                var gap = 0.03;
                var yCoord = function ( d ) {return y(maxYValue - d.value);};
                var xCoord = function ( d, index ) {return x(index);};
                svg.transition().duration(opt_noTransition ? 0 : 0).each(function () {
                    svg.select('.rect').attr(translate(x(gap), 0)).bindData('rect', data, {
                        fill: function ( d ) {return d.color;},
                        opacity: 0.8
                    }, 'text').attr({ x: xCoord, width: x(1) * (1 - gap * 2) })
                        .transition().attr({ height: height, y: yCoord });

                    svg.select('.text').attr(translate(x(0.5), 0)).bindData('text', data, {}, 'text')
                        .text(function ( d ) { return Math.round(d.value); }).attr({ x: xCoord })
                        .transition().attr({ y: yCoord });

                    svg.select('.text-under').attr(translate(x(0.5 + 0.25), 0)).bindData('text', data, {}, 'text')
                        .text(function ( d ) { return d.shortName }).attr({
                        x: xCoord,
                        transform: function ( d, i ) {
                            return 'rotate(-90,' + xCoord(d, i) + ',0)'
                        }
                    })
                });
            }

            var data;
            $scope.$watchGroup([ 'charts.$version', 'year' ], function () {
                if ( !$scope.abatement ) {return;}
                data = $scope.abatement.filter(function ( selection ) {
                    return selection.$selected;
                }).map(function ( selection ) {
                    var sel = selection.$selectedDropDown || selection;
                    var shift = $scope.year - selection.$shiftYear + 2017;
                    return {
                        color: selection.color,
                        text: selection.name,
                        shortName: sel.shortName,
                        value: shift > 0 ? d3.sum(sel.years.slice(0, shift)) : 0
                    };
                });
                $timeout(function () {render(data);});
            });
        }
    };
}]);
angular.module('hc.svg-hong-chart', [
    'hc.data-utilites',
    'hc.d3.bind-data'
]).directive('svgHongChart', ["DataUtilites", "$window", "d3", function ( DataUtilites, $window, d3 ) {
    var margin = { top: 15, right: 20, bottom: 36, left: 55 };

    function translate( x, y ) {return { transform: 'translate(' + x + ',' + y + ')' };}

    function key( k ) {return function ( d ) {return d[ k ];}; }

    return {
        restrict: 'A',
        templateUrl: 'src/svg-hong-chart/svg-hong-chart.html',
        scope: { data: '=svgHongChart', tooltip: '=', tooltipYear: '=' },
        link: function ( $scope, $element ) {
            $scope.isChrome = $window.chrome;
            var x = d3.scale.linear();
            var y = d3.scale.linear();
            var xAxis = d3.svg.axis().orient('bottom').tickSize(4, 0);
            var yAxis = d3.svg.axis().orient('left').tickSize(4, 0).tickValues(d3.range(0, 1000, 100));

            var currentSvgElement = d3.select($element[ 0 ]).select('svg');
            var svg = currentSvgElement.select('.main');

            var scaleFactor;

            $scope.tooltipFn = function ( yearIndex, chartIndex, toShow ) {
                $scope.tooltipYear = yearIndex;
                $scope.data[ chartIndex ].$highlight = toShow;
                $scope.$apply();
            };

            function updateWidth() {
                var htmlWidth = currentSvgElement[ 0 ][ 0 ].parentNode.offsetWidth;
                scaleFactor = htmlWidth > 400 ? 1 : (htmlWidth / 400);
                svg.attr(translate(margin.left, margin.top));
                var width = htmlWidth - margin.left - margin.right;
                var height = htmlWidth / 1.5 / (0.4 + 0.6 * scaleFactor) - margin.top - margin.bottom;
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
                svg.select('.y-axis-label').attr(translate(0, height / 2 + 10));
            }

            function render( data, opt_offsetArg, opt_noTransition ) {
                if ( data.length < 3 ) {return;}
                var tooltipFn = $scope.tooltipFn;
                opt_offsetArg = opt_offsetArg || 0;
                var filteredData = data;
                var yRange = DataUtilites.getYRange(filteredData);
                var firstChart = data[ 0 ];
                x.domain([ 0, firstChart.years.length - 1 ]);
                /** uncomment if will decided to start axis from min value instead of ziro */
                    // y.domain([ yRange.min  / 1.01, yRange.max * 1.01 ]);
                y.domain([ 0, yRange.max * 1.01 ]);

                svg.select('.x.axis').call(xAxis.tickFormat(function ( d ) {return opt_offsetArg + d;}));
                svg.select('.y.axis').call(yAxis);

                var xCoord = function ( d ) {return x(d.x);};
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
                    });
                }

                var visibiliy = { visibility: function ( d ) {return d.$selected ? 'visiblie' : 'hidden'} };

                var tooltip = $scope.tooltip;
                svg.transition().duration(opt_noTransition ? 0 : 500).each(function () {
                    svg.select('.chart-lines').bindData('path', filteredData, {
                        stroke: key('color'),
                        'stroke-dasharray': function ( d ) {
                            return d.style === 'dashed' ? '10,3' : 0;
                        },
                        'stroke-width': key('width')
                    }, 'id').attr(visibiliy).transition().attr({ d: function ( chart ) {return line(cover(chart.years));} });

                    svg.select('.chart-lines').bindData('g', filteredData, {
                        fill: key('color'),
                        'stroke-width': 1
                    }, 'id').attr(visibiliy).bindData('circle', function ( data ) {
                        return cover(data.years);
                    }).attr({ r: scaleFactor * 4 }).transition().attr({ cx: xCoord, cy: yCoord });

                    svg.select('.chart-lines-hover').bindData('g', filteredData, null, 'id').bindData('circle', function ( data ) {
                        return cover(data.years);
                    }).attr({ cx: xCoord, cy: yCoord, r: scaleFactor * 20 }).on({
                        mouseenter: function ( d, yearIndex, chartIndex ) {
                            tooltipFn(yearIndex, chartIndex, true);
                            var currentLine = svg.selectAll('.chart-lines path:nth-child(' + (chartIndex + 1) + ')');
                            currentLine.attr({
                                'old-stroke': currentLine.attr('stroke-width'),
                                'stroke-width': 3
                            });

                            var circles = svg.selectAll('.chart-lines g circle:nth-child(' + (yearIndex + 1) + ')').attr({ r: scaleFactor * 6 });
                            var circle = d3.select(circles[ 0 ][ chartIndex ]).classed({ big: true });
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
                            var currentLine = svg.selectAll('.chart-lines path:nth-child(' + (chartIndex + 1) + ')');
                            currentLine.attr('stroke-width', currentLine.attr('old-stroke-width'));
                            svg.selectAll('.chart-lines g')[ 0 ].forEach(function ( d ) {
                                d3.select(d3.select(d).selectAll('circle')[ 0 ][ yearIndex ]).attr({ r: scaleFactor * 4 }).classed({
                                    big: false
                                });
                            });
                            svg.select('.target-lines').attr({ opacity: 0 });
                            tooltip.style('opacity', 0);
                        }
                    });

                    var lastChart = filteredData[ filteredData.length - 1 ];
                    svg.select('.bau-reduce-area').on({
                        mousemove: function () {
                            tooltip.style({
                                opacity: 0.9,
                                left: (d3.event.pageX + 10) + 'px',
                                top: (d3.event.pageY - 28) + 'px'
                            });
                        },
                        mouseleave: function () {
                            tooltip.style({ opacity: 0 });
                        }
                    }).transition().attr({
                        fill: 'rgb(248,167,107)',
                        visibility: lastChart.$selected && filteredData[ 0 ].$selected ? 'visible' : 'hidden',
                        opacity: '0.2',
                        d: d3.svg.area().y0(y).x(function ( d, i ) {
                            return x(i);
                        }).y1(function ( d, i ) {
                            return y(lastChart.years[ i ]);
                        })(firstChart.years)
                    });
                });
            }

            updateWidth();

            $scope.$watchGroup([ 'data', 'data.$version' ], function () {
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
    };
}]);

angular.module("hong-layout").run(["$templateCache", function($templateCache) {$templateCache.put("src/checkboxes-menu/checkboxes-menu.html","<div class=\"wrapper\">\r\n    <div class=\"badge\" ng-transclude></div>\r\n    <div class=\"max-height-limit\">\r\n        <div ng-repeat=\"chart in data track by chart.id\" class=\"checkbox\" ng-class=\"{bold: chart.$highlight}\">\r\n            <label>\r\n                <select ng-model=\"chart.$shiftYear\" ng-change=\"chart.$selected = true;onUpdate()\" class=\"years-checkbox\"\r\n                        ng-if=\"yearsShift\"\r\n                        ng-options=\"year for year in shiftYears track by year\">\r\n                </select>\r\n            </label>\r\n            <label>\r\n                <input type=\"checkbox\" ng-model=\"chart.$selected\" ng-change=\"onUpdate()\">\r\n                <div class=\"color-box\" ng-if=\"chart.color\"\r\n                     ng-style=\"{background: chart.color, visibility: chart.$selected ? \'visible\' : \'hidden\'}\"></div>\r\n                <span class=\"real-label\">{{ chart.name }}</span>\r\n                <select ng-model=\"chart.$selectedDropDown\" ng-change=\"chart.$selected = true;onUpdate()\"\r\n                        class=\"custom-select\"\r\n                        ng-if=\"chart.dropdowns\"\r\n                        ng-options=\"option.name for option in chart.dropdowns track by option.id\">\r\n                </select>\r\n            </label>\r\n        </div>\r\n    </div>\r\n</div>\r\n<div class=\"check-tooltip\"></div>\r\n");
$templateCache.put("src/hong-layout/hong-layout.html","<div class=\"parent\">\r\n    <div class=\"hong-layout-block chart\">\r\n        <hong-tooltip charts=\"targetsAndBaseLine\" abatement=\"abatementMeasures\" year=\"year\"></hong-tooltip>\r\n        <div class=\"header\">\r\n            <div class=\"responsive\">\r\n                <h1>Meeting Australia’s 2030 emissions reduction target</h1>\r\n                <div class=\"content\">\r\n                    To understand the task ahead for Australia to meet our target\r\n                    and reduce greenhouse emissions by 28% below 2005 levels,\r\n                    Energetics has modelled a range of measures that can be pursued\r\n                    under the Federal Government’s current suite of policies, and also\r\n                    potential, future policy initiatives\r\n                </div>\r\n            </div>\r\n        </div>\r\n        <div svg-hong-chart=\"targetsAndBaseLine\" tooltip=\"tooltip\" tooltip-year=\"year\"></div>\r\n    </div>\r\n    <div class=\"hong-layout-block menu\">\r\n        <img src=\"src/energetics-ball-logo.png\" alt=\"log\" title=\"logo\">\r\n        <checkboxes-menu data=\"targetsAndBaseLine\" on-update=\"renderChart()\">\r\n            Emission trajectories\r\n        </checkboxes-menu>\r\n\r\n        <checkboxes-menu data=\"abatementMeasures\" on-update=\"applyAbatement()\" years-shift=\"true\">\r\n            Abatement measures\r\n        </checkboxes-menu>\r\n    </div>\r\n</div>\r\n");
$templateCache.put("src/hong-tooltip/hong-tooltip.html","<div class=\"hong-tooltip opacity-animate\">\r\n    <div class=\"tooltip-header\">Emission trajectory in year {{year + 2016}}</div>\r\n    <div class=\"content\">\r\n        <div ng-repeat=\"chart in charts\" ng-class=\"{bold: chart.$highlight}\">\r\n            <div class=\"color-box\" ng-style=\"{background: chart.color}\"></div>\r\n            {{chart.name}}:\r\n            <i>{{chart.years[year] | number : 0}}</i>\r\n        </div>\r\n    </div>\r\n    <div style=\"text-align: center\">\r\n        <svg>\r\n            <g class=\"main\">\r\n                <g class=\"rect\"></g>\r\n                <g transform=\"translate(0, -2)\">\r\n                    <g class=\"text\" fill=\"black\" font-size=\"8\" text-anchor=\"middle\"></g>\r\n                </g>\r\n            </g>\r\n        </svg>\r\n    </div>\r\n    <div class=\"under-chart\">\r\n            <svg>\r\n                <g class=\"main\">\r\n                    <g transform=\"translate(0,-5)\" font-size=\"10\" text-anchor=\"end\">\r\n                        <g class=\"text-under\"></g>\r\n                    </g>\r\n                </g>\r\n            </svg>\r\n    </div>\r\n</div>\r\n");
$templateCache.put("src/svg-hong-chart/svg-hong-chart.html","<svg xmlns=\"http://www.w3.org/2000/svg\">\r\n    <defs>\r\n        <linearGradient id=\"greenHongGradient\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\r\n            <stop offset=\"0%\" stop-color=\"#FEFEFE\" stop-opacity=\"0.2\"></stop>\r\n            <stop offset=\"100%\" stop-color=\"rgb(94,95,97)\" stop-opacity=\"0.2\"></stop>\r\n        </linearGradient>\r\n    </defs>\r\n    <!--TODO: add radius in here, and add circle as mask, not as component-->\r\n    <g transform=\"translate(1,1)\">\r\n        <rect rx=\"25\" ry=\"25\" fill=\"url(#greenHongGradient)\" width=\"99.5%\" height=\"99.5%\" stroke=\"rgb(94,95,97)\" stroke-opacity=\"0.5\"></rect>\r\n    </g>\r\n    <g class=\"main\" font-size=\"100%\">\r\n        <g stroke-dasharray=\"10,5\" opacity=\"0\" stroke=\"rgb(94,95,97)\" class=\"target-lines opacity-animate\">\r\n            <line x2=\"0\" y2=\"0\" x1=\"0\" y1=\"0\" class=\"x-line\"></line>\r\n            <line x2=\"0\" y2=\"0\" x1=\"0\" y1=\"0\" class=\"y-line\"></line>\r\n        </g>\r\n        <path class=\"bau-reduce-area\" fill=\"#E5B951\" opacity=\"0.2\" cursor=\"pointer\"></path>\r\n        <g class=\"y axis\"></g>\r\n        <g class=\"x axis\"></g>\r\n        <g class=\"chart-lines\"></g>\r\n        <g class=\"chart-lines-hover\" opacity=\"0\" cursor=\"pointer\"></g>\r\n        <g class=\"logo\">\r\n            <g transform=\"translate(5,-20)\">\r\n                <image xlink:href=\"src/energetics-logo.png\" height=\"20\" width=\"90\"></image>\r\n            </g>\r\n        </g>\r\n        <g fill=\"rgb(94,95,97)\" font-weight=\"bold\" text-anchor=\"middle\">\r\n            <g class=\"y-axis-label\">\r\n                <text transform=\"translate(-35, -10) rotate(270)\">Emissions (MtCO₂-e)</text>\r\n            </g>\r\n            <g class=\"x-axis-label\">\r\n                <text transform=\"translate(0, 30)\">Time (Years)</text>\r\n            </g>\r\n        </g>\r\n    </g>\r\n    <circle fill=\"white\" cx=\"100%\" cy=\"50%\" r=\"25\" stroke=\"rgb(94,95,97)\" stroke-width=\"1px\" stroke-opacity=\"0.5\"></circle>\r\n    <g transform=\"translate(-1,0)\" ng-hide=\"::isChrome\" stroke=\"white\" fill=\"white\" stroke-width=\"1\">\r\n        <rect width=\"10\" x=\"100%\" y=\"25%\" height=\"50%\"></rect>\r\n    </g>\r\n</svg>\r\n");}]);