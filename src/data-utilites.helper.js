angular.module('hc.data-utilites', []).value('DataUtilites', {
    _getRange: function ( minMax, value ) {
        if ( value === undefined ) {
            return minMax;
        } else {
            return {
                min: Math.min(minMax.min, value),
                max: Math.max(minMax.max, value)
            };
        }
    },
    _getXRange: function ( data, yearSuffix ) {
        return Object.keys(data).filter(function ( key ) {
            return yearSuffix ? key.indexOf(yearSuffix) !== -1 : key;
        }).map(function ( key ) {
            return (yearSuffix ? key.replace(yearSuffix, '') : key) - 0;
        }).filter(function ( year ) {
            return !isNaN(year);
        }).reduce(this._getRange, { min: 9999, max: 0 });
    },
    itemMapper: function ( range, yearSuffix, key ) {
        return function ( item, index ) {
            var years = [];
            for ( var year = range.min; year <= range.max; year++ ) {
                var newVar = yearSuffix + year;
                var val = item[ newVar ];
                years.push(val !== '' ? val - 0 : undefined);
            }
            return {
                id: index,
                style: item.Style,
                color: item.Colour,
                title: item.Mouseover,
                width: item.Width,
                name: item[ key ],
                shortName: item.ShortName,
                isDropdown: item.Type === 'dropdown',
                ID: item.ID,
                years: years
            };
        };
    },
    getYRange: function ( data ) {
        return data.reduce(function ( years, yearData ) {
            return years.concat(yearData.years);
        }, []).reduce(this._getRange, { min: 9999, max: 0 });
    },
    formatData: function ( data, yearSuffix, key ) {
        yearSuffix = yearSuffix || '';
        var range = this._getXRange(data[ 0 ], yearSuffix);
        return data.map(this.itemMapper(range, yearSuffix, key)).filter(function(item){
            return item.name;
        });
    }
});
