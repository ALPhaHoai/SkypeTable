var ContextMenu = function (container_table, container_wrap_table, menuItem, tableId) {
    var self = this;
    this._container_wrap_table = container_wrap_table;
    this._container_table = container_table;
    this._context = null;
    this.tableId = tableId;
    this._data = [];
    this._menu = menuItem || [];

    self._menu.forEach(function (obj) {
        if (obj && typeof obj.onClick === 'function') {
            $(document)
                .off('click', '.eup-table-context-menu[for="' + tableId + '"] ul li[data-id=' + obj.id + ']')
                .on('click', '.eup-table-context-menu[for="' + tableId + '"] ul li[data-id=' + obj.id + ']', function () {
                    var id = $(this).attr('data-id');
                    obj.onClick.apply(null, [self._data[0], self._data[1], obj]);
                });
        }
    })



    $(document).on('click.EupTableExtend', function () {
        if (self._context !== null) {
            self._context.remove();
            self._context = null;
        }
    })
    this._container_wrap_table.scroll(function () {
        if (self._context !== null) {
            self._context.remove();
            self._context = null;
        }
    })
};
ContextMenu.prototype = {
    remove: function () {
        if (this._context !== null) {
            this._context.remove();
            this._context = null;
        }
    },
    _renderHtml: function () {
        var html = '<div class="eup-table-context-menu"  for="' + this.tableId + '" style="position: fixed;z-index: 999999999"><ul>';
        this._menu.sort(function (a, b) {
            return a.order - b.order;
        });
        for (var i = 0; i < this._menu.length; i++) {
            var item = this._menu[i];
            if (item.enable !== false) {
                if (typeof item.isShowContextCondition === 'function') {
                    try {
                        if (item.isShowContextCondition.apply(null, this._data)) {
                            html += '<li data-id="' + item.id + '" class="eup-context-menu-item" id="context_menu_' + item.id + '">' + item.icon + ' ' + MultiLanguageControllor.get(item.text) + '</li>';
                        }
                    } catch (e) {
                        console.error(e)
                    }
                } else {
                    html += '<li data-id="' + item.id + '" class="eup-context-menu-item" id="context_menu_' + item.id + '">' + item.icon + ' ' + MultiLanguageControllor.get(item.text) + '</li>';
                }
            }
        }
        html += '</ul></div>';
        return html;
    },
    show: function (e, data, tr, index) {
        var wrapOffset = this._container_wrap_table.offset();
        var point1 = {
            top: wrapOffset.top,
            left: wrapOffset.left,
        };
        var point2 = {
            top: wrapOffset.top + this._container_wrap_table.height(),
            left: wrapOffset.left + this._container_wrap_table.width(),
        };

        this._data = [data, tr, index];
        if (this._context !== null) {
            this._context.remove();
        }
        this._context = $(this._renderHtml());
        $('body').append(this._context);

        var contextSize = {
            width: this._context.width(),
            height: this._context.height()
        };
        var postion = {};

        if (typeof e.clientX != "undefined") {
            postion.left = e.clientX;
            postion.top = e.clientY;

        } else {
            postion.left = e.pageX;
            postion.top = e.pageY;
        }
        if(postion.left+contextSize.width>=point2.left){
            postion.left = postion.left - contextSize.width;
        }
        if(postion.top+contextSize.height>=point2.top){
            postion.top = postion.top - contextSize.height;
        }

        this._context.css("left", postion.left + 'px');
        this._context.css("top", postion.top + 'px');

    }
};
