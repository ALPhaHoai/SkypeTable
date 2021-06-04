
EupTableExtend.ImageCell = function (opts) {
    var _default = {
        src: null,
        attr: {},
    };
    if (typeof opts === 'string') {
        _default.src = opts;
    } else {
        $.extend(_default, opts);
    }

    this._default = _default;
};
EupTableExtend.ImageCell.prototype = {
    getValue: function (rawValue) {
        if (rawValue) {
            return "";
        }
        return new EupTableExtend.HtmlCell({
            tag: 'img',
            attr: $.extend({}, this._default.attr, {src: this._default.src}),
        }).getValue(rawValue);
    },
};