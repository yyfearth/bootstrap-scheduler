"use strict"

DAY_SPAN = 86400000
EVENT_DELAY = 60

class Scheduler
  defaults:
    selectableFromNow: true
    hourlySelectable: true
    listFormat: 'M dd, yyyy'
    format: 'dd/mm/yyyy'

  constructor: (opt) ->
    opt = @options = $.extend {}, @defaults, opt

    @$el = $(opt.el)
    throw 'cannot find el ' + opt.el unless @$el.length
    @el = @$el[0]
    @$left = @$el.find('.datepickers>.left')
    @$right = @$el.find('.datepickers>.right')
    @$els = @$left.add(@$right).datepicker
      startDate: if opt.selectableFromNow then 'now' else null
      todayHighlight: true
      keyboardNavigation: false
    @left = @$left.data 'datepicker'
    @right = @$right.data 'datepicker'

    @$hours = @$el.find '.hours'
    @$hours.hide() unless opt.hourlySelectable

    @$list = @$el.find 'ul.date-list'
    @$total = @$el.find '.total'

    @_disabled = {}
    @_selected = {}
    @_hours = []

    @_fillHours()
    @_bind()

    @setDates opt.dates if opt.dates
    @setDisabled opt.disabled if opt.disabled
    @go opt.viewDate

  _bind: ->
    @$els.on 'mousewheel DOMMouseScroll', (e) ->
      e.preventDefault()
      e = e.originalEvent
      datepicker = $.data @, 'datepicker'
      datepicker?.go if e.wheelDelta > 0 or e.detail < 0 then -1 else 1
      false

    @$els.on
      changeMonth: (e) =>
        @showSelected e.target
      changeDate: (e) =>
        @toggleDate e.date
        @showSelected e.target, 1

    dragging_start_date = null
    @$els.on 'mousedown', '.day', ->
      dragging_start_date = @
      true
    @$els.on 'mouseenter', '.day', (e) =>
      @highlight dragging_start_date, e.target if dragging_start_date
      true
    @$els.on 'mouseup', '.day', (e) =>
      if dragging_start_date and dragging_start_date isnt e.target
        func = if e.altKey then @removeDate else @addDate
        @selectRange dragging_start_date, e.target, func.bind @
      dragging_start_date = null
      true
    @$el.find('.datepickers').on 'mouseleave', =>
      @highlight null if dragging_start_date
      true

    @$hours.on 'click', '.hour', (e) =>
      $el = $(e.target)
      h = $el.data 'hour'
      @_hours[h] = not @_hours[h]
      @_changed()

    dragging_start_hour = null
    @$hours.on 'mousedown', '.hour', ->
      dragging_start_hour = $(@).data('hour')
      #console.log 'hour down', @, dragging_start_hour
      true
    @$hours.on 'mouseenter', '.hour', (e) =>
      if dragging_start_hour?
        end = Number $(e.target).data('hour')
        @$hours.find('.hour.drag').removeClass 'drag'
        q = [dragging_start_hour..end].map (h) -> ".hour[data-hour='#{h}']"
        @$hours.find(q.join ',').addClass 'drag'
      #console.log 'hour mouseenter', dragging_start_hour, to
      true
    @$hours.on 'mouseup', '.hour', (e) =>
      end = Number $(e.target).data('hour')
      if dragging_start_hour? and dragging_start_hour isnt end
        @_hours[h] = not e.altKey for h in [dragging_start_hour..end]
        @$hours.find('.hour.drag').removeClass 'drag'
        @_changed()
      dragging_start_hour = null
      true
    @$hours.on 'mouseleave', =>
      @$hours.find('.hour.drag').removeClass 'drag'
      true

    $(document.body).on 'mouseup mouseleave', ->
      dragging_start_date = dragging_start_hour = null

    @$el.find('.btn-today').click => @go()
    @$el.find('.btn-reset').click => @reset()

    _t = null
    @$el.on 'change', =>
      clearTimeout(_t) if _t
      _t = setTimeout =>
        _t = null
        #console.log 'do update', Date.now()
        @showSelected()
        @_updateList()
        @_updateHours()
      , EVENT_DELAY

    @

  _getDateKey: (date) -> date.toISOString()[0...10]
  _formatDate: $.fn.datepicker.DPGlobal.formatDate
  _betweenDate: (from, to, pass, func) ->
    _getTS = (date) ->
      if date.dataset?
        new Date($.data date, 'date-key').getTime()
      else if date instanceof Date
        date.getTime()
      else if typeof date is 'number'
        date
      else
        new Date(date).getTime()
    from = _getTS from
    to = _getTS to
    # switch
    if from > to
      cur = to
      to = from
    else
      cur = from
    if pass
      # day loop
      while cur <= to
        func new Date cur
        # next day
        cur += DAY_SPAN
      null
    else
      p = []
      if to - cur >= DAY_SPAN # not same day
        # day loop
        while cur <= to
          p.push func new Date cur
          # next day
          cur += DAY_SPAN
      p

  showSelected: (target, delay = EVENT_DELAY) ->
    unless target?
      @showSelected @$left[0], delay
      @showSelected @$right[0], delay
    else
      _t = $.data target, '_refresh_sel_t'
      _t = clearTimeout(_t) if _t
      if delay < 10
        @_showSelected target
      else
        _t = setTimeout =>
          @_showSelected target
          $.data target, '_refresh_sel_t', null
        , delay
      $.data target, '_refresh_sel_t', _t
    @
  _showSelected: (target) ->
    datepicker = $.data target, 'datepicker'
    _selected = @_selected
    _disabled = @_disabled
    $(target).find('.day').each ->
      el = $(@)
      unless el.is('.disabled')
        key = el.data 'date-key'
        if _disabled.hasOwnProperty key
          el.addClass 'disabled selected'
        else if _selected.hasOwnProperty key
          el.addClass 'active'
        else
          el.removeClass 'active'

  _updateHours: ->
    if @$hours.is ':visible'
      q = @getHours().map((h) -> ".hour[data-hour='#{h}']").join ','
      @$hours.find(".hour.active").removeClass 'active'
      @$hours.find(q).addClass 'active' if q

  _getHourText: (h, m) ->
    throw 'invalid hour ' + h unless 0 <= h < 24
    if h is 0
      h = 12
      p = 'pm'
    else if h > 12
      h -= 12
      p = 'pm'
    else
      p = 'am'
    h = "#{h}:#{m}" if m?
    h + p
  _getHoursText: ->
    hours = @getHours()
    show_hours = []
    c = hours.length
    if 0 < c < 24
      last = []
      for h in hours
        if last.length and h - last[last.length - 1] isnt 1
          show_hours.push last
          last = []
        last.push h
      show_hours.push last if last.length
      show_hours = show_hours.map((a) =>
        "#{@_getHourText a[0]} ~ #{@_getHourText a[a.length - 1], 59}"
      ).join ', '
      show_hours
    else
      'whole day'
  _fillHours: ->
    _getHourText = @_getHourText
    makeHTML = (hours) ->
      hours.map((h) ->
        str = _getHourText h
        "<td class=\"hour\" data-hour=\"#{h}\" title=\"#{str} ~ #{_getHourText h, 59}\">#{str}</td>"
      ).join ''
    @$hours.html "<table><tr><th>AM</th>#{makeHTML [0..11]}</tr><tr><th>PM</th>#{makeHTML [12..23]}</tr></table>"

  _updateList: ->
    if @$list.is ':visible'
      selection = @getDates()
      count = selection.length
      frag = document.createDocumentFragment()
      if count
        formatDate = @_formatDate
        spanFrom = null
        last = new Date 0
        hoursTxt = @_getHoursText()

        format = @options.listFormat
        _append = (spanFrom, last) =>
          if spanFrom
            str = formatDate spanFrom, format, 'en'
            if spanFrom isnt last
              str_last = formatDate last, format, 'en'
              count = 1 + Math.round((last.getTime() - spanFrom.getTime()) / DAY_SPAN)
              str += " ~ #{str_last} (#{count} days)"
            else
              str += ' (1 day)'
            $("<li>#{str} <small title=\"#{hoursTxt}\">[#{hoursTxt}]</small></li>").appendTo frag

        @$total.text "(#{count} #{if count > 1 then 'days' else 'day'} selected)"
        for date in selection
          if date.getTime() - last.getTime() > DAY_SPAN
            _append spanFrom, last
            spanFrom = date
          last = date
        _append spanFrom, last
      else
        $("<li>(Empty)</li>").appendTo frag
        @$total.empty()
      @$list.empty().append frag

  _changed: -> @$el.trigger 'change', @

  toggleDate: (date) ->
    throw 'invalid date which is not a Date object' unless date instanceof Date
    key = @_getDateKey date
    if @_selected.hasOwnProperty key
      # remove when exist
      delete @_selected[key]
    else
      # add when not exits
      @_selected[key] = date
    @_changed()
    @
  addDate: (date) ->
    throw 'invalid date which is not a Date object' unless date instanceof Date
    key = @_getDateKey date
    if @_disabled.hasOwnProperty key
      console.warn 'date want to add is disabled ' + key
    else
      @_selected[key] = date
    @_changed()
    @
  removeDate: (date) ->
    throw 'invalid date which is not a Date object' unless date instanceof Date
    key = @_getDateKey date
    delete @_selected[key]
    @_changed()
    @

  selectRange: (from, to, addOrRemove = @addDate) ->
    @$els.find('.day.drag').removeClass('drag')
    @_betweenDate from, to, true, addOrRemove

  getDates: ->
    sel = @_selected
    Object.keys(sel).map((key) -> sel[key])
      .sort((a, b) -> a.getTime() - b.getTime())

  getDateStrings: ->
    formatDate = @_formatDate
    format = @options.format
    @getDates().map (date) -> formatDate date, format, 'en'

  setDates: (selection) ->
    @_selected = {}
    if selection
      selection = [selection] unless Array.isArray selection
      selection.forEach @addDate.bind @
    @_changed()

  reset: ->
    @setDates @options.dates
    @setHours @options.hours

  getDisabled: ->
    disabled = @_disabled
    Object.keys(disabled).map (key) -> disabled[key]

  setDisabled: (disabled) ->
    @_disabled = {}
    if disabled
      disabled = [disabled] unless Array.isArray disabled
      for date in disabled
        @_disabled[@_getDateKey date] = date
    @_changed()

  getHours: ->
    hours = []
    for v, h in @_hours
      hours.push h if v
    hours

  setHours: (hours) ->
    @_hours = []
    if hours
      @_hours[h] = true for h in hours
    @_changed()

  go: (date = new Date) ->
    nextMonth = @right.moveMonth date, 1
    @left.viewDate = date
    @right.viewDate = nextMonth
    @left.fill()
    @right.fill()
    @showSelected()

  highlight: (from, to) ->
    @$els.find('.day.drag').removeClass('drag')
    if from and to
      _getDateKey = @_getDateKey
      q = @_betweenDate from, to, false, (date) ->
        ".day[data-date-key=#{_getDateKey date}]"
      @$els.find(q.join(',')).addClass('drag') if q.length
    @

# test
window.schr = new Scheduler el: '.scheduler'
$('.btn-select').click ->
  console.log 'dates', schr.getDateStrings(), schr.getDates()
  console.log 'hours', schr.getHours()
