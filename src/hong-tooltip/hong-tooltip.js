angular.module('hc.hong-tooltip', [
    'hc.d3.bind-data'
]).directive('hongTooltip', function ( d3, $window, $timeout ) {
    var margin = { top: 12, right: 5, bottom: 0, left: 5 };

    function translate( x, y ) {return { transform: 'translate(' + x + ',' + y + ')' };}

    return {
        replace: true,
        templateUrl: 'src/hong-tooltip/hong-tooltip.html',
        scope: { abatement: '=', charts: '=', year: '=' },
        link: function ( $scope, $element ) {
            var x = d3.scale.linear();
            var y = d3.scale.linear();
            var currentSvgElement = d3.select($element[ 0 ]).select('svg');
            var svg = currentSvgElement.select('.main');

            var htmlWidth = 150; //currentSvgElement[0][0].parentNode.offsetWidth;
            var height = 35;
            svg.attr(translate(margin.left, margin.top));
            var width = htmlWidth - margin.left - margin.right;
            x.range([ 0, width ]);
            y.range([ height, 0 ]);
            currentSvgElement.attr({
                width: width + margin.left + margin.right,
                height: height + margin.top + margin.bottom
            });

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
                svg.transition().duration(opt_noTransition ? 0 : 2000).each(function () {
                    svg.select('.rect').attr(translate(x(gap), 0)).bindData('rect', data, {
                        fill: function ( d ) {return d.color;},
                        opacity: 0.8
                    }, 'text').attr({ x: xCoord, width: x(1) * (1 - gap * 2) })
                        .transition().attr({ height: height, y: yCoord });

                    svg.select('.text').attr(translate(x(0.5), 0)).bindData('text', data, {}, 'text')
                        .text(function ( d ) { return d.value; }).attr({ x: xCoord })
                        .transition().attr({ y: yCoord });
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
                        value: shift > 0 ? d3.sum(sel.years.slice(0, shift)) : 0
                    };
                });
                $timeout(function () {render(data);});
            });
        }
    };
});