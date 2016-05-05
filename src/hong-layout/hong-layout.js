angular.module('hong-layout', [
    'hc.checkboxes-menu',
    'hc.svg-hong-chart',
    'hc.data-utilites',
    'hc.d3.bind-data',
    'hc.hong-tooltip'
]).directive('hongLayout', function ( $timeout, DataUtilites, $q, d3 ) {
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
});
