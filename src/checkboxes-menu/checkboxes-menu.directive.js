angular.module('checkboxes-menu', []).directive('checkboxesMenu', function () {
    var SHIFT_YEARS = [];
    for ( var year = 2017; year <= 2030; year++ ) {
        SHIFT_YEARS.push(year);
    }

    return {
        scope: { title: '=', data: '=', onUpdate: '&', yearsShift: '=' },
        transclude: true,
        templateUrl: 'src/checkboxes-menu/checkboxes-menu.html',
        link: function ( $scope ) {
            if ( !$scope.yearsShift ) {return;}
            $scope.shiftYears = SHIFT_YEARS;
            $scope.data.forEach(function ( chart ) {
                chart.$selected = true;
                chart.$shiftYear = SHIFT_YEARS[ 0 ];
            });
        }
    };
});
