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
            var removeWatch = $scope.$watch('data', function ( data ) {
                if ( !data ) {return;}
                $scope.data.forEach(function ( chart ) {
                    chart.$selected = true;
                    chart.$shiftYear = SHIFT_YEARS[ 0 ];
                });
                removeWatch();
            })
        }
    };
});
