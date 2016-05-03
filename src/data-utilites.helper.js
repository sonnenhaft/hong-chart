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
    COLORS: [ '#D1BD8C', '#B7BF54', '#488652', '#CC6B67', '#8BC669', '#91547F', '#D47DA3', '#D87D45',
        '#81D4FA', '#4FC3F7', '#29B6F6', '#03A9F4',
        '#039BE5', '#0288D1', '#0277BD', '#01579B',
        '#80D8FF', '#40C4FF', '#00B0FF', '#0091EA',
        '#00BCD4', '#E0F7FA', '#B2EBF2', '#80DEEA',
        '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1',
        '#0097A7', '#00838F', '#006064', '#84FFFF'
    ],
    itemMapper: function ( range, yearSuffix, key ) {
        var colors = this.COLORS;
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
                color: item.Color || colors[ index ],
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
