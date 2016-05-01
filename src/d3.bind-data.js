angular.module('hc.d3.bind-data', []).factory('d3', function ( $window ) {
    return $window.d3;
}).run(function ( d3 ) {
    d3.selection.prototype.bindData = function ( tag, data, opt_attrs, opt_idKey ) {
        var enteredSelection;
        if ( opt_idKey ) {
            enteredSelection = this.selectAll(tag).data(data, function ( d ) {return d[opt_idKey];});
        } else {
            enteredSelection = this.selectAll(tag).data(data);
        }
        enteredSelection.enter().append(tag).attr(opt_attrs);
        enteredSelection.exit().remove();
        return enteredSelection;
    };
});
