"use strict"

selected = []
index = {}

UTCDate = (args...) -> new Date(Date.UTC.apply(Date, args))

$together = $('#datepicker_left, #datepicker_right').datepicker
  format: 'mm/dd/yyyy'
  todayHighlight: true
  keyboardNavigation: false
$list = $('#date_list')
left = $.data $together[0], 'datepicker'
right = $.data $together[1], 'datepicker'

$together.on 'mousewheel DOMMouseScroll', (e) ->
  e.preventDefault()
  e = e.originalEvent or e
  datepicker = $.data @, 'datepicker'
  datepicker.go if e.wheelDelta > 0 or e.detail < 0 then -1 else 1
  false

getSelection = -> # trim the select
  selected
    .filter((date) -> date?)
    .sort((a, b) -> a.getTime() - b.getTime())

getDateKey = (date) -> date.toISOString()[0...10]

showSelected = (target, datepicker) ->
  unless target?
    showSelected $together[0], left
    showSelected $together[1], right
  else
    datepicker ?= $.data target, 'datepicker'
    curYear = datepicker.viewDate.getUTCFullYear()
    curMonth = datepicker.viewDate.getUTCMonth()
    $(target).find('.day').each ->
      el = $(@)
      unless el.is('.disabled')
        key = el.data 'date-key'
        unless key
          day = parseInt(el.text(), 10) or 1
          month = curMonth
          year = curYear
          if el.is('.old')
            if month is 0
              month = 11
              year -= 1
            else
              month -= 1
          else if el.is('.new')
            if month is 11
              month = 0
              year += 1
            else
              month += 1
          key = getDateKey UTCDate year, month, day, 0, 0, 0, 0
        if index.hasOwnProperty key
          el.addClass 'active'
        else
          el.removeClass 'active'

clean = ->
  selected = []
  index = {}
  showSelected()

do today = ->
  left.viewDate = new Date
  nextMonth = right.moveMonth new Date, 1
  right.viewDate = nextMonth
  left.fill()
  right.fill()
  showSelected()

$together.on
  changeMonth: (e) ->
    console.log 'changeMonth', e
    setTimeout =>
      showSelected @
    , 10
  changeDate: (e) ->
    toggleDate e.date, $(@).data('datepicker'), @
    showSelected()

dragging_start = null

_getTS = (date) ->
  if date.dataset?
    new Date($.data date, 'date-key').getTime()
  else if date instanceof Date
    date.getTime()
  else if tyepof date is 'number'
    date
  else
    new Date(date).getTime()

_betweenDate = (from, to, pass, func) ->
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
      cur += 86400000
    null
  else
    p = []
    if to - cur > 100000 # not same day
      # day loop
      while cur <= to
        p.push func new Date cur
        # next day
        cur += 86400000
    p

highlight = (from, to) ->
  $together.find('.day.drag').removeClass('drag')
  q = _betweenDate from, to, false, (date) ->
    ".day[data-date-key=#{getDateKey date}]"
  $together.find(q.join(',')).addClass('drag') if q.length

selectRange = (from, to, addOrRemove) ->
  $together.find('.day.drag').removeClass('drag')
  _betweenDate from, to, true, addOrRemove
  showSelected()

$together.on 'mousedown', '.day', ->
  dragging_start = @
$together.on 'mouseenter', '.day', ->
  if dragging_start
    console.log 'dragging', dragging_start, @
    highlight dragging_start, @
$together.on 'mouseup', '.day', (e) ->
  if dragging_start and dragging_start isnt @
    console.log 'dropped', dragging_start, @
    selectRange dragging_start, @, if e.altKey then removeDate else addDate
  dragging_start = null

toggleDate = (date, datepicker, target) ->
  throw 'invalid date which is not a Date object' unless date instanceof Date
  key = getDateKey date
  if index.hasOwnProperty key
    # remove when exist
    _removeDate date, key
  else
    # add when not exits
    _addDate date, key

#console.log datepicker, target, getSelection()

addDate = (date, datepicker, target) ->
  throw 'invalid date which is not a Date object' unless date instanceof Date
  key = getDateKey date
  _addDate date, key unless index.hasOwnProperty key

removeDate = (date, datepicker, target) ->
  throw 'invalid date which is not a Date object' unless date instanceof Date
  key = getDateKey date
  _removeDate date, key if index.hasOwnProperty key

_addDate = (date, key) ->
  selected.push date
  index[key] = selected.length - 1

_removeDate = (date, key) ->
  idx = index[key]
  if idx is selected.length - 1
    # safely remove it if it is the last one
    selected.pop()
  else
    # do not delete in array since index saved the position
    selected[index[key]] = null
  # remove from index
  delete index[key]

$('#today_btn').click today
$('#clean_btn').click clean
