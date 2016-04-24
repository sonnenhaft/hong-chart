angular.module('demo-app', [
    'checkboxes-menu'
]).directive('demoData', function () {
    return {
        templateUrl: 'src/template.html',
        link: function ( $scope ) {
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
                var hongChart = d3.select('svg').hongChart();
                $scope.abatementMeasures = data[ 0 ];
                $scope.targetsAndBaseLine = data[ 2 ];

                var charts = $scope.targetsAndBaseLine;
                charts.forEach(function ( d ) { d.$selected = true;});
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
                    $scope.abatementMeasures.filter(function ( d ) {
                        return d.$selected;
                    }).forEach(function ( selection ) {
                        otherData.years.forEach(function ( year, yearIndex ) {
                            otherData.years[ yearIndex ] = year - selection.years[ yearIndex ];
                        });
                    });
                    $scope.renderChart();
                };

                charts.push([]);
                $scope.applyAbatement();
                $scope.$digest();

                window.onresize = function updateWindow() {
                    hongChart.updateWidth();
                    hongChart.render(data[ 2 ], 2016, true);
                };
            });
        }
    }
});
