EupTableExtend.EupBtn = function (option) {
    var _default = {
        id: '',
        iconClass: '',
        icon: '',
        class: '',
        textMultiLang: '',
        text: '',
        rawText: '',
        attr: {},//{}
        title: '',
    };
    $.extend(_default, option);
    if (_default.iconClass) {
        _default.icon = '<i class="' + _default.iconClass + '"></i>';
    }
    if (_default.textMultiLang) {
        _default.text = '&nbsp;' +MultiLanguageControllor.get(_default.textMultiLang, false, null, true);
    }
    if (_default.id) {
        _default.attr.id = _default.id;
    }
    if (_default.title) {
        _default.attr.title = _default.title;
    }
    _default.class += " eup-btn";
    this._default = _default;
};
EupTableExtend.EupBtn.prototype = {
    getValue: function (rawValue) {
        if (rawValue) {
            var value = ""
            if (this._default.rawValue) {
                value = this._default.textMultiLang ? MultiLanguageControllor.get(this._default.textMultiLang, true) : this._default.text
            }
            return (value !== null && value !== undefined) ? value : "";
        }
        return new EupTableExtend.HtmlCell({
            tag: 'button',
            attr: this._default.attr,
            class: this._default.class,
            html: this._default.icon + this._default.text,
            onClick: this._default.onClick,
            __id: this._default.__id,
        }).getValue(rawValue);
    },
};