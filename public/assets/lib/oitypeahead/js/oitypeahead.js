!function($){

    "use strict"; // jshint ;_;


 /* TYPEAHEAD PUBLIC CLASS DEFINITION
    * ================================= */

    var Oitypeahead = function (element, options) {
        this.$element = $(element)
        this.options = $.extend({}, $.fn.oitypeahead.defaults, options)
        this.matcher = this.options.matcher || this.matcher
        this.sorter = this.options.sorter || this.sorter
        this.highlighter = this.options.highlighter || this.highlighter
        this.updater = this.options.updater || this.updater
        this.render = this.options.render || this.render
        this.select = this.options.select || this.select
        this.$menu = $(this.options.menu).appendTo('body')
        this.source = this.options.source
        this.shown = false
        this.listen()
    }

    Oitypeahead.prototype = {

        constructor: Oitypeahead,

        select: function () {

            var val = this.$menu.find('.active').attr('data-value'),
                item = this.$menu.find('.active').data().item

            if(this.options.update_prev){
                this.$element.val(item[this.options.field_val])
            }

            this.$element
                .data('value', item.value)
                .data('selected_item', item)
                .val(this.updater(val))
                .trigger('change', [item])

            if(this.options.selected != null){
                this.options.selected.call(this.$element, item)
            }

            return this.hide()

        },

        clear_selection : function(){

            var that = this

            if(!that.$element.val().length){

                this.$element
                    .data('value', item.value)
                    .data('selected_item', item)
                    .val(this.updater(val))
                    .trigger('change', [item])

            }

        },

        updater : function(item){
            return item
        },

        show: function () {
            var pos = $.extend({}, this.$element.offset(), {
                height: this.$element[0].offsetHeight
            })

            this.$menu.css({
                top: pos.top + pos.height,
                left: pos.left
            })

            this.$menu.show()
            this.shown = true
            return this
        },

        hide: function () {
            this.$menu.hide()
            this.shown = false
            return this
        },

        lookup: function (event) {
            var items

            this.query = this.$element.val()

            if (!this.query || this.query.length < this.options.minLength) {
                return this.shown ? this.hide() : this
            }

            items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source

            return items ? this.process(items) : this
        },

        process: function (items) {
            var that = this

            items = $.grep(items, function (item) {
                return that.matcher(item)
            })

            items = this.sorter(items)

            if (!items.length) {
                return this.shown ? this.hide() : this
            }

            return this.render(items.slice(0, this.options.items)).show()
        },

        matcher : function(item){
            return ~item[this.options.show_val]
                .toLowerCase()
                .indexOf(this
                        .query
                        .toLowerCase())
        },

        sorter : function(items){
            return items
        },

        highlighter: function (item) {
            var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
            return item[this.options.show_val].replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                return '<strong>' + match + '</strong>'
            })
        },

        render: function (items) {

            var that = this

            items = $(items).map(function (i, item) {
                i = $(that.options.item)
                        .attr('data-value', item[that.options.show_val])
                        .data('item', item)
                i.find('a').html(that.highlighter(item))
                return i[0]
            })

            items.first().addClass('active')
            this.$menu.html(items)
            return this

        },

        next: function (event) {
            var active = this.$menu.find('.active').removeClass('active'),
                next = active.next()

            if (!next.length) {
                next = $(this.$menu.find('li')[0])
            }

            next.addClass('active')
        },

        prev: function (event) {
            var active = this.$menu.find('.active').removeClass('active'),
                prev = active.prev()

            if (!prev.length) {
                prev = this.$menu.find('li').last()
            }

            prev.addClass('active')
        },

        listen: function () {

            var that = this

            this.$element
                .on('blur',         $.proxy(this.blur, this))
                .on('keypress', $.proxy(this.keypress, this))
                .on('keyup',        $.proxy(this.keyup, this))

            if ($.browser.chrome || $.browser.webkit || $.browser.msie) {
                this.$element.on('keydown', $.proxy(this.keydown, this))
            }

            if(this.$element.parent().find('.js-show_all').length){
                this.$element.parent().find('.js-show_all').on('click', function(){
                    that.show()
                })
            }

            this.$menu
                .on('click', $.proxy(this.click, this))
                .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
        },

        move: function (e) {
            if (!this.shown) return

            switch(e.keyCode) {
                case 9: // tab
                case 13: // enter
                case 27: // escape
                    e.preventDefault()
                    break

                case 38: // up arrow
                    e.preventDefault()
                    this.prev()
                    break

                case 40: // down arrow
                    e.preventDefault()
                    this.next()
                    break
            }

            e.stopPropagation()
        },

        keydown: function (e) {
            this.suppressKeyPressRepeat = !~$.inArray(e.keyCode, [40,38,9,13,27])
            this.move(e)
        },

        keypress: function (e) {
            if (this.suppressKeyPressRepeat) return
            this.move(e)
        },
        keyup: function (e) {

            if(this.options.url !== false){
                if($.inArray(e.keyCode, [40,38,9,13,27]) == -1){
                    this.search()
                }
            }

            switch(e.keyCode) {
                case 40: // down arrow
                case 38: // up arrow
                    break

                case 9: // tab
                case 13: // enter
                    if (!this.shown) return
                    this.select()
                    break

                case 27: // escape
                    if (!this.shown) return
                    this.hide()
                    break

                default:
                    this.lookup()
            }

            e.stopPropagation()
            e.preventDefault()
        },

        blur: function (e) {
            var that = this
            setTimeout(function () { that.hide() }, 150)
        },

        click: function (e) {
            e.stopPropagation()
            e.preventDefault()
            this.select()
        },
        mouseenter: function (e) {
            this.$menu.find('.active').removeClass('active')
            $(e.currentTarget).addClass('active')
        },
        search_timeout : null,
        search : function(){
            var that = this
            clearTimeout(this.search_timeout)
            this.search_timeout = setTimeout(function(){
                if(that.$element.val().length){
                    that.search_do()
                }
            }, 500)

        },
        search_do : function(){

            var that = this

            this.$element.next().find('.js-loader').addClass('icon-refresh')

            this.source = []
            this.lookup()

            $.read({
                url : that.options.url,
                data : {
                    q : that.$element.val()
                },
                success : function(data){
                    var _source = []
                    $.each(data.feed, function(idx, obj){
                        _source.push(obj)
                    })
                    
                    that.source = _source
                    that.lookup()
                    that.$element.next().find('.js-loader').removeClass('icon-refresh')
                }
            })

        }

    }


    /* TYPEAHEAD PLUGIN DEFINITION
     * =========================== */

    $.fn.oitypeahead = function (option) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('oitypeahead'),
                options = typeof option == 'object' && option

            if (!data) $this.data('oitypeahead', (data = new Oitypeahead(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.oitypeahead.defaults = {
        source: [],
        url : false,
        items: 8,
        menu: '<ul class="oitypeahead dropdown-menu"></ul>',
        item: '<li><a href="#"></a></li>',
        minLength: 1,
        update_prev : true,
        field_val : 'value',
        show_val : 'label',
        selected : null
    }

    $.fn.oitypeahead.Constructor = Oitypeahead


 /*     TYPEAHEAD DATA-API
    * ================== */

    $(function () {
        $('body').on('focus.oitypeahead.data-api', '[data-provide="oitypeahead"]', function (e) {
            var $this = $(this)
            if ($this.data('oitypeahead')) return
            e.preventDefault()
            $this.oitypeahead($this.data())
        })
    })

}(window.jQuery);
