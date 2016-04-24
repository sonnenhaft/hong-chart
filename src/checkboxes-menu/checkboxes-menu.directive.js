angular.module('checkboxes-menu', [
]).directive('checkboxesMenu', function () {
    return {
        scope: { title: '=', data: '=', onUpdate: '&' },
        transclude: true,
        templateUrl: 'src/checkboxes-menu/checkboxes-menu.html'
    };
});