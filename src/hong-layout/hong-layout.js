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
                abatementMeasures: getCsv('stubs/abatement-measures-v0.csv'),
                targetsAndBaseLine: getCsv('stubs/targets-and-baseline.csv')
            }).then(function ( csvData ) {
                return {
                    abatementMeasures: DataUtilites.formatData(csvData.abatementMeasures, 'ReductionYear', 'Name'),
                    targetsAndBaseLine: DataUtilites.formatData(csvData.targetsAndBaseLine, null, 'Year')
                };
            }).then(function ( csvData ) {
                var measures = $scope.abatementMeasures = csvData.abatementMeasures;
                var charts = $scope.targetsAndBaseLine = csvData.targetsAndBaseLine;
                charts.forEach(function ( d ) {
                    d.version = 0;
                    d.$selected = true;
                });

                var map = measures.reduce(function ( map, d ) {
                    map[d.ID] = d;
                    return map;
                }, {});

                measures.filter(function ( d ) {
                    return /\d\.\d\.\d/.test(d.ID);
                }).forEach(function ( d ) {
                    var parent = map[d.ID.slice(0, 3)];
                    parent.dropdowns = parent.dropdowns || [];
                    measures.splice(measures.indexOf(d), 1);
                    parent.dropdowns.push(d);
                });

                $scope.renderChart = function () {
                    charts[charts.length - 1].version++;
                };

                var abatementChartCopy = charts[0].years;
                $scope.applyAbatement = function () {
                    var abatementChart = charts[charts.length - 1];
                    abatementChart.years = abatementChartCopy.slice();
                    measures.filter(function ( d ) {
                        return d.$selected;
                    }).forEach(function ( selection ) {
                        var $shiftYear = selection.$shiftYear - 2016;
                        selection = selection.$selectedDropDown || selection;
                        abatementChart.years.forEach(function ( year, yearIndex ) {
                            var shiftedYear = yearIndex + $shiftYear;
                            if ( abatementChart.years.length - 1 >= shiftedYear ) {
                                abatementChart.years[shiftedYear] = abatementChart.years[shiftedYear] - selection.years[yearIndex];
                            }
                        });
                    });
                    $scope.renderChart();
                };

                $timeout(function () {
                    $scope.tooltip = d3.select($element[0]).select('.hong-tooltip');
                    $scope.applyAbatement();
                });
            });
        }
    };
});
