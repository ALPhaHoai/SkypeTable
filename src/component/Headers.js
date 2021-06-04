EupTableExtend.Headers = function (fields) {
    var self = this;
    if (typeof fields !== 'undefined') {
        //Field setting backward compatibility
        for (var key in fields) {
            var field = fields[key];
            if (field.name && !field.text && !field.textStr) {
                var multilang = Eup.HtmlHelper.parseMultiLang(field.name);
                if (multilang.multilang) {
                    field.text = multilang.multilang;
                } else {
                    field.textStr = field.name;
                }
            }
        }

        self.headers = self.getHeaders(fields);
    }
};
EupTableExtend.Headers.prototype = {
    clone: function () {
        var self = this;
        var headers = [];
        for (var i = 0; i < self.headers.length; i++) {
            headers[i] = [];
            for (var j = 0; j < self.headers[i].length; j++) {
                headers[i].push(self.headers[i][j].clone());
            }
        }
        var clone = new EupTableExtend.Headers();
        clone.headers = headers;
        return clone;
    },
    get: function (name) {
        var self = this;
        for (var i = 0; i < self.headers.length; i++) {
            for (var j = 0; j < self.headers[i].length; j++) {
                if (self.headers[i][j]._name === name) {
                    return self.headers[i][j];
                }
            }
        }
    },
    getFirstTrFieldLength: function () {
        return this.headers[0].length;
    },
    getFirstTrFieldTotalWidth: function () {
        var width = 0;
        for (var i in this.headers[0]) {
            var field = this.headers[0][i];
            if (field.isFieldEnable() && field.isFieldShow()) {
                var fieldWidth = field.width;
                if (isNaN(fieldWidth)) {
                    console.error("Field " + field._name + " not set width");
                    fieldWidth = 100;
                }
                width += parseInt(fieldWidth);
            }
        }
        return width;
    },
    getHeadersData: function () {
        var self = this;
        var headers_data = [];
        for (var i in self.headers[0]) {
            self.headers[0][i].getChild(headers_data, function (params, field) {
                if (!(field instanceof EupTableExtend.Header)) {
                    field = self.get(field._name);
                }
                params.push(field);
            });
        }
        return headers_data;
    },
    getPatchedHeaders: function (type) {//vertical, horizontal, both
        var self = this;
        if (typeof type === 'undefined') {
            type = 'both';
        }
        var headers = self.clone();
        var h = headers.headers;
        var r = 0, c = 0, cell, cellClone;
        while (r < h.length) {
            while (c < h[r].length) {
                cell = h[r][c];
                if ((type === 'horizontal' || type === 'both') && cell.colspan && cell.colspan > 1) {
                    for (var i = 0; i < cell.colspan - 1; i++) {
                        cellClone = cell.clone();
                        cellClone.patched = true;
                        cellClone.patched_type = 'horizontal';
                        delete cellClone.colspan;
                        h[r].splice(c + 1, 0, cellClone);
                    }
                }
                if ((type === 'vertical' || type === 'both') && cell.rowspan && cell.rowspan > 1) {
                    for (var i = 1; i < cell.rowspan; i++) {
                        cellClone = cell.clone();
                        cellClone.patched = true;
                        cellClone.patched_type = 'vertical';
                        delete cellClone.rowspan;
                        h[r + i].splice(c, 0, cellClone);
                    }
                }
                c++;
            }
            r++;
        }
        return headers;
    },
    getHeaders: function (fields_setting, headers, level, parent) {
        var self = this;
        headers = headers || [];
        parent = parent || [];
        level = level || 0;
        headers[level] = headers[level] || [];

        for (var key in fields_setting) {
            var field = new EupTableExtend.Header(fields_setting[key], key);
            if (field.isFieldEnable()) {
                field.parent = parent.slice();
                headers[level].push(field);
                if (field.childrens && Object.keys(field.childrens).length) {
                    field.sortable = false;
                    var _parent = parent.slice();
                    _parent.unshift(key);
                    self.getHeaders(field.childrens, headers, level + 1, _parent);
                }
            }
        }
        return headers;
    },
    add: function (field, i, j) {
        var self = this;
        if (!(field instanceof EupTableExtend.Header)) {
            field = new EupTableExtend.Header(field);
        }

        if (field.isFieldEnable()) {
            if (field.isIncreaseField()) {
                self.headers[0].unshift(field);
            } else {
                if (typeof j !== 'undefined') {
                    self.headers[i][j].splice(j, 1, field);
                } else {
                    self.headers[i].push(field);
                }
            }
        }
    },
    getFixedLeftHeaders: function () {
        var self = this;
        var headerFixedLeft = [];
        for (var i = 0; i < self.headers.length; i++) {
            for (var j = 0; j < self.headers[i].length; j++) {
                if (self.headers[i][j].isFixedLeft()) {
                    headerFixedLeft.push(self.headers[i][j]);
                }
            }
        }
        return headerFixedLeft;
    },
    getFixedRightHeaders: function () {
        var self = this;
        var headerFixedLeft = [];
        for (var i = 0; i < self.headers.length; i++) {
            for (var j = 0; j < self.headers[i].length; j++) {
                if (self.headers[i][j].isFixedRight()) {
                    headerFixedLeft.push(self.headers[i][j]);
                }
            }
        }
        return headerFixedLeft;
    },
    getPrevHeaders: function (header) {
        var self = this;
        var headerName = header._name || header;
        for (var i = 0; i < self.headers.length; i++) {
            for (var j = 0; j < self.headers[i].length; j++) {
                if (self.headers[i][j]._name === headerName) {
                    return self.headers[i].slice(0, j);
                }
            }
        }
    },
    getNextHeaders: function (header) {
        var self = this;
        var headerName = header._name || header;
        for (var i = 0; i < self.headers.length; i++) {
            for (var j = 0; j < self.headers[i].length; j++) {
                if (self.headers[i][j]._name === headerName) {
                    return self.headers[i].slice(j + 1);
                }
            }
        }
    },
    getHeadersWidth: function (headers) {
        var width = 0;
        headers.forEach(function (currentField) {
            width += currentField.width;
        });
        return width;
    },
    getPrevHeadersWidth: function (header) {
        var prevFields = this.getPrevHeaders(header);
        return this.getHeadersWidth(prevFields);
    },
    getNextHeadersWidth: function (header) {
        var nextFields = this.getNextHeaders(header);
        return this.getHeadersWidth(nextFields);
    },
    hideColumns: function (columns) {
        var self = this;
        for (var i = 0; i < self.headers.length; i++) {
            for (var j = 0; j < self.headers[i].length; j++) {
                if (columns.indexOf(self.headers[i][j]._name) !== -1) {
                    self.headers[i][j].hide();
                }
            }
        }
    },
    showColumns: function (columns) {
        var self = this;
        for (var i = 0; i < self.headers.length; i++) {
            for (var j = 0; j < self.headers[i].length; j++) {
                if (columns.indexOf(self.headers[i][j]._name) !== -1) {
                    self.headers[i][j].show();
                }
            }
        }
    },
};