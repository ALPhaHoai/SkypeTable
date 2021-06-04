var EupTableExtend = function (option) {
    this.selectedRow = null;
    this.selectedIndex = null;
    this.isInitialized = false;
    this.dragging = {
        grid_column: null,
        th: null,
        field: null,
        fieldName: null,
        lastXPosition: null,
        isColumnDrag: false,
        el_draggingClone: null,
    };
    this.delay_render_timeout = 1000;
    var formats = Eup.Format.getExportFormat(true) || {};
    this.export_float_format = formats.export_float_format;
    this.export_integer_format = formats.export_integer_format;
    this.export_currency_format = formats.export_currency_format;
    this.construct(option);
};
EupTableExtend.prototype = {
    field_original_index_name: '_original_index',
    field_index_name: '_index',
    td_field_name: '_field',
    group_id_field: '_group_id',
    group_name_field: '_group_name',
    removePrivateField: function (obj) {
        try {
            delete obj[this.field_original_index_name]
            delete obj[this.field_index_name]
            delete obj[this.td_field_name]
            delete obj[this.group_id_field]
            delete obj[this.group_name_field]
        } catch (e) {
            console.log(e);
        }
    },
    generateTdValue: function (current_data, field, rawValue, type, hookEvents) {
        var self = this;
        hookEvents = hookEvents || {};
        var value = current_data[field._name];
        var _value;
        if (typeof field.render === 'function') {
            value = field.render(value, current_data, field);
            if (rawValue) {
                value = self.removeHtmlTag(value);
            }
        } else {
            for (var key in self.hookEvents.hookTD) {
                if (typeof self.hookEvents.hookTD[key] === 'function') {
                    var hookArguments = {
                        current_data: current_data,
                        value: value,
                        rawValue: rawValue,
                        field: field,
                        type: type,
                    };
                    _value = self.hookEvents.hookTD[key].call(self, hookArguments);
                    if (_value === undefined || _value === null) {
                        continue
                    }

                    if (!Array.isArray(_value)) {
                        _value = [_value]
                    }
                    var temp_value = []
                    for (var i = 0; i < _value.length; i++) {
                        if (_value[i] instanceof EupTableExtend.EupBtn) {
                            if (typeof _value[i]._default.onClick === "function") {
                                var storeParameters = {
                                    id: uuidv4(),
                                    params: hookArguments,
                                    callback: _value[i]._default.onClick,
                                    _this: self,
                                    table: self,
                                }
                                _value[i]._default.__id = storeParameters.id
                                EupTableExtend.prototype.Event.events.push(storeParameters)
                            }
                            temp_value.push(_value[i].getValue(rawValue))
                            if (typeof hookEvents.onHookEupBtn === 'function') {
                                hookEvents.onHookEupBtn(temp_value);
                            }
                        } else if (_value[i] instanceof EupTableExtend.ImageCell) {
                            temp_value.push(_value[i].getValue(rawValue))
                        } else if (_value[i] instanceof EupTableExtend.HtmlCell) {
                            temp_value.push(_value[i].getValue(rawValue))
                        } else if (_value[i] instanceof EupTableExtend.MultiLanguageCell) {
                            temp_value.push(_value[i].getValue(rawValue))
                        } else if (_value[i] !== null && _value[i] !== undefined) {
                            temp_value.push(_value[i])
                        }
                    }

                    if (temp_value.length === 1 && typeof temp_value[0] === "number") {
                        value = temp_value[0]
                    } else {
                        value = temp_value.filter(function (item) {
                            return !Eup.Object.isFalsy(item)
                        }).join(" ").trim();
                    }
                }
            }
        }
        if (value === null || value === undefined) {
            value = '';
        }
        if (typeof value === 'string') {
            value = value.trim();
        }
        return value;
    },
    generateTd: function (opts) {
        //field, current_data, increase_column_value, i, _index, rawValue, inlineStyle
        if (!opts.field.isFieldEnable()) {
            return '';
        }

        var self = this;
        var hookArguments = {
            current_data: opts.current_data,
            field: opts.field,
            i: opts.i,
            _index: opts._index,
        };
        var tdAttr = {};
        if (typeof opts.rowspan === "number") {
            tdAttr.rowspan = opts.rowspan
        }
        var tdStyle = {};
        var tdSpanAttr = {};
        var tdSpanStyle = {};
        var tdClass = [];
        var tdSpanClass = [];
        var key;
        if (!opts.field.isIncreaseField()) {
            for (key in self.hookEvents.hookTDAttr) {
                if (typeof self.hookEvents.hookTDAttr[key] === 'function') {
                    Object.assign(tdAttr, self.hookEvents.hookTDAttr[key].call(self, hookArguments));
                }
            }

            for (key in self.hookEvents.hookTDStyle) {
                if (typeof self.hookEvents.hookTDStyle[key] === 'function') {
                    Object.assign(tdStyle, self.hookEvents.hookTDStyle[key].call(self, hookArguments));
                }
            }

            for (key in self.hookEvents.hookTDSpanAttr) {
                if (typeof self.hookEvents.hookTDSpanAttr[key] === 'function') {
                    Object.assign(tdSpanAttr, self.hookEvents.hookTDSpanAttr[key].call(self, hookArguments));
                }
            }

            for (key in self.hookEvents.hookTDSpanStyle) {
                if (typeof self.hookEvents.hookTDSpanStyle[key] === 'function') {
                    Object.assign(tdSpanStyle, self.hookEvents.hookTDSpanStyle[key].call(self, hookArguments));
                }
            }

            for (key in self.hookEvents.hookTDSpanClass) {
                if (typeof self.hookEvents.hookTDSpanClass[key] === 'function') {
                    var classArr = self.hookEvents.hookTDSpanClass[key].call(self, hookArguments);
                    if (Array.isArray(classArr) && classArr.length) {
                        tdSpanClass = tdSpanClass.concat(classArr);
                    }
                }
            }

        }


        tdAttr[self.td_field_name] = opts.field._name;

        //only add class for responsive mode
        if (self.isResponsive()) {
            if (opts.columnIndex === 0) {
                tdClass.push('first-item');
            }
            // if(opts.columnIndex>=self.setting.responsive.mobileShowColumns && opts.field._name !== 'Action'){
            if (($.inArray(opts.field._name, self.setting.responsive.mobileShowColumns) === -1) && opts.field._name !== 'Action') {
                tdClass.push('mobile-hide');
            } else {
                tdClass.push('mobile-column');
            }
            //tdAttr['data-title'] = opts.field._name;
            //tdAttr['data-tid-title'] = opts.field._name;

        }


        if (opts.inlineStyle) {
            tdStyle['text-align'] = opts.field._textAlign.getAlign(hookArguments);
        } else {
            tdClass.push(opts.field._textAlign.getClassName(hookArguments));
        }
        if (opts.field.myClass) {
            tdClass.push(opts.field.myClass);
        }

        if (opts.field.isHiden) {
            tdClass.push('column_hidden');
        }

        var value = opts.field.isIncreaseField() ? opts.increase_column_value : self.generateTdValue(opts.current_data, opts.field, opts.rawValue, opts.type, {
            onHookEupBtn: function (_value) {
                tdClass.push('eup-btn-col');
            },
        });

        //Add button explain for mobile
        if (self.isResponsive() && opts.columnIndex === 0) {
            value = '<span class="view-more-clumn-link"><i class="fa fa-plus-square-o"></i></span>' + value;
        }

        if (self.setting.fixedColumnLeft && opts.field.isFixedLeft()) {
            var width = EupTableExtend.Headers.prototype.getHeadersWidth(opts.prevFields);
            tdStyle.left = width + "px";
            tdAttr['fixed-column'] = 'left';
        }

        if (self.setting.fixedColumnRight && opts.field.isFixedRight()) {
            var width = EupTableExtend.Headers.prototype.getHeadersWidth(opts.nextFields);
            tdStyle.right = width + "px";
            tdAttr['fixed-column'] = 'right';
        }
        if (opts.type == 'export') {
            if (typeof value === 'number') {
                if (opts.exportStyle) {

                } else {
                    if (String(value).indexOf('.') !== -1 || String(value).indexOf(',') !== -1) {
                        opts.exportStyle = 'float';
                    } else {
                        opts.exportStyle = 'integer';
                    }
                }
            } else {
                opts.exportStyle = 'string';
            }
            switch (opts.exportStyle) {
                case 'float':
                    tdStyle['mso-number-format'] = "'" + self.export_float_format + "'";
                    break;
                case 'currency':
                    tdStyle['mso-number-format'] = "'" + self.export_currency_format + "'";
                    break;
                case 'integer':
                case 'number':
                    tdStyle['mso-number-format'] = "'" + self.export_integer_format + "'";
                    break;
                default:
                    tdStyle['mso-number-format'] = "'\@'";
                    break;
            }
        }

        //generate td for mobile-hide column
        if (self.isResponsive() && (tdClass.indexOf("mobile-hide") > -1)) {
            return '<td ' + Eup.HtmlHelper.generateClass(tdClass) + ' '
                + Eup.HtmlHelper.generateStyle(tdStyle) + ' '
                + Eup.HtmlHelper.generateAttributes(tdAttr) + '>'
                + '<span class="mobile-title">'
                + opts.field.name
                + '</span><span class="mobile-data">'
                + value
                + '</span></td>';
        }

        return '<td ' + Eup.HtmlHelper.generateClass(tdClass) + ' '
            + Eup.HtmlHelper.generateStyle(tdStyle) + ' '
            + Eup.HtmlHelper.generateAttributes(tdAttr) + '><span '
            + Eup.HtmlHelper.generateAttributes(tdSpanAttr) + ' '
            + Eup.HtmlHelper.generateClass(tdSpanClass) + ' '
            + Eup.HtmlHelper.generateStyle(tdSpanStyle) + ' >'
            + value
            + '</span></td>';
    },
    generateTbody: function (opts) {
        var _default = {
            fromSort: false,
            rawValue: false,
            inlineStyle: false,
            type: "",
            // paging: false,
        };
        Object.assign(_default, opts);

        var self = this;
        var tbody = '';
        var j = 0;
        var start_index = 0;
        var end_index = self.data.length;
        var isPaging = _default.paging !== undefined ? _default.paging : self.isPaging();
        if (isPaging) {
            start_index = self.pageSize * (self.setting.currentPage - 1);
            end_index = self.pageSize * self.setting.currentPage;
            if (end_index > self.data.length) {
                end_index = self.data.length;
            }
        }

        self.isSelectedRowDataInData = false;

        if (self.setting.sumUpConfig) {
            if (!self.setting.sumUpConfig.colspan) {
                self.setting.sumUpConfig._colspan = 0
                for (var k = 0; k < self.headers_data.length; k++) {
                    if ((self.headers_data[k].isHiden === true || self.headers_data[k].ignoreExport === true) && ["print", "export"].indexOf(_default.type) !== -1) {
                        // continue
                    } else {
                        if (self.setting.sumUpConfig.hasField(self.headers_data[k]._name)) {
                            break
                        } else {
                            self.setting.sumUpConfig._colspan++
                        }
                    }
                }
            }
        }

        var isGroupByField = !!self.setting.groupByField;

        function getNextRowspan(i, start_index, end_index, fieldKey) {
            var current_data = self.data[i][fieldKey]
            var j = i
            for (j = i; j < end_index; j++) {
                if (self.data[j][fieldKey] !== current_data) {
                    break
                }
            }
            return j - i
        }

        for (var i = start_index; i < end_index; i++) {
            var current_data = self.data[i];
            var prev_data = self.data[i - 1];
            var next_data = self.data[i + 1];
            if (self.setting.isEnableRowFunction && !self.setting.isEnableRow(current_data, i)) {
                continue;
            }
            var tds = '';
            var increase_column_value;
            if (self.setting.increase_column) {
                increase_column_value = j + 1;
                if (isPaging && self.setting.currentPage > 1) {
                    increase_column_value += (self.setting.currentPage - 1) * self.pageSize;
                }
            }
            var hookArguments = {
                current_data: current_data,
                i: i,
                rawValue: false,
            };

            var tdsMobileShow = [];
            var tdsMobileHide = [];
            for (var k = 0; k < self.headers_data.length; k++) {
                var field = self.headers_data[k];
                if ((field.isHiden === true || field.ignoreExport === true) && ["print", "export"].indexOf(_default.type) !== -1) {
                    // continue
                } else {
                    var rowspan = null;
                    if (field.groupRow === true) {
                        try {
                            if (i !== start_index && current_data[field._name] === prev_data[field._name]) {
                                continue
                            }
                        } catch (e) {
                        }
                        rowspan = getNextRowspan(i, start_index, end_index, field._name)
                    }
                    var prevFields = self.setting.fixedColumnLeft ? self.headers_data.slice(0, k) : [];
                    var nextFields = self.setting.fixedColumnRight ? self.headers_data.slice(k + 1) : [];
                    var strTd = self.generateTd({
                        field: field,
                        current_data: current_data,
                        increase_column_value: increase_column_value,
                        i: i,
                        rawValue: _default.rawValue,
                        inlineStyle: _default.inlineStyle,
                        exportStyle: (_default.type === "export" && field.exportStyle) ? field.exportStyle : '',
                        prevFields: prevFields,
                        nextFields: nextFields,
                        rowspan: rowspan,
                        columnIndex: k,
                        type: _default.type,
                    });
                    if (self.isResponsive()) {
                        //if(k>=self.setting.responsive.mobileShowColumns && field._name !== 'Action'){
                        if (($.inArray(field._name, self.setting.responsive.mobileShowColumns) === -1) && field._name !== 'Action') {
                            tdsMobileHide.push(strTd);
                        } else {
                            tdsMobileShow.push(strTd);
                        }
                    } else {
                        tds += strTd;
                    }
                }
            }
            if (self.isResponsive()) {
                var valueR = tdsMobileHide.join('').split('<td').join('<div').split('</td>').join('</div>');
                tds += tdsMobileShow.join('') + '</tr><tr class="mobile-hide"><td colspan="' + tdsMobileShow.length + '">' + valueR + '</td></tr>';
            }


            //Generate tr attributes
            var trAttr = {};
            var trStyle = {};
            var trClass = [];
            var key;
            for (key in self.hookEvents.hookTRAttr) {
                if (typeof self.hookEvents.hookTRAttr[key] === 'function') {
                    var hookTRAttrObj = self.hookEvents.hookTRAttr[key].call(self, hookArguments);
                    Object.assign(trAttr, hookTRAttrObj);
                }
            }
            for (key in self.hookEvents.hookTRStyle) {
                if (typeof self.hookEvents.hookTRStyle[key] === 'function') {
                    var hookTRStyleObj = self.hookEvents.hookTRStyle[key].call(self, hookArguments);
                    Object.assign(trStyle, hookTRStyleObj);
                }
            }
            for (key in self.hookEvents.hookTRClass) {
                if (typeof self.hookEvents.hookTRClass[key] === 'function') {
                    var hookTRClassArr = self.hookEvents.hookTRClass[key].call(self, hookArguments);
                    if (Array.isArray(hookTRClassArr) && hookTRClassArr.length) {
                        trClass = trClass.concat(hookTRClassArr);
                    }
                }
            }

            trAttr[self.field_index_name] = current_data[self.field_index_name];
            trAttr[self.field_original_index_name] = current_data[self.field_original_index_name];
            if (typeof current_data[self.group_id_field] !== 'undefined') {
                trAttr._group = current_data[self.group_id_field];
            }

            if (self.selectedRowData) {
                if (_default.fromSort) {
                    if (self.selectedIndex === current_data[self.field_original_index_name]) {
                        trClass.push('active');
                        self.isSelectedRowDataInData = true;
                        self.selectedRowData = current_data;
                    }
                } else {
                    if (self.isSameRowData(current_data, self.selectedRowData)) {
                        trClass.push('active');
                        self.isSelectedRowDataInData = true;
                        self.selectedRowData = current_data;
                    }
                }
            }


            if (isGroupByField && (i === start_index || (prev_data !== undefined && prev_data[self.group_id_field] !== undefined) && current_data[self.group_id_field] !== prev_data[self.group_id_field])) {
                var trGroupBtnAttr = {
                    _group: current_data[self.group_id_field],
                };
                var trGroupBtnStyle = {};
                var trGroupBtnClass = ['group_btn'];
                var unGroupItem = false;
                for (key in self.hookEvents.hookTRGroupBtnAttr) {
                    if (typeof self.hookEvents.hookTRGroupBtnAttr[key] === 'function') {
                        var attrlist = self.hookEvents.hookTRGroupBtnAttr[key].call(self, hookArguments);
                        if (attrlist.ungroup !== undefined && attrlist.ungroup === true) {
                            unGroupItem = true;
                        }
                        Object.assign(trGroupBtnAttr, self.hookEvents.hookTRGroupBtnAttr[key].call(self, hookArguments));
                    }
                }
                for (key in self.hookEvents.hookTRGroupBtnStyle) {
                    if (typeof self.hookEvents.hookTRGroupBtnStyle[key] === 'function') {
                        Object.assign(trGroupBtnStyle, self.hookEvents.hookTRGroupBtnStyle[key].call(self, hookArguments));
                    }
                }
                for (key in self.hookEvents.hookTRGroupBtnClass) {
                    if (typeof self.hookEvents.hookTRGroupBtnClass[key] === 'function') {
                        var hookTrGroupBtnClassArr = self.hookEvents.hookTRGroupBtnClass[key].call(self, hookArguments);
                        if (Array.isArray(hookTrGroupBtnClassArr) && hookTrGroupBtnClassArr.length) {
                            trGroupBtnClass = trGroupBtnClass.concat(hookTrGroupBtnClassArr);
                        }
                    }
                }

                var groupTitle = current_data[self.group_name_field];
                var _groupTitle = undefined;
                for (key in self.hookEvents.hookTRGroupBtn) {
                    if (typeof self.hookEvents.hookTRGroupBtn[key] === 'function') {
                        _groupTitle = self.hookEvents.hookTRGroupBtn[key].call(self, hookArguments)
                    }
                }
                if (_groupTitle !== undefined && _groupTitle !== null) {
                    groupTitle = _groupTitle
                }
                if (!unGroupItem) {
                    tbody += ('<tr ' + Eup.HtmlHelper.generateAttributes(trGroupBtnAttr) + ' '
                        + Eup.HtmlHelper.generateStyle(trGroupBtnStyle) + ' '
                        + Eup.HtmlHelper.generateClass(trGroupBtnClass) + ' '
                        + '><td colspan="' + self.totalFirstTrField + '" ><span><span class="btn-expand"><i class="fa fa-minus-square-o"></i><i class="fa fa-plus-square-o"></i></span>&nbsp;' + groupTitle + '</span></td></tr>');
                }
            }

            tbody += '<tr ' + Eup.HtmlHelper.generateClass(trClass) + ' ' + Eup.HtmlHelper.generateStyle(trStyle) + ' ' + Eup.HtmlHelper.generateAttributes(trAttr) + '>' + tds + '</tr>';

            if (self.setting.sumUpConfig) {
                var sumupRow = false
                if (self.setting.groupByField) {
                    if (next_data !== undefined && next_data[self.group_id_field] !== undefined && current_data[self.group_id_field] !== next_data[self.group_id_field]) {
                        sumupRow = true;
                    }
                }

                if (i === (self.setting.sumUpConfig.endPageRow ? end_index : self.data.length) - 1) {
                    sumupRow = true
                }

                if (sumupRow) {
                    var groupList = []
                    if (self.setting.groupByField) {
                        loopGroupList: for (var k = 0; k < self.groupList.length; k++) {
                            loopValueList: for (var l = 0; l < self.groupList[k].list.length; l++) {
                                if (self.groupList[k].list[l][self.field_original_index_name] === current_data[self.field_original_index_name]) {
                                    groupList = self.groupList[k]
                                    break loopGroupList;
                                }
                            }
                        }
                    }

                    var colspan = self.setting.sumUpConfig.colspan || self.setting.sumUpConfig._colspan
                    var sumupRowClass = ["sumup-row"]
                    var sumupRowStyle = {}
                    var sumupRowTds = ""
                    if (_default.inlineStyle && !self.setting.sumUpConfig.notbold) {
                        sumupRowStyle["font-weight"] = "bold"
                    }

                    if (colspan > 0) {
                        var sumupRowTitle = MultiLanguageControllor.get("Total")
                        for (key in self.hookEvents.hookSumupRowTitle) {
                            var _sumupRowTitle = self.hookEvents.hookSumupRowTitle[key].call(self, hookArguments)
                            if (!Eup.Object.isFalsy(_sumupRowTitle)) {
                                sumupRowTitle = _sumupRowTitle
                            }
                        }


                        var sumupRowTdStyle = {}
                        var sumupRowTdClass = []
                        var sumupRowTdAttr = {
                            colspan: colspan,
                        }
                        if (_default.inlineStyle) {
                            sumupRowTdStyle['text-align'] = 'center';
                        } else {
                            sumupRowTdClass.push('text-center');
                        }
                        sumupRowTds += "<td " + Eup.HtmlHelper.generateClass(sumupRowTdClass) + " " + Eup.HtmlHelper.generateStyle(sumupRowTdStyle) + "  " + Eup.HtmlHelper.generateAttributes(sumupRowTdAttr) + "  ><span>" + sumupRowTitle + "</span></td>"
                    }

                    var _count = 0
                    for (var k = 0; k < self.headers_data.length; k++) {
                        var _field = self.headers_data[k];
                        if ((_field.isHiden === true || _field.ignoreExport === true) && ["print", "export"].indexOf(_default.type) !== -1) {
                            // continue
                        } else {
                            if (++_count > colspan) {
                                var value = ""
                                var __field = self.setting.sumUpConfig.getField(_field._name);
                                if (__field !== undefined) {
                                    value = self.setting.sumUpConfig.getInitialValue(__field);
                                    var reduce = self.setting.sumUpConfig.getReduce(__field);
                                    var format = self.setting.sumUpConfig.getFormat(__field);
                                    if (self.setting.groupByField) {
                                        for (var l = 0; l < groupList.list.length; l++) {
                                            value = reduce(value, groupList.list[l][_field._name])
                                        }
                                    } else {
                                        for (var l = 0; l < self.data.length; l++) {
                                            value = reduce(value, self.data[l][_field._name])
                                        }
                                    }
                                    if (typeof format === "function") {
                                        value = format(value, __field, false);
                                    }
                                }
                                var tdStyle = {}
                                var tdClass = []
                                if (_default.inlineStyle) {
                                    tdStyle['text-align'] = _field._textAlign.align;
                                } else {
                                    tdClass.push(_field._textAlign.getClassName());
                                }
                                sumupRowTds += '<td ' + Eup.HtmlHelper.generateStyle(tdStyle) + '  ' + Eup.HtmlHelper.generateClass(tdClass) + '  ><span>' + value + '</span></td>'
                            }
                        }
                    }
                    tbody += ('<tr ' + Eup.HtmlHelper.generateStyle(sumupRowStyle) + ' ' + Eup.HtmlHelper.generateClass(sumupRowClass) + '>' + sumupRowTds + '</tr>');
                }

            }
            j++;
        }

        return tbody;
    },
    generateThead: function (opts) {
        var _default = {
            byPercentage: false,
            type: "",
        };
        Object.assign(_default, opts);
        var self = this;

        function renderTh(field, isResizeable, columnIndex) {
            var value = field.getFieldText();
            var thStyle = {};
            var thAttr = {};
            var thClass = [field._name, field.myClass]; //add class for th
            var thContainerStyle = {};
            var thContainerAttr = {};
            var thContainerClass = ['th-container'];
            var key;
            var hookArguments = {
                value: value,
                field: field,
            };

            for (key in self.hookEvents.hookThStyle) {
                if (typeof self.hookEvents.hookThStyle[key] === 'function') {
                    Object.assign(thStyle, self.hookEvents.hookThStyle[key].call(self, hookArguments));
                }
            }
            for (key in self.hookEvents.hookThAttr) {
                if (typeof self.hookEvents.hookThAttr[key] === 'function') {
                    Object.assign(thAttr, self.hookEvents.hookThAttr[key].call(self, hookArguments));
                }
            }
            for (key in self.hookEvents.hookThClass) {
                if (typeof self.hookEvents.hookThClass[key] === 'function') {
                    var thClassArr = self.hookEvents.hookThClass[key].call(self, hookArguments);
                    if (Array.isArray(thClassArr)) {
                        thClass = thClass.concat(thClassArr);
                    }
                }
            }

            for (key in self.hookEvents.hookThContainerStyle) {
                if (typeof self.hookEvents.hookThContainerStyle[key] === 'function') {
                    Object.assign(thContainerStyle, self.hookEvents.hookThContainerStyle[key].call(self, hookArguments));
                }
            }
            for (key in self.hookEvents.hookThContainerAttr) {
                if (typeof self.hookEvents.hookThContainerAttr[key] === 'function') {
                    Object.assign(thContainerAttr, self.hookEvents.hookThContainerAttr[key].call(self, hookArguments));
                }
            }
            for (key in self.hookEvents.hookThContainerClass) {
                if (typeof self.hookEvents.hookThContainerClass[key] === 'function') {
                    var thContainerClassArr = self.hookEvents.hookThContainerClass[key].call(self, hookArguments);
                    if (Array.isArray(thContainerClassArr)) {
                        thContainerClass = thContainerClass.concat(thContainerClassArr);
                    }
                }
            }
            if (typeof field.minWidth !== 'undefined') {
                thStyle['min-width'] = field.minWidth + 'px';
            }

            if (field.sortable !== undefined ? field.sortable : self.setting.sortable) {
                thClass.push('sortable');
            }
            if (field.isHiden) {
                thClass.push('column_hidden');
            }
            thAttr[self.td_field_name] = field._name;
            if (self.setting.sortBy.order && self.setting.sortBy.field === field._name) {
                thAttr.sortType = self.setting.sortBy.order;
            }

            if (self.colspan_rowspan_header) {
                if (typeof field.colspan !== 'undefined') {
                    thAttr.colspan = field.colspan;
                }
                if (typeof field.rowspan !== 'undefined') {
                    thAttr.rowspan = field.rowspan;
                }
            }

            if (typeof field.width !== 'undefined' && !self.isResponsive()) {
                if (_default.byPercentage) {
                    thAttr.width = field.width / self.tableWidth * 100 + '%';
                } else {
                    thAttr.width = field.width + 'px';
                }
            }

            if (field.isFixedLeft()) {
                thStyle.left = self.headers.getPrevHeadersWidth(field) + "px";
                thAttr['fixed-column'] = 'left';
            } else if (field.isFixedRight()) {
                thStyle.right = self.headers.getNextHeadersWidth(field) + "px";
                thAttr['fixed-column'] = 'right';
            }

            var grid_column_html = isResizeable ? self.grid_column_html : "";
            //if(columnIndex>=self.setting.responsive.mobileShowColumns && field._name !== 'Action' && self.isResponsive()){
            if (($.inArray(field._name, self.setting.responsive.mobileShowColumns) === -1) && field._name !== 'Action' && self.isResponsive()) {
                thClass.push('mobile-hide');
            } else {
                return ('<th ' + Eup.HtmlHelper.generateClass(thClass) + ' '
                    + Eup.HtmlHelper.generateStyle(thStyle) + ' '
                    + Eup.HtmlHelper.generateAttributes(thAttr) + '>' +
                    '<div ' + Eup.HtmlHelper.generateClass(thContainerClass) + ' '
                    + Eup.HtmlHelper.generateStyle(thContainerStyle) + ' '
                    + Eup.HtmlHelper.generateAttributes(thContainerAttr) + ' ' +
                    '>' + value + '</div>' + grid_column_html + '</th>');
            }

        }

        var thead = '';
        for (var i = 0; i < self.headers.headers.length; i++) {
            var thead_tr = self.headers.headers[i];
            var isResizeable = i === 0;
            var tr = '<tr>';
            for (var j in thead_tr) {
                var field = thead_tr[j];
                if ((field.isHiden === true || field.ignoreExport === true) && ["print", "export"].indexOf(_default.type) !== -1) {
                    // continue
                } else {
                    if (self.colspan_rowspan_header && typeof field.rowspan === 'undefined') {
                        field.rowspan = field.childrens ? 1 : (self.headers.headers.length - (field.parent ? field.parent.length : 0));
                    }
                    tr += renderTh(field, isResizeable, j);
                }
            }
            tr += '</tr>';
            thead += tr;
        }

        return thead;
    },
    getPageSize: function () {
        return Eup.Layout.isMobileSize() ? this.setting.pageSizeMobile : this.setting.pageSize;
    },
    isPaging: function () {
        return this.data.length > this.pageSize;
    },
    initPaging: function () {
        var self = this;
        if (self.isPaging()) {
            self.setting.container.addClass('eup-paging-table');

            if (!self.setting.container_pagination) {
                self.setting.container_pagination = self.findorappend(self.setting.container, '.pagination', '<ul class="pagination"></ul>');
                if (self.setting.bottomToolbarContainer && self.setting.bottomToolbarContainer.length) {
                    self.setting.bottomToolbarContainer.before(self.setting.container_pagination)
                }
            }

            var htmlPaging = '';
            var page_item = [];
            var m = parseInt(self.data.length / self.pageSize);
            if (self.setting.currentPage) {
                var totalPage = (self.data.length % self.pageSize === 0) ? m : m + 1;
            }
            if (self.setting.currentPage > 1) {
                htmlPaging += '<li data-page="' + (self.setting.currentPage - 1) + '" class="page-item page-item-click">&laquo;</li>';
            }

            for (var i = 1; i <= totalPage; i++) {
                var cl = (i === self.setting.currentPage) ? 'active' : 'page-item-click';
                if (i === 1) {
                    htmlPaging += '<li data-page="' + i + '" class="page-item ' + cl + '">' + i + '</li>';
                    if (self.setting.currentPage - self.setting.stepPage > 1 && Math.abs(self.setting.currentPage - i) > 2) {
                        htmlPaging += '<li class="page-item disabled">...</li>';
                    }
                } else if (i === totalPage) {
                    if (self.setting.currentPage + self.setting.stepPage < totalPage && Math.abs(self.setting.currentPage - i) > 2) {
                        htmlPaging += '<li class="page-item disabled">...</li>';
                    }
                    htmlPaging += '<li data-page="' + i + '" class="page-item ' + cl + '">' + i + '</li>';
                } else if (i === self.setting.currentPage) {
                    htmlPaging += '<li data-page="' + i + '" class="page-item ' + cl + '">' + i + '</li>';
                } else if (i < self.setting.currentPage) {
                    if (i + self.setting.stepPage >= self.setting.currentPage) {
                        htmlPaging += '<li data-page="' + i + '" class="page-item ' + cl + '">' + i + '</li>';
                    }
                } else {
                    if (i - self.setting.stepPage <= self.setting.currentPage) {
                        htmlPaging += '<li data-page="' + i + '" class="page-item ' + cl + '">' + i + '</li>';
                    }
                }
            }
            if (self.setting.currentPage < totalPage) {
                htmlPaging += '<li data-page="' + (self.setting.currentPage + 1) + '" class="page-item page-item-click">&raquo;</li>';
            }
            self.setting.container_pagination.html(htmlPaging);
        } else {
            self.setting.container.removeClass('eup-paging-table');
        }
    },
    construct: function (option) {
        if (!option) {
            return;
        }
        var self = this;
        self.hookEvents = {
            hookTD: {},
            hookTDAttr: {},
            hookTDStyle: {},
            hookTDClass: {},

            hookTDSpanAttr: {},
            hookTDSpanStyle: {},
            hookTDSpanClass: {},

            hookTRGroupBtn: {},
            hookTRGroupBtnAttr: {},
            hookTRGroupBtnStyle: {},
            hookTRGroupBtnClass: {},

            hookTRAttr: {},
            hookTRStyle: {},
            hookTRClass: {},

            hookThStyle: {},
            hookThAttr: {},
            hookThClass: {},

            hookThContainerStyle: {},
            hookThContainerAttr: {},
            hookThContainerClass: {},

            hookSumupRowTitle: {},

            onRowSelected: {},
            onRowDblClick: {},
            onInitialized: {},
        };

        self.filterCriteria = {};

        self.setting = {
            order: null,//object, array
            fields: null,
            data: [],
            class: '',
            columnResize: true,
            pageSize: 300,
            pageSizeMobile: 200,
            currentPage: 1,
            stepPage: 1,
            id: '',
            reportHeader: null,
            sortable: true,
            sortBy: {
                field: '', //'OrderItem_ID'
                order: 'asc', //asc, desc
            },
            uniqueField: null,//'_all', string, array, object
            fixedHeader: false,//header immuatable
            bottomToolbar: null,
            addFilterBlock: null,
            increase_column: null,//true, false, object
            isEnableRow: null,
            isEnableRowBool: false,
            groupByField: null,//field name, obj {fieldName: fieldName, compareFn: function(){}}
            groupByFieldType: 'all',//near, all,
            /*
            * near: group row near by has the same value in field groupByField
            * all: group all row in table has the same value in field groupByField
            * */

            sumUpConfig: {
                notbold: false,
                fields: [],
                colspan: null,
                _colspan: null,
            },
            /*
            * ['Name', 'Id']
            * [{
            *   field: 'Name',
            *   initialValue: 0
            * reduce: function (accumulator, currentValue) {
                    if (!isNaN(currentValue)) {
                        accumulator += currentValue
                    }
                    return accumulator
                }
            * },
            * {
            *   field: 'Id',
            *   type: 'Date'
            * }]
            * */
            title: null,
            titleMultiLang: null,
            onTableList: false,
            fixedColumnLeft: false,
            fixedColumnRight: false,
            multiline: false,
            contextMenu: false,
            contextMenuItem: [],

            isResponsive: false,
            responsive: {
                mobileShowColumns: [],
            }
        };

        self.euploaders = {};

        self.setting.isEnableRowFunction = typeof self.setting.isEnableRow === 'function';
        self.maxRowsDisplay = 50;
        Object.assign(self.setting, option);
        EupTableExtend.prototype.MultiTable.addTable(self);
        self.setting.class = 'eup-table-extend-container eup-table-fixed-header eup-table-header-black eup-table-nowrap' + self.setting.class;
        self.setting.class += ' ' + EUP_DEALER + ' ';
        if (self.isResponsive()) {
            self.setting.class += ' eup-table-extend-mobile';
        }

        for (var key in self.hookEvents) {
            if (typeof self.setting[key] === 'function') {
                self.hookEvents[key]['init hook'] = self.setting[key];
            }
        }

        self.initHeader();

        if (self.setting.uniqueField) {
            if (self.setting.uniqueField === '_all') {
                self.isSameRowData = function (item1, item2) {
                    for (var key in item1) {
                        if (!key.startsWith('_') && item1[key] !== item2[key]) {
                            return false;
                        }
                    }
                    return true;
                };
            } else {
                if (typeof self.setting.uniqueField === 'string' || typeof self.setting.uniqueField === 'number') {
                    self.setting.uniqueField = [self.setting.uniqueField];
                }
                self.isSameRowData = function (item1, item2) {
                    for (var i in self.setting.uniqueField) {
                        if (item1[self.setting.uniqueField[i]] !== item2[self.setting.uniqueField[i]]) {
                            return false;
                        }
                    }
                    return true;
                };
            }
        } else {
            self.isSameRowData = function (item1, item2) {
                for (var key in item1) {
                    if ([self.field_original_index_name, self.field_index_name].indexOf(key) === -1
                        && item1[key] !== item2[key]) {
                        return false;
                    }
                }
                return true;
            };
        }

        self.initData();

        self.grid_column_html = self.setting.columnResize ? '<div class="grid-clumn"></div>' : '';
        self.tableWidth = self.headers.getFirstTrFieldTotalWidth();
        self.pageSize = self.getPageSize();
        if (self.setting.sumUpConfig && Array.isArray(self.setting.sumUpConfig.fields) && self.setting.sumUpConfig.fields.length) {
            if (typeof self.setting.sumUpConfig.hookSumupRowTitle === "function") {
                self.hookEvents.hookSumupRowTitle['init hook'] = self.setting.sumUpConfig.hookSumupRowTitle
            }

            self.setting.sumUpConfig = new EupTableExtend.SumupFieldConfig(self.setting.sumUpConfig);
        } else {
            delete self.setting.sumUpConfig;
        }
        self.isConstructed = true;
    },
    initHeader: function (fields) {
        var self = this;
        self.headers = new EupTableExtend.Headers(fields || self.setting.fields);
        if (self.headers.headers.length > 1) {
            self.colspan_rowspan_header = true;
        }
        var increase_column = {
            width: self.isResponsive() ? '80' : '50',
            text: 'SerialNumber',
            increase_column: true,
            exportStyle: 'integer',
            _name: 'increase_column',
            sortable: false,
        };

        if (self.setting.increase_column) {
            if (self.setting.increase_column === true) {
                self.setting.increase_column = increase_column;
                self.setting.increase_column._textAlign = new EupTableExtend.TextAlign();
            } else if (typeof self.setting.increase_column === 'object') {
                self.setting.increase_column = Object.assign(increase_column, self.setting.increase_column);
                self.setting.increase_column._textAlign = new EupTableExtend.TextAlign(self.setting.increase_column);
            }
            self.headers.add(self.setting.increase_column);
        }

        self.totalFirstTrField = self.headers.getFirstTrFieldLength();

        self.setting.fixedColumnLeft = false;
        self.setting.fixedColumnRight = false;
        for (var i = 0; i < self.headers.headers.length; i++) {
            for (var j = 0; j < self.headers.headers[i].length; j++) {
                if (self.headers.headers[i][j].isFixedLeft()) {
                    self.setting.fixedColumnLeft = true;
                } else if (self.headers.headers[i][j].isFixedRight()) {
                    self.setting.fixedColumnRight = true;
                }
            }
        }

        if (self.setting.fixedColumnLeft || self.setting.fixedColumnRight) {
            //Move all fixed left header to top/start of fields
            //Move all fixed right header to bottom/end of fields
            for (var i = 0; i < self.headers.headers.length; i++) {
                self.headers.headers[i].sort(function (field1, field2) {
                    var valueI = field1.isFixedLeft() ? -1 : (field1.isFixedRight() ? 1 : 0);
                    var valueJ = field2.isFixedLeft() ? -1 : (field2.isFixedRight() ? 1 : 0);
                    return valueI - valueJ;
                });
            }
        }


        self.headers_data = self.headers.getHeadersData();
        self.tableWidth = self.headers.getFirstTrFieldTotalWidth();
    },
    indexData: function () {
        var self = this;
        for (var i = 0; i < self.data.length; i++) {
            self.data[i][self.field_index_name] = i;
        }
    },
    initData: function (data) {
        var self = this;

        data = data || self.setting.data
        self.data = []
        self.data_origin = []
        var groupId = 0;
        self.setGroupList([]);
        var groupByFieldString = typeof self.setting.groupByField === "string";
        var groupByFieldFunction = typeof self.setting.groupByField === "function";
        for (var i = 0; i < data.length; i++) {
            var row = {}
            var originRow = {}
            for (var key in data[i]) {
                row[key] = data[i][key]
                originRow[key] = data[i][key]
            }
            row[self.field_original_index_name] = i;
            row[self.field_index_name] = i;
            originRow[self.field_original_index_name] = i;
            originRow[self.field_index_name] = i;
            self.data.push(row)
            self.data_origin.push(originRow)

            if (groupByFieldString) {
                var _groupName = row[self.setting.groupByField]
                var _groupId = undefined
                for (var j = 0; j < self.groupList.length; j++) {
                    if (self.groupList[j].name === _groupName) {
                        _groupId = self.groupList[j].id
                        self.groupList[j].list.push(originRow)
                        break
                    }
                }
                if (typeof _groupId === "undefined") {
                    _groupId = groupId++
                    self.groupList.push({
                        id: _groupId,
                        name: _groupName,
                        list: [originRow],
                    })
                }
                row[self.group_id_field] = _groupId;
                row[self.group_name_field] = _groupName;
                originRow[self.group_id_field] = _groupId;
                originRow[self.group_name_field] = _groupName;
            } else if (groupByFieldFunction) {
                var groupInfo = self.setting.groupByField(data[i]);
                if (typeof groupInfo.id === "undefined") {
                    for (var j = 0; j < self.groupList.length; j++) {
                        if (self.groupList[j].name === groupInfo.name) {
                            groupInfo.id = self.groupList[j].id
                            self.groupList[j].list.push(originRow)
                            break
                        }
                    }
                    if (typeof groupInfo.id === "undefined") {
                        groupInfo.id = groupId++
                        self.groupList.push({
                            id: groupInfo.id,
                            name: groupInfo.name,
                            list: [originRow],
                        })
                    }
                } else {
                    var found = false
                    for (var j = 0; j < self.groupList.length; j++) {
                        if (self.groupList[j].id === groupInfo.id) {
                            self.groupList[j].list.push(originRow)
                            found = true
                            break
                        }
                    }
                    if (found === false) {
                        self.groupList.push({
                            id: groupInfo.id,
                            name: groupInfo.name,
                            list: [originRow],
                        })
                    }
                }

                row[self.group_id_field] = groupInfo.id;
                row[self.group_name_field] = groupInfo.name;
                originRow[self.group_id_field] = groupInfo.id;
                originRow[self.group_name_field] = groupInfo.name;
            }
        }

        var stringCompareFun = self.getStringCompareFun();
        if (self.setting.sortable && this.setting.sortBy.field && self.setting.sortBy.order) {
            var reverse = self.setting.sortBy.order === 'desc' ? -1 : 1;
            // var issortByGroup = !!(self.setting.groupByField && self.setting.groupByField !== self.setting.sortBy.field)
            self.data.sort(function (item1, item2) {
                var item1Value = item1[self.setting.sortBy.field];
                var item2Value = item2[self.setting.sortBy.field];
                var typeOfItem1 = typeof item1Value
                var typeOfItem2 = typeof item2Value
                if (typeOfItem1 === "number" && typeOfItem2 === "number") {
                    return reverse * (item1Value - item2Value)
                }
                if (typeOfItem1 === "string" && typeOfItem2 === "string") {
                    return reverse * stringCompareFun(item1Value, item2Value)
                }

                if (typeOfItem1 === "number" || typeOfItem1 === "string") {
                    return reverse
                }
                if (typeOfItem2 === "number" || typeOfItem2 === "string") {
                    return -reverse
                }
                return 0
            })
            //index data after sort
            self.indexData();

        } else {

        }

        self.sortGroupListByData()
        self.sortByGroup()
    },
    sortGroupListByData: function () {
        var self = this

        var newGroupList = []
        self.data.forEach(function (item) {

            var groupId = item[self.group_id_field];

            for (var i = 0; i < newGroupList.length; i++) {
                if (newGroupList[i].id === groupId) {
                    return
                }
            }

            for (var i = 0; i < self.groupList.length; i++) {
                if (self.groupList[i].id === groupId) {
                    newGroupList.push(self.groupList[i])
                    return
                }
            }
        })

        self.setGroupList(newGroupList)

    },

    setGroupList: function (groupList) {
        var self = this
        self.groupList = groupList
        self.groupListOrder = {}
        for (var i = 0; i < self.groupList.length; i++) {
            self.groupListOrder[self.groupList[i].id] = i
        }
    },

    sortByGroup: function () {
        var self = this

        if (self.setting.groupByField) {
            if (typeof self.setting.groupByFieldSort === "function") {
                self.data.sort(function (item1, item2) {
                    var order = self.groupListOrder[item1[self.group_id_field]] - self.groupListOrder[item2[self.group_id_field]]
                    if (order === 0) {
                        return self.setting.groupByFieldSort(item1, item2)
                    } else {
                        return order
                    }
                })
            } else {
                self.data.sort(function (item1, item2) {
                    return self.groupListOrder[item1[self.group_id_field]] - self.groupListOrder[item2[self.group_id_field]]
                })
            }
            self.indexData();
        }
    },
    doFilter: function () {
        var self = this;
        var filterCriteria = function (row) {
            for (var key in self.filterCriteria) {
                if (!self.filterCriteria[key](row)) {
                    return false;
                }
            }
            return true;
        };

        self.data = self.data_origin.filter(filterCriteria);
        for (var i = 0; i < self.data.length; i++) {
            self.data[i][self.field_original_index_name] = i;
            self.data[i][self.field_index_name] = i;
        }
        if (self.setting.sortable && this.setting.sortBy.field && self.setting.sortBy.order) {
            Eup.Array.sortOn(self.data, self.setting.sortBy.field, self.setting.sortBy.order === 'desc', false);
            for (var i = 0; i < self.data.length; i++) {
                self.data[i][self.field_index_name] = i;
            }
        }
        self.renderTable();
        self.scrollToFirstRow();
    },
    cleanFilterCriteria: function () {
        var self = this;
        for (var key in self.filterCriteria) {
            if (typeof self.filterCriteria[key] !== 'function') {
                delete self.filterCriteria[key]
            }
        }
    },
    addFilterCriteria: function (criteria) {
        var self = this;
        var criteria_sample = {
            filter_by_status: function (row) {
                return row.status === 1;
            },
            filter_by_name: function (row) {
                return row.name === "xx";
            },
        };
        for (var key in criteria) {
            self.filterCriteria[key] = criteria[key];
        }
        self.cleanFilterCriteria();
        self.doFilter();
    },
    removeFilterCriteria: function (criteria) {
        var self = this;

        if (typeof criteria === 'string') {
            delete self.filterCriteria[criteria];
        } else if (Array.isArray(criteria)) {
            for (var i = 0; i < criteria.length; i++) {
                delete self.filterCriteria[criteria[i]];
            }
        } else {//object
            for (var key in criteria) {
                delete self.filterCriteria[key];
            }
        }

        self.cleanFilterCriteria();
        self.doFilter();
    },
    init: function (option) {
        var self = this;
        self.construct(option);
        if (self.isInitialized === true) {
            self.Event.clear(this)
        }

        self.setting.container_table = document.getElementById(self.setting.id)
        self.selectedRow = null;
        self.selectedIndex = null;
        self.isInitialized = true;

        if (self.setting.container_table.length) {
            /*
            * '#' + self.setting.id + '_container'
            *   .eup-report-header
            *   .eup-table-extend-wrap
            *       .sticky-thead-wrap
            *           table.sticky-thead
            *       .eup-table-extend-wrap-table
            *           table
            *   .pagination
            * */
            self.setting.container = LightDom.parents(self.setting.container_table, '#' + self.setting.id + '_container')
            if (!self.setting.container) {
                self.setting.container = document.createElement("div")
                self.setting.container.setAttribute("id", `${self.setting.id}_container`)
                self.setting.container_table.insertAdjacentElement('afterend', self.setting.container);

                self.setting.container_wrap = document.createElement("div")
                self.setting.container_wrap.setAttribute("class", "eup-table-extend-wrap")
                self.setting.container.insertBefore(self.setting.container_wrap, self.setting.container.firstChild);

                self.setting.container_wrap_table = document.createElement("div")
                self.setting.container_wrap_table.setAttribute("class", "eup-table-extend-wrap-table")
                self.setting.container_wrap.insertBefore(self.setting.container_wrap_table, self.setting.container_wrap.firstChild);
                self.setting.container_wrap_table.insertBefore(self.setting.container_table, self.setting.container_wrap_table.firstChild);
            } else {
                self.setting.container_wrap = self.setting.container.querySelector(".eup-table-extend-wrap");
                self.setting.container_wrap_table = self.setting.container.querySelector(".eup-table-extend-wrap-table");
            }
        } else {
            self.setting.container = document.getElementById(self.setting.id + '_container');
            if (self.setting.container) {
                const tableExtendWrapClass = "eup-table-extend-wrap"
                const tableExtendWrap = document.createElement("div")
                tableExtendWrap.setAttribute("class", tableExtendWrapClass)
                self.setting.container_wrap = LightDom.findorappend(self.setting.container, '.' + tableExtendWrapClass, tableExtendWrap)

                const tableExtendWrapTableClass = "eup-table-extend-wrap-table"
                const tableExtendWrapTable = document.createElement("div")
                tableExtendWrap.setAttribute("class", tableExtendWrapClass)
                self.setting.container_wrap_table = LightDom.findorappend(self.setting.container_wrap, '.' + tableExtendWrapClass, tableExtendWrap)

                const containerTable = document.createElement("table")
                containerTable.setAttribute("id", self.setting.id)
                self.setting.container_table = LightDom.findorappend(self.setting.container_wrap_table, '#' + self.setting.id, tableExtendWrap)
            } else {
                console.log('invalid table id');
                return;
            }
        }

        self.setting.container_table.html('<thead></thead><tbody></tbody>');
        self.setting.class.replace(/\s{2,}/g, ' ').split(" ").forEach(_class => self.setting.container.classList.add(_class))
        self.renderTable();
        self.renderBottomToolbar();
        self.renderFilterBlock();
        self.bindEvent();

        for (var key in self.hookEvents.onInitialized) {
            if (typeof self.hookEvents.onInitialized[key] === 'function') {
                self.hookEvents.onInitialized[key].call(self);
            }
        }

        if (self.setting.columnResize) {
            self.dragging.el_draggingClone = self.findorappend(self.setting.container_wrap_table, ".JColResizer", '<div class="JColResizer" style=""></div>');
        }

        if (self.setting.multiline) {
            self.setting.container.addClass("multiline");
        } else {
            self.setting.container.removeClass("multiline");
        }
        if (self.setting.contextMenu) {
            self.myContextMenu = new ContextMenu(self.setting.container_table, self.setting.container_wrap_table, self.setting.contextMenuItem, self.setting.id);
        }
        if (Array.isArray(self.setting.groupBtnContextMenu) && self.setting.groupBtnContextMenu.length) {
            self.myGroupBtnContextMenu = new ContextMenu(self.setting.container_table, self.setting.container_wrap_table, self.setting.groupBtnContextMenu, self.setting.id);
        }
    },
    load: function (data, options) {
        var self = this;
        var _default = {
            callback: null,
            resetSelectedRow: false,
            ignoreHeader: true,
            reportHeader: null,
            fields: null,
        };
        Object.assign(_default, options);
        if (_default.resetSelectedRow) {
            self.resetSelectedRowData();
        }
        if (_default.reportHeader && !_.isEqual(self.setting.reportHeader, _default.reportHeader)) {
            self.setting.reportHeader = _default.reportHeader;
            delete _default.reportHeader;
        }

        if (_default.fields && !_.isEqual(self.setting.fields, _default.fields)) {
            self.setting.fields = _default.fields;
            _default.ignoreHeader = false;
            self.initHeader();
        }

        self.initData(data);

        Object.assign(this.setting, {
            currentPage: (self.setting.currentPage) ? self.setting.currentPage : 1,
        });

        self.renderTable(_default);
        // var activeRow = self.setting.container_table.find(">tbody>tr.active");
        // if(activeRow.length){
        //     self.scrollToRow(activeRow);
        //     self.setSelectedRowData(activeRow);
        // } else {
        //     self.scrollToFirstRow();
        // }
        //self.scrollToFirstRow();

        if (typeof _default.callback === 'function') {
            _default.callback.apply(self);
        }
    },

    resetSelectedRowData: function () {
        this.selectedRow = null;
        this.selectedIndex = null;
        this.selectedRowData = null;
    },
    setSelectedRowData: function (tr_el, active) {
        var self = this;
        self.selectedRow = tr_el;
        self.selectedIndex = parseInt(self.selectedRow.getAttribute(self.field_original_index_name));

        if (active) {
            [...self.setting.container_table.querySelectorAll('tbody>tr')].forEach(function (el) {
                if (el !== self.selectedRow) {
                    el.classList.remove("active");
                }
            })
            LightDom.addClass(self.selectedRow, "active")
        }

        if (isNaN(self.selectedIndex)) {
            self.selectedIndex = null;
            self.selectedRowData = null;
        } else {
            self.selectedRowData = self.data_origin[self.selectedIndex];
        }
    },
    bindEvent: function () {
        var self = this;
        if (self.setting.container_table) {
            function clickEvent() {
                var el = $(this);
                var i = parseInt(el.attr(self.field_index_name));
                el.closest('tbody').find('tr').removeClass('active');
                el.addClass('active');
                self.setSelectedRowData(el);
                var hookArguments = {
                    i: i,
                    current_data: self.data[i],
                    tr: el,
                };

                return hookArguments;
            }

            // self.bindOn(self.setting.container_table, 'click', 'tbody > tr:not(.group_btn):not(.sumup-row):not(.mobile-hide)', function () {
            //     var hookArguments = clickEvent.call(this);
            //     for (var key in self.hookEvents.onRowSelected) {
            //         if (typeof self.hookEvents.onRowSelected[key] === 'function') {
            //             self.hookEvents.onRowSelected[key].call(self, hookArguments);
            //         }
            //     }
            // });
            //
            // self.bindOn(self.setting.container_table, 'dblclick', 'tbody > tr:not(.group_btn):not(.sumup-row):not(.mobile-hide)', function () {
            //     var hookArguments = clickEvent.call(this);
            //     for (var key in self.hookEvents.onRowDblClick) {
            //         if (typeof self.hookEvents.onRowDblClick[key] === 'function') {
            //             self.hookEvents.onRowDblClick[key].call(self, hookArguments);
            //         }
            //     }
            // });


            function onSortThClick() {
                var th = $(this).parent('th');
                var field = th.attr(self.td_field_name);
                var sortType = th.attr('sortType') || '';

                if (sortType === '') {
                    sortType = 'desc';
                } else if (sortType === 'desc') {
                    sortType = 'asc';
                } else {
                    sortType = '';
                }
                self.setting.sortBy = {
                    field: field,
                    order: sortType,
                };

                var stringCompareFun = self.getStringCompareFun();
                if (sortType === '') {
                    self.data = Eup.Array.clone(self.data_origin)
                } else {
                    var reverse = self.setting.sortBy.order === 'DESC' ? -1 : 1;
                    var issortByGroup = !!(self.setting.groupByField && self.setting.groupByField !== self.setting.sortBy.field)

                    self.data.sort(function (item1, item2) {
                        var item1Value = item1[self.setting.sortBy.field];
                        var item2Value = item2[self.setting.sortBy.field];
                        var typeOfItem1 = typeof item1Value
                        var typeOfItem2 = typeof item2Value
                        if (typeOfItem1 === "number" && typeOfItem2 === "number") {
                            return reverse * (item1Value - item2Value)
                        }
                        if (typeOfItem1 === "string" && typeOfItem2 === "string") {
                            return reverse * stringCompareFun(item1Value, item2Value)
                        }

                        if (typeOfItem1 === "number" || typeOfItem1 === "string") {
                            return reverse
                        }
                        if (typeOfItem2 === "number" || typeOfItem2 === "string") {
                            return -reverse
                        }
                        return 0
                    })
                    //index data after sort
                    self.indexData();
                }
                self.sortGroupListByData()
                self.sortByGroup()

                var origin_data = self.data.slice();
                self.data = self.filterDataByKey(self.data);    //case have filter button

                self.renderTable({
                    fromSort: true,
                    sortByField: field,
                    sortByOrder: self.setting.sortBy.order,
                    ignoreHeader: false,
                });

                self.data = origin_data; //reload data
            }

            self.bindOn(self.setting.container_table, 'click', 'thead > tr > th.sortable > .th-container', onSortThClick);

            if (self.setting.columnResize) {
                var tableLeft;

                self.bindOn(self.setting.container, 'mousedown.EupTableExtend', '.grid-clumn', function (e) {
                    try {
                        tableLeft = self.setting.container.offset().left;
                        self.dragging.lastXPosition = null;
                        calcJColResizerPosition(e);
                        self.dragging.isColumnDrag = true;
                        self.dragging.fieldName = $(this).parents('th').attr(self.td_field_name);
                        self.dragging.field = self.headers.get(self.dragging.fieldName);
                        while (Array.isArray(self.dragging.field.parent) && self.dragging.field.parent.length) {
                            self.dragging.fieldName = self.dragging.field.parent;
                            self.dragging.field = self.headers.get(self.dragging.field.parent);
                        }
                        self.dragging.th = self.setting.container_table.find('thead>tr>th[' + self.td_field_name + '="' + self.dragging.fieldName + '"]').first();

                        self.dragging.grid_column = self.dragging.th.find('.grid-clumn');
                        self.dragging.grid_column.addClass('dragging');
                        self.dragging.el_draggingClone.addClass('dragging');
                        self.dragging.field.width = self.dragging.th.width();
                    } catch (e) {
                        console.error(e)
                    }
                    e.preventDefault();
                });


                $(document).on('mouseup.EupTableExtend', function (e) {
                    if (self.dragging.grid_column != null) {
                        self.dragging.grid_column.removeClass('dragging');
                        self.dragging.el_draggingClone.removeClass('dragging');
                        self.dragging.grid_column.attr('style', '');
                        if (self.dragging.field.width < 50) {
                            self.dragging.field.width = 50;
                        }
                        self.dragging.th.attr('width', self.dragging.field.width + 'px');
                        self.setTableWidth();
                    }
                    self.dragging.isColumnDrag = false;
                    self.dragging.grid_column = null;
                    self.resizeFixedColumn();
                });

                function calcJColResizerPosition(e) {
                    var xPosition = e.screenX;
                    if (self.dragging.lastXPosition !== null) {
                        var deltaX = xPosition - self.dragging.lastXPosition;
                        self.dragging.field.width = Math.abs(Math.round(self.dragging.field.width + deltaX));
                    }
                    self.dragging.el_draggingClone.css({left: e.pageX - tableLeft});
                    self.dragging.lastXPosition = xPosition;
                }

                $(document).on('mousemove.EupTableExtend', function (e) {
                    if (self.dragging.isColumnDrag && self.dragging.grid_column !== null) {
                        calcJColResizerPosition(e);
                    }
                    //fix bug Arrows not working on input type=“number”
                    //https://stackoverflow.com/questions/34282278/arrows-not-working-on-input-type-number
                    // e.preventDefault();
                });
            }

            self.bindOn(self.setting.container, 'click', '.pagination > .page-item-click', function () {
                var page = parseInt($(this).attr('data-page'));
                if (!isNaN(page)) {
                    self.setting.currentPage = page;
                    self.renderTable({ignoreHeader: true, ignoreReportHeader: true, ignoreTableWidth: true});
                    self.scrollToFirstRow();
                }
            });

            self.bindOn(self.setting.container, 'click', 'tbody > tr.group_btn', function () {
                // self.renderAllTbody();

                var tr = $(this);
                tr.toggleClass('collapsed');
                var group = tr.attr('_group');
                var groupElements = tr.nextAll('tr[_group="' + group + '"]');
                if (tr.hasClass('collapsed')) {
                    groupElements.addClass('hide_by_group');
                } else {
                    groupElements.removeClass('hide_by_group');
                }
            });

            if (self.setting.contextMenu) {
                var eventName = 'contextmenu';
                if (Eup.BrowserDetect.isIOS()) {
                    eventName = 'taphold';
                }
                self.bindOn(self.setting.container_table, eventName, 'tbody > tr', function (e) {

                    self.myContextMenu && self.myContextMenu.remove()
                    self.myGroupBtnContextMenu && self.myGroupBtnContextMenu.remove()

                    var $1 = $(this);
                    if (!$1.hasClass("sumup-row") && !$1.hasClass("group_btn")) {
                        // $1.trigger('click');
                        self.setSelectedRowData($1, true)
                        self.myContextMenu.show(e, self.getSelectedData(), self.getSelectedRow(), self.getSelectedIndex());
                    } else if (self.myGroupBtnContextMenu && $1.hasClass("group_btn")) {
                        var groupId = $1.attr("_group")
                        self.myGroupBtnContextMenu.show(e, groupId, $1, -1);
                    }
                    e.preventDefault();
                });
            }

            if (self.isResponsive()) {
                self.bindOn(self.setting.container, 'click', 'span.view-more-clumn-link', function () {
                    var el_parent_tr = $(this).closest('tr').next();
                    el_parent_tr.toggleClass('mobile-show');
                    if (el_parent_tr.hasClass('mobile-show')) {
                        $(this).html('<i class="fa fa-minus-square-o"></i>');
                    } else {
                        $(this).html('<i class="fa fa-plus-square-o"></i>');
                    }
                });
            }
        }
    },

    bindScrollRenderTable: function () {
        var self = this;
        self.setting.container_table.children('tbody').bind('mousewheel DOMMouseScroll', function () {
            if (self.blockVitualRender !== true && self.hasOwnProperty('vitualRenderOpts')) {
                var nth = self.vitualRenderOpts.v_end_index - Math.round(self.maxRowsDisplay / 2);
                var tr = self.setting.container_table.find('> tbody > tr:nth-child(' + nth + ')');

                function isInViewport(el) {
                    var elementTop = el.offset().top;
                    var elementBottom = elementTop + el.outerHeight();
                    var viewportTop = $(window).scrollTop();
                    var viewportBottom = viewportTop + $(window).height();
                    return elementBottom > viewportTop && elementTop < viewportBottom;
                };
                if (tr.length && isInViewport(tr)) {
                    self.blockVitualRender = true;
                    setTimeout(function () {
                        self.renderNextTbodyPart();
                        delete self.blockVitualRender;
                    }, 500);
                }
            }
        });
    },
    unbindScrollRenderTable: function () {
        this.setting.container_table.children('tbody').unbind('mousewheel DOMMouseScroll');
    },
    renderTable: function (opts) {
        var self = this;
        var _default = {
            ignoreHeader: false,
            ignoreReportHeader: false,
            fromSort: false,
        };
        Object.assign(_default, opts);
        var tbody = self.generateTbody(_default);
        self.setting.container.addClass('rendering');
        self.setting.container_table.children('tbody').html(tbody);
        if (self.renderingTimeout) {
            clearTimeout(self.renderingTimeout);
            delete self.renderingTimeout;
        }
        self.renderingTimeout = setTimeout(function () {
            self.setting.container.removeClass('rendering');
            delete self.renderingTimeout;
        }, self.delay_render_timeout);
        if ((_default.ignoreHeader || self.setting.fixedHeader) && self.header_generated) {

        } else {
            if (self.header_generated && _default.fromSort) {
                self.setting.container_table.find('thead>tr>th').attr("sorttype", "");
                if (_default.sortByField) {
                    self.getThByField(_default.sortByField).attr('sorttype', _default.sortByOrder);
                }

            } else {
                var thead = self.generateThead();
                self.setting.container_table.children('thead').html(thead);

                if (self.headers.headers.length > 1) {
                    (function setTHHeight() {
                        for (var i = 1; i < self.headers.headers.length; i++) {
                            var _headers_i = self.headers.headers[i]
                            for (var j = 0; j < _headers_i.length; j++) {
                                var parent_field = _headers_i[j].parent[0]
                                if (parent_field) {
                                    var thheight = self.setting.container_table.find("thead > tr > th[" + EupTableExtend.prototype.td_field_name + "=\"" + parent_field + "\"]").outerHeight()
                                    if (thheight === 0) {
                                        setTimeout(function () {
                                            setTHHeight()
                                        }, 500)
                                        return
                                    }
                                }
                            }
                        }
                    })()
                }
                self.header_generated = true;
            }
        }
        if (!_default.fromSort) {
            self.setTableWidth(self.tableWidth);

            if (self.setting.reportHeader) {
                if (!_default.ignoreReportHeader) {
                    var reportHeader = self.getReportHeader(self.setting.reportHeader);
                    var container_report_header = self.setting.container.children('.eup-report-header');
                    if (self.setting.container_report_header && self.setting.container_report_header.length) {
                        self.setting.container_report_header.html(reportHeader);
                    } else if (container_report_header.length) {
                        self.setting.container_report_header = container_report_header;
                        self.setting.container_report_header.html(reportHeader);
                    } else {
                        self.setting.container_report_header = $('<div class="eup-report-header">' + reportHeader + '</div>');
                        self.setting.container.prepend(self.setting.container_report_header);
                    }
                    self.setting.container.addClass('eup-report-header-table');
                }
            } else {
                if (self.setting.container_report_header && self.setting.container_report_header.length) {
                    self.setting.container_report_header.remove();
                    delete self.setting.container_report_header;
                }
                self.setting.container.removeClass('eup-report-header-table');
            }

            self.initPaging();
        }

        if (self.selectedRowData && self.isSelectedRowDataInData === false) {
            self.resetSelectedRowData();
        }
    },
    renderBottomToolbar: function () {
        var self = this;
        if (self.setting.bottomToolbar) {
            self.setting.container.addClass('eup-table-bottom-toolbar');
            self.setting.bottomToolbarContainer = self.findorappend(self.setting.container, ".bottom_toolbar", '<div class="bottom_toolbar">' + self.setting.bottomToolbar + '</div>');


            var bottomToolbarHtml = ""
            if (typeof self.setting.bottomToolbar === "function") {
                bottomToolbarHtml = getBottomToolbarHtml(self.setting.bottomToolbar())
            } else {
                bottomToolbarHtml = getBottomToolbarHtml(self.setting.bottomToolbar)
            }

            function getBottomToolbarHtml(bottomToolbar) {
                if (typeof bottomToolbar === "string") {
                    return bottomToolbar
                } else if (Array.isArray(bottomToolbar)) {
                    var bottomToolbarHtml = ""
                    bottomToolbar.forEach(function (btn) {
                        if (typeof btn._default.onClick === "function") {
                            btn._default.__id = btn._default.id || uuidv4();
                            var storeParameters = {
                                id: btn._default.__id,
                                callback: btn._default.onClick,
                                _this: self,
                                table: self,
                            }
                            EupTableExtend.prototype.Event.removebyId(storeParameters.id)
                            EupTableExtend.prototype.Event.events.push(storeParameters)
                        }
                        bottomToolbarHtml += btn.getValue(false)
                    })
                    return bottomToolbarHtml
                }
            }

            self.setting.bottomToolbarContainer.html(bottomToolbarHtml);
        } else {
            self.setting.container.removeClass('eup-table-bottom-toolbar');
        }
    },
    setSelected: function (attrName, attrValue) {
        this.setting.container_table.find('tbody>tr').removeClass('active');
        var row = this.setting.container_table.find('tbody>tr[' + attrName + '=' + attrValue + ']');
        row.addClass('active');
        this.setSelectedRowData(row);
        this.scrollToRow(row);
    },
    setSelectedFirstRow: function () {
        this.setting.container_table.find('>tbody>tr').removeClass('active');
        var row = this.setting.container_table.find('>tbody>tr').first();
        row.addClass('active');
        this.setSelectedRowData(row);
        this.scrollToRow(row);
    },
    unSelected: function () {
        this.setting.container_table.find('tbody>tr').removeClass('active');
        this.resetSelectedRowData();
    },
    triggerSelect: function (attrName, attrValue, param) {
        this.setting.container_table.find('tbody>tr').removeClass('active');
        var row = this.setting.container_table.find('tbody>tr[' + attrName + '=' + attrValue + ']');
        row.trigger('click', param);
        this.scrollToRow(row);
    },
    getSelectedIndex: function () {
        return this.selectedIndex;
    },
    getSelectedRow: function () {
        return this.selectedRow;
    },
    getSelectedData: function () {
        return this.selectedRowData;
    },
    clearData: function () {
        this.setting.data = [];
        this.data = [];
        this.data_origin = [];
        this.setting.container_table.html('');
    },
    getOriginData: function () {
        return this.data_origin
    },
    getContainerTable: function () {
        return this.setting.container_table;
    },
    getContainer: function () {
        return this.setting.container;
    },
    clean: function () {
        //todo
    },
    exportMicrosoftOffice: function (MSDocType, title, fileName) {//bookType: word, excel
        var self = this;

        var MSDocSchema, MSDocExt;
        switch (MSDocType) {
            case 'excel':
                MSDocSchema = 'xmlns:x="urn:schemas-microsoft-com:office:excel"';
                MSDocExt = 'xls';
                break;
            case  'word':
                MSDocSchema = 'xmlns:w="urn:schemas-microsoft-com:office:word"';
                MSDocExt = 'doc';
                break;
            default:
                console.log('exportMicrosoftOffice', 'Invalid MSDocType');
                return;
        }

        var hookExportWord = 'hook export ms doc';
        self.hookEvents.hookTRGroupBtnStyle[hookExportWord] = self.hookEvents.hookThStyle[hookExportWord] = self.hookEvents.hookTDStyle[hookExportWord] = function (params) {
            return {
                padding: '5px',
            };
        };
        self.hookEvents.hookTDStyle[hookExportWord] = function (params) {
            var fopts = {};
            if (params.field.width) {
                fopts['width'] = params.field.width + 'px';
            }
            if (params.current_data !== undefined && (params.current_data.isTotalRow === true || params.current_data.isTotalAll === true)) {
                fopts['font-weight'] = 'bold';
            }
            if (!_.isEmpty(fopts)) {
                return fopts;
            }
        };
        const tbody = self.generateTbody({
            rawValue: true,
            inlineStyle: true,
            paging: false,
            type: "export"
        });
        const thead = self.generateThead({
            type: "export"
        });
        const reportHeader = self.setting.reportHeader ? self.getReportHeader($.extend({}, self.setting.reportHeader, {exportType: true})) : '';
        delete self.hookEvents.hookTDStyle[hookExportWord];
        delete self.hookEvents.hookThStyle[hookExportWord];
        delete self.hookEvents.hookTRGroupBtnStyle[hookExportWord];
        delete self.hookEvents.hookTDStyle[hookExportWord];

        let docFile = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' + MSDocSchema + ' xmlns="http://www.w3.org/TR/REC-html40">';
        docFile += '<meta http-equiv="content-type" content="application/vnd.ms-' + MSDocType + '; charset=UTF-8">';
        docFile += '<head>';

        switch (MSDocType) {
            case 'excel':
                docFile += '<!--[if gte mso 9]>';
                docFile += '<xml>';
                docFile += '<x:ExcelWorkbook>';
                docFile += '<x:ExcelWorksheets>';
                docFile += '<x:ExcelWorksheet>';
                docFile += '<x:Name>';
                docFile += title;
                docFile += '</x:Name>';
                docFile += '<x:WorksheetOptions>';
                docFile += '<x:DisplayGridlines/>';
                docFile += '</x:WorksheetOptions>';
                docFile += '</x:ExcelWorksheet>';
                docFile += '</x:ExcelWorksheets>';
                docFile += '</x:ExcelWorkbook>';
                docFile += '</xml>';
                docFile += '<![endif]-->';
                break;
            case  'word':
                docFile += '<style>@page';
                docFile += '{';
                docFile += 'size:841.9pt 595.3pt;;  /* A4 Horizontal*/';
                docFile += 'margin:1cm 1cm 1cm 1cm; /* Margins: 2.5 cm on each side */';
                docFile += 'mso-page-orientation: landscape;';
                docFile += '}div.Section1 {page:Section1;} </style>';
                break;
        }
        docFile += '</head>';
        docFile += '<body><div class="Section1">';
        docFile += '<table border=1 cellspacing=0 cellpadding=0 style="border-collapse:collapse;border:0;">';
        docFile += '<thead>';

        const totalColumnSpan = self.headers_data.filter(function (header) {
            return header.isHiden !== true
        }).length;

        switch (MSDocType) {
            case 'excel':
                if (reportHeader) {
                    var reportHeaderArr = [];
                    $('<div>' + reportHeader + '</div>')
                        .find('.report_header > p')
                        .each(function () {
                            reportHeaderArr.push(this.outerHTML);
                        });
                    reportHeaderArr.splice(1, 0, '');
                    for (var i = 0; i < reportHeaderArr.length; i++) {
                        docFile += '<tr><th style="padding: 10px;" colspan="' + totalColumnSpan + '">';
                        docFile += reportHeaderArr[i];
                        docFile += '</th></tr>';
                    }
                }
                break;
            case  'word':
                docFile += '<tr><th style="padding: 10px;" colspan="' + totalColumnSpan + '">';
                docFile += reportHeader;
                docFile += '</th></tr>';
                break;
        }

        docFile += thead;
        docFile += '</thead>';
        docFile += '<tbody>';
        docFile += tbody;
        docFile += '</tbody>';
        docFile += '</table>';
        docFile += '</div></body>';
        docFile += '</html>';
        var blob = new Blob([docFile], {type: 'application/vnd.ms-' + MSDocType});
        saveAs(blob, fileName + '.' + MSDocExt);
    },
    export: function (opts) {
        var self = this;
        var default_opts = {
            title: '',
            titleMultiLang: '',
            bookType: 'xlsx',
            searchParams: self.setting.searchParams,
            data: null,
            ignoreReportHeader: !!!self.setting.reportHeader,
            increase_column: false,
            xmlExportType: false,//only excel xls, word doc
            batch_export: false,
        };
        Object.assign(default_opts, opts);
        var title = self.getPageName(default_opts, true)
            || self.getPageName(true)
            || self.getTitle(default_opts, true)
            || self.getTitle(true);

        if (!default_opts.fileName) {
            var _fileName = [title];
            if (self.setting.reportHeader && self.setting.reportHeader.Cars) {
                if (!self.carData) {
                    self.carData = Eup.GetModel('GetCarData').Session.GetObject('Car_Unicode');
                }
                var carname = [];
                var carInfo = self.carData[self.setting.reportHeader.Cars];
                if (carInfo) {
                    if (carInfo.Car_Number) {
                        carname.push(carInfo.Car_Number);
                    }
                    if (carInfo.Car_Driver) {
                        carname.push(carInfo.Car_Driver);
                    }
                }
                if (carname.length) {
                    _fileName.push(carname.join(", "));
                }
            }
            if (default_opts.searchParams) {
                var datetimestr = []
                var startTime = default_opts.searchParams.StartTime || default_opts.searchParams.start_date
                if (startTime) {
                    startTime = moment(startTime).format('YYYY-MM-DD')
                    if (datetimestr.indexOf(startTime) === -1) {
                        datetimestr.push(startTime);
                    }
                }
                var endTime = default_opts.searchParams.EndTime || default_opts.searchParams.end_date
                if (endTime) {
                    endTime = moment(endTime).format('YYYY-MM-DD')
                    if (datetimestr.indexOf(endTime) === -1) {
                        datetimestr.push(endTime);
                    }
                }
                if (datetimestr.length) {
                    _fileName.push(datetimestr.join("~"))
                }
            }

            default_opts.fileName = _fileName.join("_");
        }

        var loader;
        if (default_opts.bookType === 'doc') {
            if (default_opts.xmlExportType) {
                self.exportMicrosoftOffice('word', title);
                return;
            } else {
                if (typeof docx === 'undefined') {
                    var docxUrl = '/js/eup/controller/shared/print/docx.js';
                    self.euploaders.docx = self.euploaders.docx || new EupLoader({
                        url: docxUrl,
                        callback: function () {
                            self.export(opts);
                        },
                        condition: function () {
                            return typeof docx !== 'undefined';
                        },
                    });
                    if (!self.euploaders.docx.contain(docxUrl)) {
                        self.euploaders.docx.loadScripts();
                        return;
                    }
                }
            }
        } else if (EupTableExtend.SheetJSExtensionMapping.hasOwnProperty(default_opts.bookType)) {
            if (default_opts.xmlExportType && EupTableExtend.SheetJSExtensionMapping[default_opts.bookType] === 'xls') {
                self.exportMicrosoftOffice('excel', title, default_opts.fileName);
                return;
            } else {
                if (typeof XLSX === 'undefined') {
                    var sheetJsUrl = 'js/eup/controller/shared/print/xlsx.full.min.js';
                    self.euploaders.sheetjs = self.euploaders.sheetjs || new EupLoader({
                        url: sheetJsUrl,
                        callback: function () {
                            self.export(opts);
                        },
                        condition: function () {
                            return typeof XLSX !== 'undefined';
                        },
                    });
                    if (!self.euploaders.sheetjs.contain(sheetJsUrl)) {
                        self.euploaders.sheetjs.loadScripts();
                        return;
                    }
                }
            }
        } else {
            console.error('Invalid export type');
            return;
        }

        if (!default_opts.data) {
            default_opts.data = self.data;
        }

        var eupExport;
        if (EupTableExtend.SheetJSExtensionMapping.hasOwnProperty(default_opts.bookType)) {
            eupExport = EupTableExtend.ExportSheetJSDocument;
            eupExport.ext = EupTableExtend.SheetJSExtensionMapping[default_opts.bookType];
            eupExport.bookType = default_opts.bookType;
        } else if (default_opts.bookType === 'doc') {
            eupExport = EupTableExtend.ExportDocxDocument;
        }
        eupExport.clearData();

        var start_index = 0;
        var field, i, j;
        var end_index = default_opts.data.length;
        eupExport.params.header_obj = [];
        eupExport.params.headers_data = self.headers_data.filter(function (header) {
            return header.ignoreExport !== true && header.isHiden !== true;
        })

        eupExport.params.headers = self.headers;
        eupExport.params.patched_headers = self.headers.getPatchedHeaders();
        for (var k = 0; k < eupExport.params.patched_headers.headers.length; k++) {
            eupExport.params.patched_headers.headers[k] = eupExport.params.patched_headers.headers[k].filter(function (header) {
                return header.ignoreExport !== true && header.isHiden !== true;
            })
        }

        for (i = 0; i < eupExport.params.patched_headers.headers.length; i++) {
            var thead_tr = eupExport.params.patched_headers.headers[i];
            eupExport.params.header_obj[i] = eupExport.getEmptyRow();
            for (j in thead_tr) {
                field = thead_tr[j];
                if (field.isFieldEnable() && eupExport.isHeaderFieldEnable(field) && field.myClass !== "hide_print") {// check hide column by class hide_print
                    var columtHeaderText = field.getFieldText(true);
                    if (typeof eupExport.transformCellValue === 'function') {
                        columtHeaderText = eupExport.transformCellValue(columtHeaderText);
                    }
                    eupExport.addCell({
                        cellValue: columtHeaderText,
                        row: eupExport.params.header_obj[i],
                        field: field,
                        isHeader: true
                    })
                }
            }
            eupExport.addRow(eupExport.params.header_obj[i], true);
        }

        function getNextRowspan(i, start_index, end_index, fieldKey) {
            var current_data = self.data[i][fieldKey]
            var j = i
            for (j = i; j < end_index; j++) {
                if (self.data[j][fieldKey] !== current_data) {
                    break
                }
            }
            return j - i
        }

        j = 1;
        var isGroupByField = !!self.setting.groupByField;
        for (i = start_index; i < end_index; i++) {
            var current_data = default_opts.data[i];
            var prev_data = default_opts.data[i - 1];
            var next_data = default_opts.data[i + 1];
            var hookArguments = {
                current_data: current_data,
                i: i,
                rawValue: true
            };


            if (isGroupByField && (i === start_index || (prev_data !== undefined && prev_data[self.group_id_field] !== undefined) && current_data[self.group_id_field] !== prev_data[self.group_id_field])) {
                var groupTitle = current_data[self.group_name_field];
                var _groupTitle = undefined;
                var unGroupItem = false;
                for (key in self.hookEvents.hookTRGroupBtn) {
                    if (typeof self.hookEvents.hookTRGroupBtn[key] === 'function') {
                        _groupTitle = self.hookEvents.hookTRGroupBtn[key].call(self, hookArguments)
                    }
                }
                for (key in self.hookEvents.hookTRGroupBtnAttr) {
                    if (typeof self.hookEvents.hookTRGroupBtnAttr[key] === 'function') {
                        var attrlist = self.hookEvents.hookTRGroupBtnAttr[key].call(self, hookArguments);
                        if (attrlist.ungroup !== undefined && attrlist.ungroup === true) {
                            unGroupItem = true;
                        }
                    }
                }
                if (_groupTitle !== undefined && _groupTitle !== null) {
                    groupTitle = _groupTitle
                }
                var group_display_data = eupExport.getEmptyRow();
                eupExport.addCell({
                    cellValue: groupTitle,
                    row: group_display_data,
                    isGroupBtn: true
                });
                if (!unGroupItem) {
                    eupExport.addRow(group_display_data);
                }
            }


            var display_data = eupExport.getEmptyRow();

            for (var k in eupExport.params.headers_data) {
                field = eupExport.params.headers_data[k];
                if (field.isFieldEnable() && field.myClass !== 'hide_print') {// check hide column by class hide_print
                    var value = field.isIncreaseField() ? j : self.generateTdValue(current_data, field, true);
                    var columtHeaderText = field.getFieldText(true);
                    if (typeof eupExport.transformCellValue === 'function') {
                        columtHeaderText = eupExport.transformCellValue(columtHeaderText);
                    }


                    var rowspan = null;
                    var VerticalMergeType = null;
                    if (field.groupRow === true) {
                        if (i !== start_index && current_data && prev_data && current_data[field._name] === prev_data[field._name]) {
                            rowspan = 1
                        }
                        if (i === start_index || current_data[field._name] !== prev_data[field._name]) {
                            VerticalMergeType = "RESTART"
                        } else {
                            if (current_data[field._name] !== next_data[field._name]) {
                                VerticalMergeType = "CONTINUE"
                            } else {
                                VerticalMergeType = "CONTINUE"
                            }
                        }
                        if (typeof rowspan !== "number") {
                            rowspan = getNextRowspan(i, start_index, end_index, field._name)
                        }
                    }

                    eupExport.addCell({
                        cellValue: value,
                        row: display_data,
                        field: field,
                        hookArguments: {
                            current_data: current_data,
                            field: field,
                            i: i,
                        },
                        rowspan: rowspan,
                        VerticalMergeType: VerticalMergeType,
                    })
                }
            }

            eupExport.addRow(display_data);

            if (self.setting.sumUpConfig) {
                var sumupRow = false

                if (self.setting.groupByField) {
                    if (next_data !== undefined && next_data[self.group_id_field] !== undefined && current_data[self.group_id_field] !== next_data[self.group_id_field]) {
                        sumupRow = true;
                    }
                }

                if (i === default_opts.data.length - 1) {
                    sumupRow = true
                }

                if (sumupRow) {
                    var groupList = []
                    if (self.setting.groupByField) {
                        loopGroupList: for (var k = 0; k < self.groupList.length; k++) {
                            loopValueList: for (var l = 0; l < self.groupList[k].list.length; l++) {
                                if (self.groupList[k].list[l][self.field_original_index_name] === current_data[self.field_original_index_name]) {
                                    groupList = self.groupList[k]
                                    break loopGroupList;
                                }
                            }
                        }
                    }


                    var colspan = self.setting.sumUpConfig.colspan || self.setting.sumUpConfig._colspan
                    var sumupRowTds = eupExport.getEmptyRow();
                    if (colspan > 0) {
                        var sumupRowTitle = MultiLanguageControllor.get("Total", true)
                        for (key in self.hookEvents.hookSumupRowTitle) {
                            var _sumupRowTitle = self.hookEvents.hookSumupRowTitle[key].call(self, hookArguments)
                            if (!Eup.Object.isFalsy(_sumupRowTitle)) {
                                sumupRowTitle = _sumupRowTitle
                            }
                        }

                        eupExport.addCell({
                            cellValue: sumupRowTitle,
                            row: sumupRowTds,
                            colspan: colspan,
                            isSumupTitleCell: true
                        })
                    }

                    var _count = 0
                    for (var k = 0; k < eupExport.params.headers_data.length; k++) {
                        var _field = eupExport.params.headers_data[k];
                        if ((_field.isHiden === true || _field.ignoreExport === true)) {
                            // continue
                        } else {
                            if (++_count > colspan) {
                                var value = ""
                                var __field = self.setting.sumUpConfig.getField(_field._name);
                                if (__field !== undefined) {
                                    value = self.setting.sumUpConfig.getInitialValue(__field);
                                    var reduce = self.setting.sumUpConfig.getReduce(__field);
                                    var format = self.setting.sumUpConfig.getFormat(__field);
                                    if (self.setting.groupByField) {
                                        for (var l = 0; l < groupList.list.length; l++) {
                                            value = reduce(value, groupList.list[l][_field._name])
                                        }
                                    } else {
                                        for (var l = 0; l < self.data.length; l++) {
                                            value = reduce(value, self.data[l][_field._name])
                                        }
                                    }
                                    if (typeof format === "function") {
                                        value = format(value, __field, true);
                                    }
                                }
                                eupExport.addCell({
                                    cellValue: value,
                                    row: sumupRowTds,
                                    isSumupValueCell: true,
                                    field: _field
                                })
                            }
                        }
                    }
                    eupExport.addRow(sumupRowTds);
                }

            }

            j++;
        }


        if (!default_opts.ignoreReportHeader) {
            var reportHeaderOpts = $.extend({}, self.setting.reportHeader, {type: 'array', isPlainText: true});
            var reportTableHeader = self.getReportHeader(reportHeaderOpts);
            if (Array.isArray(reportTableHeader)) {
                for (var k = 0; k < reportTableHeader.length; k++) {
                    var lines = []
                    for (var l = 0; l < reportTableHeader[k].length; l++) {
                        var line = []
                        var label = reportTableHeader[k][l].label
                        var value = reportTableHeader[k][l].value
                        if (label) {
                            line.push(label)
                        }
                        if (value) {
                            line.push(value)
                        }
                        lines.push(line.join(": "));
                    }
                    reportTableHeader[k] = lines.join("    ");
                }
                reportTableHeader.splice(1, 0, '');
                eupExport.addReportHeader(reportTableHeader);
            }
        }

        eupExport.generateDocument({title: title, batch_export: default_opts.batch_export}, function (params, doc) {
            if (default_opts.batch_export) {
                default_opts.callback(doc);
            } else {
                eupExport.save(doc, default_opts.fileName + '.' + eupExport.ext);
            }
        });


    },
    scrollToFirstRow: function () {
        this.scrollToRow(this.setting.container_table.find('tbody>tr:first-child').first());
    },
    scrollToSelectedRow: function () {
        this.scrollToRow(this.selectedRow);
    },
    scrollToRow: function (row, options) {
        if (row) {
            var _default_options = {
                duration: 200,
                direction: 'vertical',
                container: this.setting.container,
                complete: function () {
                    // console.log("complete");
                },
            };
            if (options && typeof options === 'object') {
                Object.assign(_default_options, options);
            }
            $(row).scrollintoview(_default_options);
        }
    },
    getTh: function (attr, value) {
        return this.setting.container_table.find('thead>tr>th[' + attr + '=' + value + ']');
    },
    getThByField: function (fieldName) {
        return this.getTh(this.td_field_name, fieldName);
    },
    setTableWidth: function (width) {
        var self = this;
        if (isNaN(width)) {
            width = self.tableWidth = self.headers.getFirstTrFieldTotalWidth();
        }
        self.setting.container_table.css({width: width});
    },
    generatePrintTable: function (opts) {
        var self = this;
        var _default = {
            ignoreHeader: false,
        };
        Object.assign(_default, opts);

        var tbodyHtml = self.generateTbody({
            paging: false,
            type: 'print',
        });
        var theadHtml = self.generateThead({
            byPercentage: true,
            type: 'print',
        });
        var tableContainer = document.createElement('div');
        var table = document.createElement('table');
        table.innerHTML = '<thead>' + theadHtml + '</thead><tbody>' + tbodyHtml + '</tbody>';
        [].slice.call(table.querySelectorAll('.hide_this, .hide_print')).forEach(function (el) {
            el.parentNode.removeChild(el);
        });
        var td_th_Style = 'height: 25px;padding: 0px 8px;line-height: 20px;white-space: break-spaces;';
        [].slice.call(table.querySelectorAll('tr > td')).forEach(function (el) {
            var cssText = td_th_Style;
            var classList = el.classList;
            if (String($(el).text() || '').indexOf(' ') !== -1 || String($(el).text() || '').indexOf('&nbsp;') !== -1) {
                cssText += 'word-break:break-word;';
            } else {
                cssText += 'word-break:break-all;';
            }
            if (classList.contains('text-center')) {
                cssText += 'text-align: center;';
            } else if (classList.contains('text-left')) {
                cssText += 'text-align: left;';
            } else if (classList.contains('text-right')) {
                cssText += 'text-align: right;';
            }
            el.style.cssText = cssText;
        });
        [].slice.call(table.querySelectorAll('tr > td:not(:last-child), tr > th:not(:last-child)')).forEach(function (el) {
            el.style.cssText += 'border-right: 1px solid #c1c1c1;';
        });
        [].slice.call(table.querySelectorAll('tr:not(:last-child) > td, tr:not(:last-child) > th')).forEach(function (el) {
            el.style.cssText += 'border-bottom: 1px solid #c1c1c1;';
        });
        [].slice.call(table.querySelectorAll('thead>tr>th')).forEach(function (el) {
            el.style.cssText += td_th_Style + 'border-bottom: 1px solid gray;min-height: 24px;padding: 4px 8px;font-size: 14px;text-align: center;';
        });
        if (self.setting.sumUpConfig !== undefined && self.setting.sumUpConfig.notbold) {
        } else {
            [].slice.call(table.querySelectorAll('tbody>tr.sumup-row>td>span,tbody>tr.sumrow>td>span')).forEach(function (el) {
                el.style.cssText += td_th_Style + 'font-weight: bold;padding:0';
            });
        }
        table.setAttribute('style', 'border-collapse: collapse;border-spacing: 0;border: 1px solid gray;width: 100%;');

        if (!_default.ignoreHeader) {
            var reportHeaderOpts = $.extend({}, self.setting.reportHeader, _default, {
                withStyle: true,
                printType: true,
            });
            var reportHeaderHtml = self.getReportHeader(reportHeaderOpts);
            var reportHeader = document.createElement('div');
            reportHeader.innerHTML = reportHeaderHtml;
            tableContainer.appendChild(reportHeader);
        }
        tableContainer.appendChild(table);
        return tableContainer;
    },
    printThisContent: function (iframeId, title, content) {
        var self = this;
        var printIframe = window.frames[iframeId];
        if (!printIframe) {
            printIframe = document.createElement("iframe");
            printIframe.setAttribute("id", iframeId);
            printIframe.setAttribute("height", 0);
            printIframe.setAttribute("width", 0);
            printIframe.setAttribute("border", 0);
            printIframe.setAttribute("wmode", "Opaque");
            document.body.appendChild(printIframe);
        } else {
            try {
                var printIframeHeader = $(printIframe.contentDocument.getElementsByClassName("report_header")[0]).clone();
                var tableHeader = self.setting.container_report_header.children(".report_header").clone();
                printIframeHeader.find(".print-date").remove();
                tableHeader.find(".print-date").remove();
                printIframeHeader = printIframeHeader.text().trim().replace(/(?:\r\n|\r|\n|\s|\t)/g, '');
                tableHeader = tableHeader.text().trim().replace(/(?:\r\n|\r|\n|\s|\t)/g, '');
                if (printIframeHeader === tableHeader) {
                    printIframe.contentWindow.print();
                    return;
                }
            } catch (e) {
                console.log(e);
            }
        }

        var wdoc = printIframe.document || printIframe.contentDocument || printIframe;

        $(wdoc).ready(function () {
            printIframe.focus();
            try {
                // Fix for IE11 - printng the whole page instead of the iframe content
                if (!printIframe.document.execCommand('print', false, null)) {
                    // document.execCommand returns false if it failed -http://stackoverflow.com/a/21336448/937891
                    printIframe.print();
                }
            } catch (e) {
                printIframe.contentWindow.print();
            }
            wdoc.close();
        });
        wdoc.open();

        var _title;
        if (typeof title === 'string') {
            _title = title;
        } else if (typeof title === 'function') {
            _title = title();
        } else {
            _title = "";
        }
        var _content;
        if (typeof content === 'string') {
            _content = content;
        } else if (typeof content === 'function') {
            _content = content();
        } else {
            _content = "";
        }

        wdoc.write('<html>' +
            '<head>' +
            '    <meta charset="UTF-8">' +
            '    <meta name="viewport"' +
            '          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">' +
            '    <meta http-equiv="X-UA-Compatible" content="ie=edge">' +
            '    <title>' + _title + '</title>' +
            '</head>' +
            '<body style="padding: 10px">' + _content +
            '</body>' +
            '</html>');

        // [].slice.call(printWindow.document.querySelectorAll('table')).forEach(function (table) {
        //     var reportHeaderEl = table.previousSibling.children[0];
        //     if (reportHeaderEl.classList.contains("report_header")) {
        //         reportHeaderEl.style.cssText = reportHeaderEl.style.cssText + ";width:" + table.offsetWidth + "px;";
        //     }
        // });

        wdoc.close();
    },
    print: function (opts) {
        var self = this;
        var _default = {
            title: null,
            titleMultiLang: null,
            ignoreHeader: false,
        };
        Object.assign(_default, opts);
        if (EupTableExtend.debug) {
            var tableContainer = self.generatePrintTable(_default);
            document.body.innerHTML = tableContainer.innerHTML;
            return;
        }

        _default.title = self.getTitle(_default, true) || self.getTitle(true);

        var iframeId = "EupTableExtend_Iframe_Print" + self.setting.id;
        self.printThisContent(iframeId, _default.title, function () {
            var tableContainer = self.generatePrintTable(_default);
            return tableContainer.innerHTML
        })
    },
    getReportHeader: function (opts) {
        var self = this;
        EupTableExtend.prototype.account_info = EupTableExtend.prototype.account_info || Eup.GetModel('AccountInfo').Session.Get();
        var _default = {
            title: null,
            titleMultiLang: null,
            StartTime: null,
            EndTime: null,
            DateFormat: Eup.Format.get_format('date', 'YYYY/MM/DD') + ' HH',//'YYYY/MM/DD HH',  YYYY/MM/DD HH:mm, YYYY/MM/DD HH:mm:ss, YYYY/MM/DD
            StartDateFormat: null,
            EndDateFormat: null,
            Cars: null,//array, string
            Drivers: null,//array, string
            DriversText: null,
            Customers: null,//array, string
            AllDriver: null,
            AllCustomer: null,
            Team_ID: EupTableExtend.prototype.account_info.Team_ID,//put Array Car_Unicode to show any cars
            isPlainText: false,
            type: 'html',//object, html, array
            withStyle: false,
            valueField: null,
            textField: null,
            sheetName: null,
            CarParams: {
                Label: '',
                LabelMultiLang: 'CarNumber',
                All: '',
                AllMultiLang: 'All',
                Other: '',
                OtherMultiLang: 'OtherCars',
            },
            CustomerParams: {
                Label: '',
                LabelMultiLang: 'Customer',
                All: '',
                AllMultiLang: 'AllCustomer',
                Other: '',
                OtherMultiLang: 'OtherCustomer',
            },
            DriverParams: {
                Label: '',
                LabelMultiLang: 'DriverName',
                All: '',
                AllMultiLang: 'AllDriver',
                Other: '',
                OtherMultiLang: 'OtherDrivers',
            },
            printType: false,//add print date time
        };
        $.extend(_default, _.cloneDeep(opts));
        _default.isPlainText = !!_default.isPlainText;//convert to boolean

        for (var key in _default) {
            var value = _default[key];
            if (value !== null && value !== undefined) {
                _default[key[0].toLowerCase() + key.substring(1)] = value;
                _default[key[0].toUpperCase() + key.substring(1)] = value;
            }
        }

        _default.title = self.getPageName(_default, _default.isPlainText)
            || self.getPageName(_default.isPlainText)
            || self.getTitle(_default, _default.isPlainText)
            || self.getTitle(_default.isPlainText);

        function getMoment(date) {
            if (moment.isMoment(date)) {
                return date;
            }
            if (typeof date === 'string') {
                var formatList = ['YYYY-MM-DD HH:mm:ss', 'YYYY/MM/DD HH:mm:ss'];
                for (var i = 0; i < formatList.length; i++) {
                    var _moment = moment(date, formatList[i], true);
                    if (_moment.isValid()) {
                        return _moment;
                    }
                }
            } else if (date instanceof Date) {
                return moment(date);
            } else {
                //todo st
            }
        }

        _default.StartTime = getMoment(_default.StartTime) || undefined;
        _default.EndTime = getMoment(_default.EndTime) || undefined;
        if (_default.EndTime && _default.EndTime.hour() === 23 && _default.EndTime.minute() === 59) {
            // _default.EndTime.set({hour: 24, minute: 0, second: 0});
            _default.EndDateFormat = _default.DateFormat.replace('HH', '24').replace('mm', '00').replace('ss', '00');
        }

        function getMultiLanguageText(key) {
            return typeof key !== 'undefined' ? MultiLanguageControllor.get(key, _default.isPlainText) : '';
        }

        function generateDetail(cars, allCars, params, valueField, textField) {
            var maxNumberLabelDisplay = 2;
            if (cars !== '' && (typeof cars === 'string' || typeof cars === 'number')) {
                cars = [cars];
            }
            var label = params.Label || getMultiLanguageText(params.LabelMultiLang);
            var value = '';

            function getText(_value) {
                for (var key in allCars) {
                    if (allCars[key][valueField] == _value) {
                        if (typeof textField === 'string') {
                            textField = [textField];
                        }
                        return textField.map(function (_textField) {
                            return allCars[key][_textField];
                        }).filter(function (_textField) {
                            return _textField !== undefined && _textField !== null && _textField !== '';
                        }).join(', ') || '';
                    }
                }
            }

            var carLength = cars.length;
            if (cars === '' || carLength === allCars.length) {
                value = params.All || getMultiLanguageText(params.AllMultiLang);
            } else {
                for (var i = 0; i < carLength; i++) {
                    if (i < maxNumberLabelDisplay) {
                        value += (i === 0 ? '' : '; ') + getText(cars[i]);
                    } else {
                        value += ' ' + getMultiLanguageText('And');
                        value += ' ' + (carLength - maxNumberLabelDisplay);
                        value += ' ' + (params.Other || getMultiLanguageText(params.OtherMultiLang));
                        break;
                    }
                }
            }
            return {
                label: label,
                value: value,
            };
        }

        var detail;
        if (_default.Cars === '' || _default.Cars) {
            var carDataByTeamID = Eup.getCarDataByTeamID(_default.Team_ID);
            detail = generateDetail(_default.Cars, carDataByTeamID, _default.CarParams, _default.valueField || 'Car_Unicode', _default.textField || ['Car_Number', 'Car_Driver']);
        } else if (_default.DriversText || _default.Drivers === '' || _default.Drivers) {
            if (_default.DriversText !== null) {
                detail = {
                    label: getMultiLanguageText(_default.DriverParams.LabelMultiLang),
                    value: _default.DriversText
                }
            } else {
                var carDriverByTeamID = _default.AllDriver || Eup.getCarDriverByTeamID(_default.Team_ID);
                detail = generateDetail(_default.Drivers, carDriverByTeamID, _default.DriverParams, _default.valueField || 'CD_ID', _default.textField || 'CD_Name');
            }
        } else if (_default.Customers === '' || _default.Customers) {
            detail = generateDetail(_default.Customers, _default.AllCustomer, _default.CustomerParams, _default.valueField || 'DispatchCust_ID', _default.textField || 'Name');
        }


        var starttime = ""
        if (_default.StartTime) {
            var dateformat = _default.StartDateFormat || _default.DateFormat
            try {
                if (_default.StartTime.format("HH:mm:ss") === "23:59:59" && dateformat.split(" ")[1].toLowerCase() === "hh") {
                    dateformat = dateformat.replace(/hh/ig, "24")
                }
            } catch (e) {
            }
            starttime = _default.StartTime.format(dateformat)
        }

        var reportedDate = starttime
        if (_default.EndTime) {
            reportedDate += ' ~ ' + _default.EndTime.format(_default.EndDateFormat || _default.DateFormat);
        }


        var lines = []
        if (_default.title) {
            lines.push([{
                value: _default.title,
                type: "header"
            }])
        }
        var line2 = []
        if (detail) {
            line2.push({
                class: "report-car",
                label: detail.label,
                value: detail.value
            })
        }
        if (_default.StartTime || _default.EndTime) {
            var LabelStatisDate = getMultiLanguageText('StatisDate')
            if (_default.LabelStatisDateMultiLang) {
                LabelStatisDate = getMultiLanguageText(_default.LabelStatisDateMultiLang)
            }
            line2.push({
                class: "report-datetime",
                label: LabelStatisDate,
                value: reportedDate
            })
        }
        if (_default.printType) {
            line2.push({
                class: "print-datetime",
                label: getMultiLanguageText('PrintDate'),
                value: moment().format(Eup.Format.get_format('date'))
            })
        }
        lines.push(line2)
        if (Array.isArray(_default.extralines)) {
            for (var i = 0; i < _default.extralines.length; i++) {
                _default.extralines[i].forEach(function (line) {
                    if (line.labelMultilang) {
                        line.label = getMultiLanguageText(line.labelMultilang)
                    }
                    if (typeof line.label === "function") {
                        line.label = line.label(_default.isPlainText)
                    }
                    if (line.valueMultilang) {
                        line.value = getMultiLanguageText(line.valueMultilang)
                    }
                    if (typeof line.value === "function") {
                        line.value = line.value(_default.isPlainText)
                    }
                })
            }

            lines = lines.concat(_default.extralines)
        }
        lines = lines.filter(function (line) {
            return line.length;
        })

        switch (_default.type) {
            case 'array':
                return lines
            case 'html':
                var reportHeader = "<div class='report_header' >";
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    if (!line.length) {
                        continue
                    }
                    var lineClass = []
                    var lineStr = [];
                    var isHeader = false
                    for (var j = 0; j < line.length; j++) {
                        var para = line[j]
                        if (para.type === "header") {
                            isHeader = true
                        }

                        var paraClass = []
                        if (para.class) {
                            if (typeof para.class === "string") {
                                para.class = para.class.split(" ")
                            }
                            if (Array.isArray(para.class)) {
                                paraClass = paraClass.concat(para.class)
                            }
                        }

                        var paraEl = []
                        if (para.label) {
                            paraEl.push("<span class='para-label' >" + para.label + "</span>")
                        }
                        if (para.value) {
                            paraEl.push("<span class='para-value' >" + para.value + "</span>")
                        }
                        lineStr.push("<span " + Eup.HtmlHelper.generateClass(paraClass) + " >" + paraEl.join(": ") + "</span>")
                    }
                    lineClass.push(isHeader ? "page-title" : "para")
                    reportHeader += "<p " + Eup.HtmlHelper.generateClass(lineClass) + " >" + lineStr.join("&nbsp;&nbsp;&nbsp;&nbsp;") + "</p>"
                }
                reportHeader += "</div>"
                var $reportHeader = $("<div>" + reportHeader + "</div>")
                if (_default.withStyle) {
                    $reportHeader.find('.report_header').css({
                        padding: '0px 0px 10px 0px',
                    })

                    $reportHeader.find('.page-title').css({
                        margin: 0,
                        padding: _default.printType ? '0px 20px 20px 0px' : '0px 20px 0px 0px',
                        'font-size': _default.printType ? '25px' : '16px',
                        'font-weight': 'bold',
                        'text-align': _default.printType ? 'center' : undefined,
                    })
                    $reportHeader.find('.para').css({
                        color: _default.printType ? '' : '#63696a',
                        margin: '0px',
                        'font-size': _default.printType ? '16px' : '13px',
                    }).find('.para-label').css({
                        'font-weight': 'bold',
                    })
                    $reportHeader.find(".print-datetime").css({
                        float: 'right',
                    });
                    if (_default.exportType) {
                        $reportHeader
                            .find('.para').css({color: ''}).end()
                            .find('.page-title').css({'margin-bottom': '5px'}).end();
                    }
                }
                return $reportHeader.html();
            // case 'object':
            //     return {
            //         title: _default.title,
            //         label: detail.label,
            //         value: detail.value,
            //         startTime: _default.StartTime,
            //         endTime: _default.EndTime,
            //         reportedDate: reportedDate,
            //     };
        }
    },
    getTitle: function (params, isPlainText) {
        return this.getTextMultilang(params, isPlainText, "title");
    },
    getPageName: function (params, isPlainText) {
        return this.getTextMultilang(params, isPlainText, "pageName");
    },
    getTextMultilang: function (params, isPlainText, name) {
        if (typeof isPlainText === 'undefined') {
            isPlainText = false;
        }
        var opts = this.setting;
        if (typeof params === 'undefined') {
            isPlainText = false;
        } else if (typeof params === 'boolean') {
            isPlainText = params;
        } else if (params && typeof params === 'object') {
            opts = params;
        }

        return opts[name] || (opts[name + 'MultiLang'] ? MultiLanguageControllor.get(opts[name + 'MultiLang'], isPlainText) : '');
    },
    bindDocument: function () {
        var self = this;
        self.bindOn(document, 'click', '.export-btn[export-type]', function () {
            if (self.isInitialized || (self.setting && self.setting.virtualTalbe)) {
                var pagename;
                var doSingleExport = function (opts) {
                    var table = EupTableExtend.prototype.MultiTable.tableList.length ? EupTableExtend.prototype.MultiTable.getCurrentDisplayTable() : self;
                    if (table) {
                        if (opts === "print") {
                            table.print();
                        } else {
                            table.export(opts);
                        }
                    } else {
                        Eup.warningMessage(MultiLanguageControllor.get('Information'), MultiLanguageControllor.get('PleaseQueryData'));
                    }
                };
                switch ($(this).attr('export-type')) {
                    case 'xlsx':
                        doSingleExport({bookType: 'xlsx'});
                        break;
                    case 'xls':
                        doSingleExport({bookType: 'biff8', xmlExportType: true});
                        break;
                    case 'doc':
                        doSingleExport({bookType: 'doc', xmlExportType: false});
                        break;
                    case 'print':
                        doSingleExport("print");
                        break;
                    case 'batch_export':
                        var mainTable = EupTableExtend.prototype.MultiTable.getMainTable()
                        pagename = mainTable.getTitle(true);
                        var fileName = [pagename]
                        if (mainTable.setting.searchParams) {
                            var datetimestr = []
                            var startTime = mainTable.setting.searchParams.StartTime || mainTable.setting.searchParams.start_date
                            if (startTime) {
                                startTime = moment(startTime).format('YYYY-MM-DD')
                                if (datetimestr.indexOf(startTime) === -1) {
                                    datetimestr.push(startTime);
                                }
                            }
                            var endTime = mainTable.setting.searchParams.EndTime || mainTable.setting.searchParams.end_date
                            if (endTime) {
                                endTime = moment(endTime).format('YYYY-MM-DD')
                                if (datetimestr.indexOf(endTime) === -1) {
                                    datetimestr.push(endTime);
                                }
                            }
                            if (datetimestr.length) {
                                fileName.push(datetimestr.join("~"))
                            }
                        }
                        var wb = {SheetNames: [], Sheets: {}, Props: {Title: pagename, Author: 'Eup'}};
                        var tableList = EupTableExtend.prototype.MultiTable.getRealTableList();
                        var doExport = function (index, callback) {
                            if (index < tableList.length) {
                                tableList[index].export({
                                    batch_export: true,
                                    callback: function (ws) {
                                        var sheetName = tableList[index].setting.sheetName ? tableList[index].getTextMultilang(tableList[index].setting, true, "sheetName") : tableList[index].getTitle(true);
                                        if (sheetName !== pagename) {
                                            sheetName = sheetName.replace(pagename, "").trim()
                                        }
                                        if (sheetName[0] === "_") {
                                            sheetName = sheetName.substr(1)
                                        }
                                        if (sheetName.length > 31) {
                                            sheetName = sheetName.split(",")[0].trim();
                                            if (sheetName.length > 31) {
                                                sheetName = sheetName.substring(0, 31);
                                            }
                                        }

                                        //avoid duplicate sheetname
                                        var _sheetName = sheetName;
                                        var _index = 0
                                        while (wb.SheetNames.indexOf(sheetName) !== -1) {
                                            sheetName = _sheetName + " (" + ++_index + ")"
                                        }
                                        XLSX.utils.book_append_sheet(wb, ws, sheetName);
                                        doExport(index + 1, callback);
                                    },
                                    title: pagename,
                                });
                            } else {
                                callback();
                            }
                        };
                        doExport(0, function () {
                            var wbout = XLSX.write(wb, {bookType: self.bookType, bookSST: true, type: 'binary'});
                            saveAs(new Blob([EupTableExtend.prototype.s2ab(wbout)]), fileName.join("_") + ".xlsx", {autoBom: true});
                        });
                        break;
                    case 'batch_print':
                        pagename = EupTableExtend.prototype.MultiTable.getMainTable().getTitle(true);
                        var iframeId = "EupTableExtend_Iframe_Print_BatchPrint";

                        self.printThisContent(iframeId, pagename, function () {
                            var tableContainer = '';
                            EupTableExtend.prototype.MultiTable.getRealTableList().forEach(function (table) {
                                tableContainer += ("<div style='height: 20px; width: 100%' ></div>" + table.generatePrintTable().innerHTML);
                            });
                            return tableContainer
                        })
                        break
                }
            } else {
                Eup.warningMessage(MultiLanguageControllor.get('Information'), MultiLanguageControllor.get('PleaseQueryData'));
            }
        });
    },
    MultiTable: {
        tableList: [],
        removeTable: function (table) {
            for (var i = 0; i < EupTableExtend.prototype.MultiTable.tableList.length; i++) {
                if (EupTableExtend.prototype.MultiTable.tableList[i].setting.id === table.setting.id) {
                    EupTableExtend.prototype.MultiTable.tableList.splice(i, 1);
                    break;
                }
            }
        },
        addTable: function (table) {
            if (table.setting.onTableList) {
                var include = false;
                for (var i = 0; i < EupTableExtend.prototype.MultiTable.tableList.length; i++) {
                    if (EupTableExtend.prototype.MultiTable.tableList[i].setting.id === table.setting.id) {
                        EupTableExtend.prototype.MultiTable.tableList[i] = table;
                        include = true;
                    }
                }
                if (!include) {
                    EupTableExtend.prototype.MultiTable.tableList.push(table);
                }
            }
        },
        getMainTable: function () {
            return this.tableList.filter(function (table) {
                return table.setting.onTableListMainTable === true;
            })[0];
        },
        getRealTableList: function () {
            return this.tableList.filter(function (table) {
                return table.setting.virtualTalbe !== true;
            });
        },
        getCurrentDisplayTable: function () {
            var popupTable = this.tableList.filter(function (table) {
                return (table.setting.container_table && table.setting.container_table.parents('.layui-layer-content').length > 0)
            })[0];
            if (popupTable) {
                return popupTable;
            }
            return this.tableList.filter(function (table) {
                try {
                    return table.setting.container_table.is(":visible");
                } catch (e) {
                    return false;
                }
            })[0];
        },
    },
    s2ab: function (s) {
        if (typeof ArrayBuffer !== 'undefined') {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        } else {
            var buf = new Array(s.length);
            for (var i = 0; i != s.length; ++i) buf[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }
    },
    resizeFixedColumn: function () {
        var self = this;
        if (self.setting.fixedColumnLeft) {
            self.headers.getFixedLeftHeaders().forEach(function (header) {
                var left = self.headers.getPrevHeadersWidth(header) + "px";
                self.setting.container_table.find(">tbody>tr>td[" + self.td_field_name + "='" + header._name + "']").css('left', left);
                self.setting.container_table.find(">thead>tr>th[" + self.td_field_name + "='" + header._name + "']").css('left', left);
            });
        }
        if (self.setting.fixedColumnRight) {
            self.headers.getFixedRightHeaders().forEach(function (header) {
                var left = self.headers.getNextHeadersWidth(header) + "px";
                self.setting.container_table.find(">tbody>tr>td[" + self.td_field_name + "='" + header._name + "']").css('right', left);
                self.setting.container_table.find(">thead>tr>th[" + self.td_field_name + "='" + header._name + "']").css('right', left);
            });
        }
    },
    hideColumns: function (columns) {
        if (typeof columns === 'string') {
            columns = [columns];
        }
        if (!Array.isArray(columns)) {
            console.error("Invalid columns", columns);
            return;
        }

        this.headers.hideColumns(columns);

        var thSelector = [];
        var tdSelector = [];
        for (var i = 0; i < columns.length; i++) {
            thSelector.push("thead>tr>th[" + this.td_field_name + "='" + columns[i] + "']");
            tdSelector.push("tbody>tr>td[" + this.td_field_name + "='" + columns[i] + "']");
        }
        this.setting.container_table.find(thSelector.join(',') + "," + tdSelector.join(',')).addClass("column_hidden");
        this.setTableWidth();
    },
    showColumns: function (columns) {
        if (typeof columns === 'string') {
            columns = [columns];
        }
        if (!Array.isArray(columns)) {
            console.error("Invalid columns", columns);
            return;
        }

        this.headers.showColumns(columns);

        var thSelector = [];
        var tdSelector = [];
        for (var i = 0; i < columns.length; i++) {
            thSelector.push("thead>tr>th[" + this.td_field_name + "='" + columns[i] + "']");
            tdSelector.push("tbody>tr>td[" + this.td_field_name + "='" + columns[i] + "']");
        }
        this.setting.container_table.find(thSelector.join(',') + "," + tdSelector.join(',')).removeClass("column_hidden");
        this.setTableWidth();
    },
    Event: {
        events: [],//{id, params, callback, _this, table}
        removebyId: function (id) {
            var length = EupTableExtend.prototype.Event.events.length;
            for (var i = 0; i < length; i++) {
                var event = EupTableExtend.prototype.Event.events[i]
                if (event && event.id === id) {
                    EupTableExtend.prototype.Event.events.splice(i, 1)
                    length--
                    i--
                }
            }
        },
        click: function (id) {
            for (var i = 0; i < EupTableExtend.prototype.Event.events.length; i++) {
                var event = EupTableExtend.prototype.Event.events[i]
                if (event.id === id) {
                    event.callback.call(event._this, event.params)
                    return
                }
            }
        },
        clear: function (table) {
            var length = EupTableExtend.prototype.Event.events.length;
            for (var i = 0; i < length; i++) {
                var event = EupTableExtend.prototype.Event.events[i]
                if (event && event.table === table) {
                    EupTableExtend.prototype.Event.events.splice(i, 1)
                    length--
                    i--
                }
            }
        }
    },
    destroy: function () {
        this.isInitialized = false
        this.Event.clear(this);
    },
    destroyAll: function () {
        EupTableExtend.prototype.Event.events.length = 0;
        EupTableExtend.prototype.MultiTable.tableList.length = 0;
    },
    getStringCompareFun: function () {
        var quickCompareFun = function (item1, item2) {
            return item1.localeCompare(item2)
        }
        var locale = MultiLanguage.getCurrentLocale();
        var detailCompareFun = function (item1, item2) {
            return item1.localeCompare(item2, locale, {
                sensitivity: "accent"
            })
        }

        //debug only
        if (EupTableExtend.quickCompare === true) {
            return quickCompareFun
        } else if (EupTableExtend.detailCompare === true) {
            return detailCompareFun
        }

        if (this.data.length > 300) {
            return quickCompareFun
        } else {
            return detailCompareFun
        }
    },
    isResponsive: function () {
        return Eup.Layout.isMobileSize() && this.setting.isResponsive;
    },
    removeHtmlTag: function (content) {
        content = content.toString().replace(/<br>/g, "&#010;");
        return content.replace(/(<([^>]+)>)/ig, "");
    },
    renderFilterBlock: function () {
        var self = this;
        if (self.setting.addFilterBlock) {
            if (self.setting.container.find('.table_extend_filter_wrap').length === 0) {
                var html = '';
                var button_id = self.setting.id + '_filter';
                html += '<div id="' + button_id + '" class="table_extend_filter_wrap">';
                html += '<input id="table_extend_filter" type="search" class="table_extend_filter" placeholder="' + MultiLanguageControllor.get("Query", true) + '">';
                html += '</div>';

                self.setting.container.append(html);
                self.setting.container.addClass('eup-table-search-button');

                self.bindOn(self.setting.container, 'keyup', '.table_extend_filter_wrap >input', function (e) {
                    var origin_data = self.data.slice();
                    self.data = self.filterDataByKey(self.data);
                    self.renderTable();
                    self.scrollToFirstRow();
                    self.data = origin_data; //reload data

                    //add clear input
                    input = self.setting.container.find('.table_extend_filter_wrap >input');
                    filter = input.val().replace(/[-. ]/g, '').toUpperCase();
                    (filter !== '') ? input.parent().addClass('allow-clear-input') : input.parent().removeClass('allow-clear-input');
                });
            }
        } else {
            self.setting.container.removeClass('eup-table-search-button');
        }

        Eup.Layout.hookEventLayoutChangeLanguage(function (oldLang, newLang) {
            $(".table_extend_filter").attr("placeholder", MultiLanguageControllor.get("Query", true));
        });
    },
    filterDataByKey: function (data) {
        var self = this;
        if (!self.setting.addFilterBlock || !data || data.length == 0) {
            return data;
        }
        var input, filter, ul, li;
        input = self.setting.container.find('.table_extend_filter_wrap >input');
        filter = input.val().replace(/[-. ]/g, '').toUpperCase();

        if (filter !== '') {
            data = data.filter(function (el) {
                for (var k = 0; k < self.headers_data.length; k++) {
                    var _field = self.headers_data[k];
                    var td_value = self.generateTdValue(el, _field, true).toString().replace(/[-. ]/g, '').toUpperCase();
                    if (_field.searchable !== false && (td_value.indexOf(filter) > -1)) {
                        return true;
                    }
                }
            });
        }
        return data;
    },
    getPageReportTabName: function (opts) {
        var defaults = {
            Car_Unicode: '',
            Car_Number: 'All',
            Car_Driver: '',
        }
        $.extend(defaults, opts);
        return defaults.Car_Number + ((defaults.Car_Driver != undefined && defaults.Car_Driver != null && defaults.Car_Driver != '') ? ', ' + defaults.Car_Driver : '');
    },
    getFullTableHtml: function () {
        var self = this;
        var tableContainer = self.generatePrintTable();
        return tableContainer;
    }
};

