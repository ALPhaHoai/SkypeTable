EupTableExtend.MultiLanguageCell = function (value) {
    this.value = value;
};
EupTableExtend.MultiLanguageCell.prototype = {
    getValue: function (rawValue) {
        return MultiLanguageControllor.get(this.value, !!rawValue, null, true);
    },
};