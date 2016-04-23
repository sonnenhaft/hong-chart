window.d3.selection.prototype.bindData = function ( tag, data, opt_attrs ) {
    var enteredSelection = this.selectAll(tag).data(data);
    enteredSelection.enter().append(tag).attr(opt_attrs);
    enteredSelection.exit().remove();
    return enteredSelection;
};