// Generated by CoffeeScript 1.6.3
(function() {
  "use strict";
  var $list, $together, UTCDate, addDate, clean, dragging_start, getDateKey, getSelection, highlight, index, left, removeDate, right, selectRange, selected, showSelected, today, toggleDate, _addDate, _betweenDate, _getTS, _removeDate,
    __slice = [].slice;

  selected = [];

  index = {};

  UTCDate = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return new Date(Date.UTC.apply(Date, args));
  };

  $together = $('#datepicker_left, #datepicker_right').datepicker({
    format: 'mm/dd/yyyy',
    todayHighlight: true,
    keyboardNavigation: false
  });

  $list = $('#date_list');

  left = $.data($together[0], 'datepicker');

  right = $.data($together[1], 'datepicker');

  $together.on('mousewheel DOMMouseScroll', function(e) {
    var datepicker;
    e.preventDefault();
    e = e.originalEvent || e;
    datepicker = $.data(this, 'datepicker');
    datepicker.go(e.wheelDelta > 0 || e.detail < 0 ? -1 : 1);
    return false;
  });

  getSelection = function() {
    return selected.filter(function(date) {
      return date != null;
    }).sort(function(a, b) {
      return a.getTime() - b.getTime();
    });
  };

  getDateKey = function(date) {
    return date.toISOString().slice(0, 10);
  };

  showSelected = function(target, datepicker) {
    var curMonth, curYear;
    if (target == null) {
      showSelected($together[0], left);
      return showSelected($together[1], right);
    } else {
      if (datepicker == null) {
        datepicker = $.data(target, 'datepicker');
      }
      curYear = datepicker.viewDate.getUTCFullYear();
      curMonth = datepicker.viewDate.getUTCMonth();
      return $(target).find('.day').each(function() {
        var day, el, key, month, year;
        el = $(this);
        if (!el.is('.disabled')) {
          key = el.data('date-key');
          if (!key) {
            day = parseInt(el.text(), 10) || 1;
            month = curMonth;
            year = curYear;
            if (el.is('.old')) {
              if (month === 0) {
                month = 11;
                year -= 1;
              } else {
                month -= 1;
              }
            } else if (el.is('.new')) {
              if (month === 11) {
                month = 0;
                year += 1;
              } else {
                month += 1;
              }
            }
            key = getDateKey(UTCDate(year, month, day, 0, 0, 0, 0));
          }
          if (index.hasOwnProperty(key)) {
            return el.addClass('active');
          } else {
            return el.removeClass('active');
          }
        }
      });
    }
  };

  clean = function() {
    selected = [];
    index = {};
    return showSelected();
  };

  (today = function() {
    var nextMonth;
    left.viewDate = new Date;
    nextMonth = right.moveMonth(new Date, 1);
    right.viewDate = nextMonth;
    left.fill();
    right.fill();
    return showSelected();
  })();

  $together.on({
    changeMonth: function(e) {
      var _this = this;
      console.log('changeMonth', e);
      return setTimeout(function() {
        return showSelected(_this);
      }, 10);
    },
    changeDate: function(e) {
      toggleDate(e.date, $(this).data('datepicker'), this);
      return showSelected();
    }
  });

  dragging_start = null;

  _getTS = function(date) {
    if (date.dataset != null) {
      return new Date($.data(date, 'date-key')).getTime();
    } else if (date instanceof Date) {
      return date.getTime();
    } else if (tyepof(date === 'number')) {
      return date;
    } else {
      return new Date(date).getTime();
    }
  };

  _betweenDate = function(from, to, pass, func) {
    var cur, p;
    from = _getTS(from);
    to = _getTS(to);
    if (from > to) {
      cur = to;
      to = from;
    } else {
      cur = from;
    }
    if (pass) {
      while (cur <= to) {
        func(new Date(cur));
        cur += 86400000;
      }
      return null;
    } else {
      p = [];
      if (to - cur > 100000) {
        while (cur <= to) {
          p.push(func(new Date(cur)));
          cur += 86400000;
        }
      }
      return p;
    }
  };

  highlight = function(from, to) {
    var q;
    $together.find('.day.drag').removeClass('drag');
    q = _betweenDate(from, to, false, function(date) {
      return ".day[data-date-key=" + (getDateKey(date)) + "]";
    });
    if (q.length) {
      return $together.find(q.join(',')).addClass('drag');
    }
  };

  selectRange = function(from, to, addOrRemove) {
    $together.find('.day.drag').removeClass('drag');
    _betweenDate(from, to, true, addOrRemove);
    return showSelected();
  };

  $together.on('mousedown', '.day', function() {
    return dragging_start = this;
  });

  $together.on('mouseenter', '.day', function() {
    if (dragging_start) {
      console.log('dragging', dragging_start, this);
      return highlight(dragging_start, this);
    }
  });

  $together.on('mouseup', '.day', function(e) {
    if (dragging_start && dragging_start !== this) {
      console.log('dropped', dragging_start, this);
      selectRange(dragging_start, this, e.altKey ? removeDate : addDate);
    }
    return dragging_start = null;
  });

  toggleDate = function(date, datepicker, target) {
    var key;
    if (!(date instanceof Date)) {
      throw 'invalid date which is not a Date object';
    }
    key = getDateKey(date);
    if (index.hasOwnProperty(key)) {
      return _removeDate(date, key);
    } else {
      return _addDate(date, key);
    }
  };

  addDate = function(date, datepicker, target) {
    var key;
    if (!(date instanceof Date)) {
      throw 'invalid date which is not a Date object';
    }
    key = getDateKey(date);
    if (!index.hasOwnProperty(key)) {
      return _addDate(date, key);
    }
  };

  removeDate = function(date, datepicker, target) {
    var key;
    if (!(date instanceof Date)) {
      throw 'invalid date which is not a Date object';
    }
    key = getDateKey(date);
    if (index.hasOwnProperty(key)) {
      return _removeDate(date, key);
    }
  };

  _addDate = function(date, key) {
    selected.push(date);
    return index[key] = selected.length - 1;
  };

  _removeDate = function(date, key) {
    var idx;
    idx = index[key];
    if (idx === selected.length - 1) {
      selected.pop();
    } else {
      selected[index[key]] = null;
    }
    return delete index[key];
  };

  $('#today_btn').click(today);

  $('#clean_btn').click(clean);

}).call(this);

/*
//@ sourceMappingURL=scheduler.map
*/