EupTableExtend.SumupFieldConfig = function (config) {
    if (Array.isArray(config.fields) && config.fields.length) {
        this.fields = [];
        for (var i = 0; i < config.fields.length; i++) {
            var field = config.fields[i]
            if (typeof field === "string") {
                field = {
                    field: field,
                }
            }
            this.fields.push(field)
        }

        var _default = {
            colspan: undefined,
            initialValue: 0,
            reduce: function (accumulator, currentValue) {
                if (!isNaN(currentValue)) {
                    accumulator += currentValue
                }
                return accumulator
            },
            notbold: false,
            format: undefined,
            endPageRow: false,//add sumup row to end of page
        }

        for (var key in _default) {
            if (config[key] !== undefined) {
                _default[key] = config[key]
            }
            if (_default[key] !== undefined) {
                this[key] = _default[key]
            }
        }
    } else {

    }
}
EupTableExtend.SumupFieldConfig.prototype = {
    hasField: function (fieldName) {
        return this.getField(fieldName) !== undefined
    },
    getField: function (fieldName) {
        for (var i = 0; i < this.fields.length; i++) {
            if (this.fields[i].field === fieldName) {
                return this.fields[i]
            }
        }
    },
    getInitialValue: function (field) {
        if (typeof field === "string") {
            for (var i = 0; i < this.fields.length; i++) {
                if (this.fields[i].field === field) {
                    return this.fields[i].initialValue !== undefined ? this.fields[i].initialValue : this.initialValue
                }
            }
        } else {
            return field.initialValue !== undefined ? field.initialValue : this.initialValue
        }
    },
    getReduce: function (field) {
        if (typeof field === "string") {
            for (var i = 0; i < this.fields.length; i++) {
                if (this.fields[i].field === field) {
                    return this.fields[i].reduce !== undefined ? this.fields[i].reduce : this.reduce
                }
            }
        } else {
            return field.reduce !== undefined ? field.reduce : this.reduce
        }
    },
    getFormat: function (field) {
        if (typeof field === "string") {
            for (var i = 0; i < this.fields.length; i++) {
                if (this.fields[i].field === field) {
                    return this.fields[i].format !== undefined ? this.fields[i].format : this.format
                }
            }
        } else {
            return field.format !== undefined ? field.format : this.format
        }
    }
}
EupTableExtend.TextAlign = function (align) {
    this.align = 'center';
    if (typeof align === 'undefined') {
    } else if (typeof align === 'string') {
        this.align = align;
    } else if (typeof align === 'object') {
        if (align.alignLeft === true) {
            this.align = 'left';
        } else if (align.alignRight === true) {
            this.align = 'right';
        } else {
            if (typeof align.align === "function") {
                this.align = align.align
            } else {
                this.align = ["left", "center", "right"].indexOf(align.align) !== -1 ? align.align : 'center';
            }
        }
    } else {
        console.error('Invalid text align', align);
    }
};
EupTableExtend.TextAlign.prototype = {
    getClassName: function (hookArguments) {
        var align = this.getAlign(hookArguments)
        return this.AlignClassNameMapping[align];
    },
    getAlign: function (hookArguments) {
        if (typeof this.align === "string") {
            return this.align || 'center'
        } else if (typeof this.align === "function") {
            return this.align(hookArguments) || 'center'
        }
    },
    AlignClassNameMapping: {
        center: 'text-center',
        left: 'text-left',
        right: 'text-right',
    },
    getDocxAlignmentType: function (hookArguments) {
        var align = this.getAlign(hookArguments)
        if (align === 'left') {
            return docx.AlignmentType.LEFT;
        } else if (align === 'right') {
            return docx.AlignmentType.RIGHT;
        } else {
            return docx.AlignmentType.CENTER;
        }
    },
};
EupTableExtend.ExportDocument = function (opts) {
    var self = this;
    var formats = Eup.Format.getExportFormat(true) || {};
    self.export_float_format = formats.export_float_format;
    self.export_integer_format = formats.export_integer_format;
    self.export_currency_format = formats.export_currency_format;

    var _default = {
        ext: null,
        params: {},
        dataTable: [],
        reportTableHeader: null,
        getEmptyRow: function () {
            return [];
        },
        addCell: function (opts) {//cellValue, row, field, isHeader, isGroupBtn, isSumupTitleCell, isSumupValueCell, colspan
        },
        addRow: function (row, isHeader) {
        },
        addReportHeader: function (reportTableHeader) {
        },
        generateDocument: function (params, callback) {
        },
        save: function (doc) {
        },
    };
    $.extend(_default, opts);
    for (var key in _default) {
        self[key] = _default[key];
    }
};
EupTableExtend.ExportDocument.prototype = {
    _save: function (blob, fileName) {
        saveAs(blob, fileName, {autoBom: true});
    },
    clearData: function () {
        this.params = {};
        this.dataTable = [];
        this.reportTableHeader = null;
    },
    isHeaderFieldEnable: function (field) {
        return true;
    },
};
EupTableExtend.ExportDocxDocument = new EupTableExtend.ExportDocument({
    ext: 'doc',
    bookType: 'doc',
    getEmptyRow: function () {
        return [];
    },
    transformCellValue: function (cellValue) {
        if (isNaN(cellValue) && typeof cellValue !== 'string') {
            cellValue = '';
        }
        if (!isNaN(cellValue)) {
            cellValue = cellValue.toString();
        }
        return cellValue;
    },
    addCell: function (opts) {
        if (opts.field && opts.field.patched_type === 'horizontal') {
            return;
        }

        if (!isNaN(opts.cellValue)) {
            opts.cellValue = opts.cellValue.toString()
        }

        var textRunOpts = {
            text: opts.cellValue,
        };
        var paragraphOpts = {};
        if (opts.isHeader) {
            paragraphOpts.alignment = docx.AlignmentType.CENTER;
            textRunOpts.bold = true;
        } else if (opts.isGroupBtn) {
            paragraphOpts.alignment = docx.AlignmentType.LEFT;
        } else {
            if (opts.field) {
                paragraphOpts.alignment = opts.field._textAlign.getDocxAlignmentType(opts.hookArguments);
            }
        }
        if (opts.isSumupValueCell || opts.isSumupTitleCell) {
            textRunOpts.bold = true;
        }
        if (opts.isSumupTitleCell) {
            paragraphOpts.alignment = docx.AlignmentType.CENTER;
        }
        if (opts.hookArguments !== undefined && (opts.hookArguments.current_data.isTotalRow === true || opts.hookArguments.current_data.isTotalAll === true)) {
            textRunOpts.bold = true;
        }
        paragraphOpts.children = [new docx.TextRun(textRunOpts)];
        var docxParagraph = new docx.Paragraph(paragraphOpts);

        var cellOpts = {
            children: [docxParagraph],
            width: {
                size: (opts.field && opts.field.width ? opts.field.width * 10 : 1000),
                type: docx.WidthType.DXA,
            },
            margins: {
                top: 100,
                bottom: 100,
                left: 100,
                right: 100,
            },
        };

        if (opts.isHeader) {
            cellOpts.verticalAlign = docx.VerticalAlign.CENTER;
        } else if (opts.isGroupBtn) {
            cellOpts.columnSpan = this.params.headers_data.length;
        }

        if (opts.colspan) {
            cellOpts.columnSpan = opts.colspan;
        } else {
            if (opts.field) {
                if (!isNaN(opts.field.rowspan) && opts.field.rowspan > 1) {
                    if (!opts.field.patched) {
                        cellOpts.verticalMerge = docx.VerticalMergeType.RESTART;
                    }
                    // cellOpts.rowSpan = opts.field.rowspan;
                } else {
                    if (opts.field.patched_type === 'vertical') {
                        cellOpts.verticalMerge = docx.VerticalMergeType.CONTINUE;
                    }
                }

                if (!isNaN(opts.field.colspan) && opts.field.colspan > 1) {
                    cellOpts.columnSpan = opts.field.colspan;
                }
            }
        }

        if (opts.VerticalMergeType) {
            switch (opts.VerticalMergeType) {
                case "RESTART":
                    cellOpts.verticalMerge = docx.VerticalMergeType.RESTART;
                    break
                case "CONTINUE":
                    cellOpts.verticalMerge = docx.VerticalMergeType.CONTINUE;
                    break
            }
        }

        opts.row.push(new docx.TableCell(cellOpts));
    },
    addRow: function (row, isHeader) {
        this.dataTable.push(new docx.TableRow({
            children: row,
            tableHeader: !!isHeader,
        }));
    },
    addReportHeader: function (reportTableHeader) {
        var self = this;
        self.reportTableHeader = reportTableHeader;

        var children = [];
        for (var i = reportTableHeader.length - 1; i >= 0; i--) {
            children.unshift(new docx.Paragraph({
                children: [new docx.TextRun({
                    text: reportTableHeader[i],
                    bold: true,
                    size: i === 0 ? 25 : undefined,
                })],
                alignment: docx.AlignmentType.CENTER,
            }));
        }

        self.dataTable.unshift(new docx.TableRow({
            children: [new docx.TableCell({
                children: children,
                columnSpan: self.params.headers_data.length,
                margins: {
                    top: 100,
                    bottom: 100,
                    left: 100,
                    right: 100,
                },
            })],
        }));
    },
    generateDocument: function (params, callback) {
        var self = this;

        var font = "Times New Roman"
        if (["CHT", "CHS"].indexOf(MultiLanguage.getCurrentLang()) !== -1) {
            font = "MingLiU"
        }
        var doc = new docx.Document({
            styles: {
                paragraphStyles: [
                    {
                        id: "Normal",
                        name: "Normal",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: font,
                        },
                    },
                ],
            },
        });

        var docxtable = new docx.Table({
            rows: self.dataTable,
        });

        doc.addSection({
            children: [docxtable],
        });
        callback(params, doc);
    },
    save: function (doc, fileName) {
        var self = this;

        docx.Packer.toBlob(doc).then(function (blob) {
            self._save(blob, fileName);
        });
    },
    isHeaderFieldEnable: function (field) {
        // return !field.patched;
        return true;
    },
});
EupTableExtend.ExportSheetJSDocument = new EupTableExtend.ExportDocument({
    ext: 'xlsx',
    bookType: 'xlsx',
    getEmptyRow: function () {
        return [];
    },
    addCell: function (opts) {
        if (Array.isArray(opts.cellValue) || (isNaN(opts.cellValue) && typeof opts.cellValue !== 'string')) {
            opts.cellValue = '';
        }

        if (opts.isHeader) {
            if (typeof this.params.header_width === 'undefined') {
                this.params.header_width = [];
            }
            var childCount = opts.field.childrens ? Object.keys(opts.field.childrens).length : 1
            var width = parseInt(opts.field.width / childCount) / 8;
            if (isNaN(width)) {
                width = 20
            }
            this.params.header_width.push({width: width});

            if (opts.field.rowspan > 1 || opts.field.colspan > 1) {
                if (typeof this.params.merges_headers === 'undefined') {
                    this.params.merges_headers = [];
                }
                var c = opts.row.length;
                var r = this.dataTable.length;
                this.params.merges_headers.push({
                    s: {r: r, c: c},
                    e: {
                        r: r + (typeof opts.field.rowspan !== undefined ? (opts.field.rowspan - 1) : 0),
                        c: c + (typeof opts.field.colspan !== undefined ? (opts.field.colspan - 1) : 0),
                    },
                });
            }
        } else {
            if ((typeof opts.rowspan === "number" && opts.rowspan > 1)) {
                if (typeof this.params.merges_cells === 'undefined') {
                    this.params.merges_cells = [];
                }
                var c = opts.row.length;
                var r = this.dataTable.length;
                this.params.merges_cells.push({
                    s: {r: r, c: c},
                    e: {
                        r: r + (typeof opts.rowspan !== undefined ? (opts.rowspan - 1) : 0),
                        c: c,
                    },
                });
            }
        }

        if (opts.isGroupBtn) {
            if (typeof this.params.merges_groupbtn === 'undefined') {
                this.params.merges_groupbtn = [];
            }
            this.params.merges_groupbtn.push(this.dataTable.length)
        }

        if (opts.isSumupTitleCell) {
            if (typeof this.params.merge_sumuprow === 'undefined') {
                this.params.merge_sumuprow = [];
            }
            var c = opts.row.length;
            var r = this.dataTable.length;
            this.params.merge_sumuprow.push({
                s: {r: r, c: c},
                e: {
                    r: r,
                    c: c + opts.colspan - 1,
                },
            });
        }

        opts.row.push(opts.cellValue);

        if (opts.isSumupTitleCell) {
            if (!isNaN(opts.colspan) && opts.colspan > 1) {
                //add empty cell for mergering purpose
                for (var i = 0; i < opts.colspan - 1; i++) {
                    opts.row.push("");
                }
            }
        }
    },
    addRow: function (row, isHeader) {
        this.dataTable.push(row);
    },
    addReportHeader: function (reportTableHeader) {
        var self = this;
        self.reportTableHeader = reportTableHeader;
        for (var i = reportTableHeader.length - 1; i >= 0; i--) {
            self.dataTable.unshift([reportTableHeader[i]]);
        }
    },
    generateDocument: function (params, callback) {
        var self = this;
        var wb = {SheetNames: [], Sheets: {}, Props: {Title: params.title, Author: 'Eup'}};
        var ws = XLSX.utils.aoa_to_sheet(self.dataTable);
        var ranges = XLSX.utils.decode_range(ws['!ref']);
        for (var c = ranges.s.c; c <= ranges.e.c; ++c) {
            var export_style = self.params.headers_data[c].exportStyle;
            for (var r = ranges.s.r; r <= ranges.e.r; ++r) {
                var _cell = ws[XLSX.utils.encode_cell({r: r, c: c})];
                if (_cell !== undefined && _cell.t == 'n') {
                    switch (export_style) {
                        case 'integer':
                        case 'number':
                            _cell.z = self.export_integer_format;
                            break;
                        case 'float':
                            _cell.z = self.export_float_format;
                            break;
                        case 'currency':
                            _cell.z = self.export_currency_format;
                            break;
                        case 'string':
                            _cell.t = 's';
                            _cell.v = String(_cell.v);
                            break;
                        default:
                            if (String(_cell.v).indexOf('.') !== -1 || String(_cell.v).indexOf(',') !== -1) {
                                _cell.z = self.export_float_format;
                            } else {
                                _cell.z = self.export_integer_format;
                            }
                            break
                    }
                }
            }
        }

        ws['!cols'] = [];
        if (Array.isArray(self.params.header_obj)) {
            ws['!cols'] = self.params.header_width;
        }
        ws['!merges'] = [];
        var totalColumn = self.params.headers_data.length
        if (self.reportTableHeader) {
            for (var i = self.reportTableHeader.length - 1; i >= 0; i--) {
                ws['!merges'].push({
                    s: {r: i, c: 0},
                    e: {r: i, c: totalColumn - 1},
                });
            }
        }

        //get start row index of header table
        var headerIndex = 0;
        for (headerIndex = 0; headerIndex < self.dataTable.length; headerIndex++) {
            if (_.isEqual(self.dataTable[headerIndex], self.params.header_obj[0])) {
                break;
            }
        }
        if (Array.isArray(self.params.merges_headers)) {
            for (var i = 0; i < self.params.merges_headers.length; i++) {
                var mergesCell = self.params.merges_headers[i];
                mergesCell.s.r += headerIndex;
                mergesCell.e.r += headerIndex;
                ws['!merges'].push(mergesCell);
            }
        }

        if (Array.isArray(self.params.merges_cells)) {
            for (var i = 0; i < self.params.merges_cells.length; i++) {
                var mergesCell = self.params.merges_cells[i];
                mergesCell.s.r += headerIndex;
                mergesCell.e.r += headerIndex;
                ws['!merges'].push(mergesCell);
            }
        }

        if (Array.isArray(self.params.merges_groupbtn)) {
            for (var i = 0; i < self.params.merges_groupbtn.length; i++) {
                var index = self.params.merges_groupbtn[i];
                ws['!merges'].push({
                    s: {r: headerIndex + index, c: 0},
                    e: {r: headerIndex + index, c: totalColumn - 1},
                });
            }
        }

        if (Array.isArray(self.params.merge_sumuprow)) {
            for (var i = 0; i < self.params.merge_sumuprow.length; i++) {
                var mergesCell = self.params.merge_sumuprow[i];
                mergesCell.s.r += headerIndex;
                mergesCell.e.r += headerIndex;
                ws['!merges'].push(mergesCell);
            }
        }

        if (params.batch_export) {
            callback(params, ws);
            return;
        }
        var sheetName = params.sheetName || params.title;
        if (sheetName.length > 31) {
            sheetName = sheetName.split(",")[0].trim();
            if (sheetName.length > 31) {
                sheetName = sheetName.split("_");
                if (sheetName[1] === undefined) {
                    sheetName = sheetName[0].substring(0, 31);
                } else {
                    sheetName = sheetName[1].trim();
                }
            }
        }
        var modifyName = sheetName.replace(/[\\.,/*?]/g, "");
        XLSX.utils.book_append_sheet(wb, ws, modifyName);
        var wbout = XLSX.write(wb, {bookType: self.bookType, bookSST: true, type: 'binary'});
        callback(params, wbout);
    },
    save: function (doc, fileName) {
        this._save(new Blob([EupTableExtend.prototype.s2ab(doc)]), fileName);
    },
});
EupTableExtend.SheetJSExtensionMapping = {
    xlsx: 'xlsx',
    xlsm: 'xlsm',
    xlsb: 'xlsb',
    biff8: 'xls',
    biff5: 'xls',
    biff2: 'xls',
    xlml: 'xls',
    ods: 'ods',
    fods: 'fods',
    csv: 'csv',
    txt: 'txt',
    sylk: 'sylk',
    html: 'html',
    dif: 'dif',
    dbf: 'dbf',
    rtf: 'rtf',
    prn: 'prn',
    eth: 'eth',
};


