"use strict"

DAY_SPAN = 86400000

class Scheduler
  constructor: (@options = {}) ->
    @$el = $(@options.el)
    throw 'cannot find el ' + @options.el unless @$el.length
    @el = @$el[0]
    @$left = @$el.find('.datepickers>.left')
    @$right = @$el.find('.datepickers>.right')
    console.log @el, @$left.length, @$right.length
    @$els = @$left.add(@$right).datepicker
      startDate: 'now'
      todayHighlight: true
      keyboardNavigation: false
    @left = @$left.data 'datepicker'
    @right = @$right.data 'datepicker'

    @_disabled = {}
    @_selected = {}

    @_bind()
    @go()

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
        @showSelected()
        @showSelected e.target, 1

    dragging_start = null
    @$els.on 'mousedown', '.day', ->
      dragging_start = @
      true
    @$els.on 'mouseenter', '.day', (e) =>
      @highlight dragging_start, e.target if dragging_start
      true
    @$els.on 'mouseup', '.day', (e) =>
      if dragging_start and dragging_start isnt e.target
        func = if e.altKey then @removeDate else @addDate
        @selectRange dragging_start, e.target, func.bind @
      dragging_start = null
      true
    @$el.on 'mouseleave', =>
      @highlight null
      dragging_start = null
      true
    @$el.find('.btn-today').click => @go()
    @$el.find('.btn-clean').click => @clean()
  @

  _getDateKey: (date) -> date.toISOString()[0...10]
  _getTS: (date) ->
    if date.dataset?
      new Date($.data date, 'date-key').getTime()
    else if date instanceof Date
      date.getTime()
    else if typeof date is 'number'
      date
    else
      new Date(date).getTime()
  _betweenDate: (from, to, pass, func) ->
    from = @_getTS from
    to = @_getTS to
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

  showSelected: (target, delay) ->
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

  toggleDate: (date) ->
    throw 'invalid date which is not a Date object' unless date instanceof Date
    key = @_getDateKey date
    if @_selected.hasOwnProperty key
      # remove when exist
      delete @_selected[key]
    else
      # add when not exits
      @_selected[key] = date
    @
  addDate: (date) ->
    throw 'invalid date which is not a Date object' unless date instanceof Date
    key = @_getDateKey date
    if @_disabled.hasOwnProperty key
      console.warn 'date want to add is disabled ' + key
    else
      @_selected[key] = date
    @
  removeDate: (date) ->
    throw 'invalid date which is not a Date object' unless date instanceof Date
    key = @_getDateKey date
    delete @_selected[key]
    @

  selectRange: (from, to, addOrRemove = @addDate) ->
    @$els.find('.day.drag').removeClass('drag')
    @_betweenDate from, to, true, addOrRemove
    @showSelected()

  getSelection: ->
    sel = @_selected
    Object.keys(sel).map((key) -> sel[key])
      .sort((a, b) -> a.getTime() - b.getTime())

  setSelection: (selection) ->
    @_selected = {}
    if selection
      selection = [selection] unless Array.isArray selection
      selection.forEach @addDate.bind @
    @showSelected()
  clean: -> @setSelection()

  getDisabled: ->
    disabled = @_disabled
    Object.keys(disabled).map (key) -> disabled[key]

  setDisabled: (disabled) ->
    @_disabled = {}
    if disabled
      disabled = [disabled] unless Array.isArray disabled
      for date in disabled
        @_disabled[@_getDateKey date] = date
    @showSelected()

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

window.schr = new Scheduler el: '.scheduler'
