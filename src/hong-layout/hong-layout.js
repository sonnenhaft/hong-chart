angular.module('hong-layout', [
    'checkboxes-menu'
]).directive('hongLayout', function ( $timeout, DataUtilites ) {
    return {
        templateUrl: 'src/hong-layout/hong-layout.html',
        link: function ( $scope, $element ) {
            Promise.all([
                'stubs/abatement-measures.csv',
                'stubs/abatement-measures-v1.csv',
                'stubs/targets-and-baseline.csv'
            ].map(function ( url ) {
                return new Promise(function ( resolve ) { d3.csv(url, resolve); });
            })).then(function ( array ) {
                return [
                    { suffix: 'ReductionYear', key: 'Name' },
                    { suffix: 'ReductionYear', key: 'Name' },
                    { key: 'Year' } ].map(function ( mapping, index ) {
                    return DataUtilites.formatData(array[ index ], mapping.suffix, mapping.key);
                });
            }).then(function ( data ) {
                var measures = $scope.abatementMeasures = data[ 0 ];
                $scope.targetsAndBaseLine = data[ 2 ];

                var map = measures.reduce(function ( map, d ) {
                    map[ d.ID ] = d;
                    return map;
                }, {});

                measures.filter(function ( d ) {
                    return /\d\.\d\.\d/.test(d.ID)
                }).forEach(function ( d ) {
                    var parent = map[ d.ID.slice(0, 3) ];
                    parent.dropdowns = parent.dropdowns || [];
                    measures.splice(measures.indexOf(d), 1);
                    parent.dropdowns.push(d);
                });

                var charts = $scope.targetsAndBaseLine;
                charts.forEach(function ( d ) { d.$selected = true;});

                var hongChart;
                $scope.renderChart = function () {
                    hongChart.render(data[ 2 ], 2016);
                };

                $scope.applyAbatement = function () {
                    charts.pop();
                    var otherData = angular.copy(charts[ 0 ]);
                    otherData.color = 'black';
                    otherData.id = -1;
                    otherData.name = 'BAU + abatement';
                    charts.push(otherData);
                    measures.filter(function ( d ) {
                        return d.$selected;
                    }).forEach(function ( selection ) {
                        selection = selection.$selectedDropDown || selection;
                        otherData.years.forEach(function ( year, yearIndex ) {
                            otherData.years[ yearIndex ] = year - selection.years[ yearIndex ];
                        });
                    });
                    $scope.renderChart();
                };
                charts.push([]);

                $timeout(function () {
                    hongChart = d3.selectAll($element).select('svg').hongChart();
                    hongChart.setTooltipFn(function ( yearIndex, chartIndex, toShow ) {
                        $scope.tooltipIndex = yearIndex;
                        charts[ chartIndex ].$highlight = toShow;
                        $scope.$digest();
                    });
                    $scope.applyAbatement();
                });

                window.onresize = function updateWindow() {
                    hongChart.updateWidth();
                    hongChart.render(data[ 2 ], 2016, true);
                };
            });
        }
    }
}).factory('DataUtilites', function () {
    return window.DataUtilites;
});
