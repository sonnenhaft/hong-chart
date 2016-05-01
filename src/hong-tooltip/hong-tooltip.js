angular.module('hc.hong-tooltip', [
    'hc.d3.bind-data'
]).directive('hongTooltip', function ( d3, $window , $timeout) {
    var margin = {top: 2, right: 2, bottom: 2, left: 2};

    function translate( x, y ) {return {transform: 'translate(' + x + ',' + y + ')'};}

    return {
        replace: true,
        templateUrl: 'src/hong-tooltip/hong-tooltip.html',
        scope: {abatement: '=', charts: '=', year: '='},
        link: function ( $scope, $element ) {

            var x = d3.scale.linear();
            var y = d3.scale.linear();
            var xAxis = d3.svg.axis().orient('bottom').tickSize(4, 0);
            var currentSvgElement = d3.select($element[0]).select('svg');
            var svg = currentSvgElement.select('.main');

            function updateWidth() {
                var htmlWidth = currentSvgElement[0][0].parentNode.offsetWidth;
                svg.attr(translate(margin.left, margin.top));
                var width = htmlWidth - margin.left - margin.right;
                var height = Math.min(100, width / 2);
                x.range([0, width]);
                y.range([height, 0]);
                xAxis.scale(x);
                currentSvgElement.attr({
                    width: width + margin.left + margin.right,
                    height: height + margin.top + margin.bottom
                });
                svg.selectAll('.x.axis').attr(translate(0, height));
            }

            function render( data, opt_noTransition ) {
                var maxHeight = (15 * 1.01);

                x.domain([0, data.length]);
                console.log(data.length)
                y.domain([0 / 1.01, maxHeight]);

                var height = function ( d ) {return y(d.value);};
                svg.select('.x.axis').call(xAxis.tickFormat(function ( d ) {return d;}));

                var gap = 0.03;
                svg.transition().duration(opt_noTransition ? 0 : 500).each(function () {

                    svg.select('.rect').attr(translate(x(gap),0)).bindData('rect', data, {
                        fill: 'blue',
                        opacity: 0.3
                    }, 'text').transition().attr({
                        height: height,
                        width: x(1) * (1 - gap*2),
                        y: function ( d ) {return  y( maxHeight - d.value)},
                        x: function ( d, index ) {return x(index);}
                    });
                });
            }

            var data = [
                {text: 'do', value: 7},
                {text: 'du', value: 2},
                {text: 'de', value: 9},
                {text: 'ds', value: 9},
                {text: 'd8', value: 9}
            ];

            $timeout(function(){
                updateWidth();
                render(data)
            })


            function updateWindow() {
                updateWidth();
                render(data, true);
        }

            angular.element($window).on('resize', updateWindow);

        }
    };
});