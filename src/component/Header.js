EupTableExtend.Header = function (field, fieldName) {
    for (var key in field) {
        this[key] = field[key];
    }

    if (typeof this._textAlign === 'undefined') {
        this._textAlign = new EupTableExtend.TextAlign(field);
    }

    this.colspan = this.getChildrenColspan();
    if (typeof fieldName !== 'undefined') {
        this._name = fieldName;
    }

    if (typeof this.width == 'string') {
        if (this.width.indexOf('px') !== -1) {
            this.width = parseInt(this.width.replace('px', ''));
        }
    }

    if (typeof this.minWidth == 'string') {
        if (this.minWidth.indexOf('px') !== -1) {
            this.minWidth = parseInt(this.minWidth.replace('px', ''));
        }
    }

    this.getChild(undefined, function (params, field, fieldName) {
        if (typeof fieldName !== 'undefined') {
            field._name = fieldName;
        }
    });
};
EupTableExtend.Header.prototype = {
    hide: function () {
        this.isHiden = true;
    },
    show: function () {
        this.isHiden = false;
    },
    clone: function () {
        var self = this;
        var field = {};
        for (var key in self) {
            field[key] = self[key];
        }
        return new EupTableExtend.Header(field);
    },
    isFieldEnable: function () {
        return this.disable !== true;
    },
    isFieldShow: function () {
        return this.isHiden !== true;
    },
    isFixedLeft: function () {
        return this.fixed_left || this.fixed === "left";
    },
    isFixedRight: function () {
        return this.fixed_right || this.fixed === "right";
    },
    isFixed: function () {
        return this.isFixedLeft() || this.isFixedRight();
    },
    isIncreaseField: function () {
        return this.increase_column === true;
        // return this.field._name === 'increase_column';
    },
    getChildrenColspan: function (field) {
        var self = this;
        if (typeof field === 'undefined') {
            field = self;
        }
        var colspan = 1;
        if (field.childrens) {
            colspan = 0;
            for (var i in field.childrens) {
                colspan += self.getChildrenColspan(field.childrens[i]);
            }
        }
        return colspan;
    },
    getFieldText: function (rawData) {
        if (rawData) {
            if (this.textStr) {
                var textStr = (typeof this.textStr === "function") ? this.textStr({
                    rawData: rawData
                }) : this.textStr;
                try {
                    var $textStr = $(textStr);
                    if ($textStr.length) {
                        return $textStr.text();
                    }
                } catch (e) {
                }
                return (typeof this.textStr === "function") ? textStr : this.textStr;
            } else if (this.textHtml) {
                return this.textHtml;
            } else if (this.text) {
                return MultiLanguageControllor.get(this.text, true);
            }
        } else {
            if (this.textStr) {
                var textStr = (typeof this.textStr === "function") ? this.textStr({
                    rawData: rawData
                }) : this.textStr;
                return '<span>' + textStr + '</span>';
            } else if (this.textHtml) {
                return this.textHtml;
            } else if (this.text) {
                return MultiLanguageControllor.get(this.text, false,true);
            }
        }
    },
    getChild: function (params, callback, field, fieldName) {
        var self = this;
        if (typeof field === 'undefined') {
            field = self;
        }
        if (field.childrens) {
            for (var childrenFieldName in field.childrens) {
                self.getChild(params, callback, field.childrens[childrenFieldName], childrenFieldName);
            }
        } else {
            callback(params, field, fieldName);
        }
    },
};