angular.module('hc.checkboxes-menu', [
    'hc.d3.bind-data'
]).directive('checkboxesMenu', function ( $timeout, d3 ) {
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
});
