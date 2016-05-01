angular.module('hc.hong-tooltip', []).directive('hongTooltip', function () {
    return {
        replace: true,
        templateUrl: 'src/hong-tooltip/hong-tooltip.html',
        scope: { abatement: '=', charts: '=', year: '=' }
    };
});