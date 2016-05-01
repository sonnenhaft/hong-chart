angular.module('hc.hong-tooltip', [
    'hc.d3.bind-data'
]).directive('hongTooltip', function ( d3, $window, $timeout ) {
    var margin = {top: 12, right: 5, bottom: 0, left: 5};

    function translate( x, y ) {return {transform: 'translate(' + x + ',' + y + ')'};}

    return {
        replace: true,
        templateUrl: 'src/hong-tooltip/hong-tooltip.html',
        scope: {abatement: '=', charts: '=', year: '='},
        link: function ( $scope, $element ) {

            var x = d3.scale.linear();
            var y = d3.scale.linear();
            var currentSvgElement = d3.select($element[0]).select('svg');
            var svg = currentSvgElement.select('.main');

            function updateWidth() {
                var htmlWidth = 150; //currentSvgElement[0][0].parentNode.offsetWidth;
                var height = 35;
                svg.attr(translate(margin.left, margin.top));
                var width = htmlWidth - margin.left - margin.right;
                x.range([0, width]);
                y.range([height, 0]);
                currentSvgElement.attr({
                    width: width + margin.left + margin.right,
                    height: height + margin.top + margin.bottom
                });
            }

            $scope.$watchGroup(['charts.$version', 'year'], function () {
                if ( !$scope.abatement ) {return;}
                var maxLength = $scope.charts[0].years.length;
                data = $scope.abatement.filter(function ( selection ) {
                    return selection.$selected;
                }).map(function ( selection ) {
                    var sel = selection.$selectedDropDown || selection;
                    var shift = selection.$shiftYear - 2016;
                    //console.log(shift)
                    return {
                        text: selection.name,
                        value: d3.sum(sel.years.slice(0, $scope.year - shift))
                    }
                });
                $timeout(function () {
                    console.log(data)
                    render(data);
                })

            });

            function render( data, opt_noTransition ) {
                if ( !data || !data.length ) {return;}
                var val = function ( d ) {return d.value};
                var maxHeight = d3.max(data, val);
                console.log(maxHeight)

                x.domain([0, data.length]);
                y.domain([0, (maxHeight + 1) * 1.1]);

                console.log(y(0))

                var height = function ( d ) { return y(d.value);};
                var gap = 0.03;
                var yCoord = function ( d ) {
                    console.log(y)
                    return y(maxHeight - d.value)};
                var xCoord = function ( d, index ) {return x(index);};
                svg.transition().duration(opt_noTransition ? 0 : 500).each(function () {

                    svg.select('.rect').attr(translate(x(gap), 0)).bindData('rect', data, {
                        fill: 'blue',
                        opacity: 0.3
                    }, 'text').attr({
                        x: xCoord,
                        width: x(1) * (1 - gap * 2)
                    }).transition().attr({
                        height: height,
                        //y: yCoord
                    });

                    svg.select('.text').attr(translate(x(0.5), 0)).bindData('text', data, {}, 'text').text(function ( d ) {
                        return d.value;
                    }).transition().attr({y: yCoord, x: xCoord});
                });
            }

            var data;

            updateWidth();
        }
    };
});