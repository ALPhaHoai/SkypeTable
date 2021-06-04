EupTableExtend.HtmlCell = function (opts) {
    var _default = {
        tag: 'div',
        attr: {},
        text: "",
        html: "",
        class: "",
        onClick: null,
        __id: "",
    };
    Eup.Object.extend(_default, opts)

    if (_default.class) {
        _default.attr.class = (_default.attr.class || "") + " " + _default.class;
    }

    this._default = _default;
};
EupTableExtend.HtmlCell.prototype = {
    getValue: function (rawValue) {
        if (rawValue) {
            return this._default.text;
        }
        if (rawValue) {
            return this._default.text;
        }
        if (this._default.onClick && this._default.__id) {
            this._default.attr.onclick = 'EupTableExtend.prototype.Event.click("' + this._default.__id + '")'
        }
        var text = this._default.text || ""
        text += this._default.html || ""

        return "<" + this._default.tag + " " + Eup.HtmlHelper.generateAttributes(this._default.attr) + " >" + text + "</" + this._default.tag + ">";
    },
};