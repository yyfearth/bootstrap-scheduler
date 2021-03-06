// Generated by CoffeeScript 1.6.3
(function() {
  "use strict";
  var DAY_SPAN, DPGlobal, EVENT_DELAY, Scheduler, _splitValues;

  DAY_SPAN = 86400000;

  EVENT_DELAY = 60;

  DPGlobal = $.fn.datepicker.DPGlobal;

  Scheduler = (function() {
    Scheduler.prototype.defaults = {
      selectableFromNow: true,
      hourlySelectable: true,
      displayFormat: 'M dd, yyyy',
      format: 'mm/dd/yyyy'
    };

    function Scheduler(opt) {
      opt = this.options = $.extend({}, this.defaults, opt);
      this.$el = $(opt.el);
      if (!this.$el.length) {
        throw 'cannot find el ' + opt.el;
      }
      this.el = this.$el[0];
      this.$left = this.$el.find('.datepickers>.left');
      this.$right = this.$el.find('.datepickers>.right');
      this.$els = this.$left.add(this.$right).datepicker({
        startDate: opt.selectableFromNow ? 'now' : null,
        todayHighlight: true,
        keyboardNavigation: false
      });
      this.left = this.$left.data('datepicker');
      this.right = this.$right.data('datepicker');
      this.$hours = this.$el.find('.hours');
      if (!opt.hourlySelectable) {
        this.$hours.hide();
      }
      this.$list = this.$el.find('ul.date-list');
      this.$total = this.$el.find('.total');
      opt.format = DPGlobal.parseFormat(opt.format);
      opt.displayFormat = DPGlobal.parseFormat(opt.displayFormat);
      this._disabled = {};
      this._selected = {};
      this._hours = [];
      this._fillHours();
      this._bind();
      if (opt.dates) {
        this.setDates(opt.dates);
      }
      if (opt.disabled) {
        this.setDisabled(opt.disabled);
      }
      if (opt.hours) {
        this.setHours(opt.hours);
      }
      this.go(opt.viewDate);
    }

    Scheduler.prototype._bind = function() {
      var dragging_start_date, dragging_start_hour, _t,
        _this = this;
      this.$els.on('mousewheel DOMMouseScroll', function(e) {
        var datepicker;
        e.preventDefault();
        e = e.originalEvent;
        datepicker = $.data(this, 'datepicker');
        if (datepicker != null) {
          datepicker.go(e.wheelDelta > 0 || e.detail < 0 ? -1 : 1);
        }
        return false;
      });
      this.$els.on('changeMonth', function(e) {
        return _this.showSelected(e.target);
      });
      if (this.options.readonly !== true) {
        this.$els.on('changeDate', function(e) {
          _this.toggleDate(e.date);
          return _this.showSelected(e.target, 1);
        });
        dragging_start_date = null;
        this.$els.on('mousedown', '.day', function() {
          dragging_start_date = this;
          return true;
        });
        this.$els.on('mouseenter', '.day', function(e) {
          if (dragging_start_date) {
            _this.highlight(dragging_start_date, e.target);
          }
          return true;
        });
        this.$els.on('mouseup', '.day', function(e) {
          var func;
          if (dragging_start_date && dragging_start_date !== e.target) {
            func = e.altKey ? _this.removeDate : _this.addDate;
            _this.selectRange(dragging_start_date, e.target, func.bind(_this));
          }
          dragging_start_date = null;
          return true;
        });
        this.$el.find('.datepickers').on('mouseleave', function() {
          if (dragging_start_date) {
            _this.highlight(null);
          }
          return true;
        });
        this.$hours.on('click', '.hour', function(e) {
          var $el, h;
          $el = $(e.target);
          h = $el.data('hour');
          _this._hours[h] = !_this._hours[h];
          return _this._changed();
        });
        dragging_start_hour = null;
        this.$hours.on('mousedown', '.hour', function() {
          dragging_start_hour = $(this).data('hour');
          return true;
        });
        this.$hours.on('mouseenter', '.hour', function(e) {
          var end, q, _i, _results;
          if (dragging_start_hour != null) {
            end = Number($(e.target).data('hour'));
            _this.$hours.find('.hour.drag').removeClass('drag');
            q = (function() {
              _results = [];
              for (var _i = dragging_start_hour; dragging_start_hour <= end ? _i <= end : _i >= end; dragging_start_hour <= end ? _i++ : _i--){ _results.push(_i); }
              return _results;
            }).apply(this).map(function(h) {
              return ".hour[data-hour='" + h + "']";
            });
            _this.$hours.find(q.join(',')).addClass('drag');
          }
          return true;
        });
        this.$hours.on('mouseup', '.hour', function(e) {
          var end, h, _i;
          end = Number($(e.target).data('hour'));
          if ((dragging_start_hour != null) && dragging_start_hour !== end) {
            for (h = _i = dragging_start_hour; dragging_start_hour <= end ? _i <= end : _i >= end; h = dragging_start_hour <= end ? ++_i : --_i) {
              _this._hours[h] = !e.altKey;
            }
            _this.$hours.find('.hour.drag').removeClass('drag');
            _this._changed();
          }
          dragging_start_hour = null;
          return true;
        });
        this.$hours.on('mouseleave', function() {
          _this.$hours.find('.hour.drag').removeClass('drag');
          return true;
        });
        $(document.body).on('mouseup mouseleave', function() {
          return dragging_start_date = dragging_start_hour = null;
        });
        this.$el.find('.btn-reset').click(function() {
          return _this.reset();
        });
        this.$el.find('.btn-clean').click(function() {
          return _this.clean();
        });
      } else {
        this.$el.find('.btn-reset,.btn-clean,.btn-select,.btn-close').hide();
        this.$els.on('changeDate', function(e) {
          return _this.showSelected(e.target, 1);
        });
      }
      this.$el.find('.btn-today').click(function() {
        return _this.go();
      });
      _t = null;
      this.$el.on('change', function() {
        if (_t) {
          clearTimeout(_t);
        }
        return _t = setTimeout(function() {
          _t = null;
          _this.showSelected();
          _this._updateList();
          return _this._updateHours();
        }, EVENT_DELAY);
      });
      if (Scheduler._schr_dismiss_tips || (Scheduler._schr_dismiss_tips = sessionStorage._schr_dismiss_tips)) {
        this.$el.find('.alert').remove();
      } else {
        this.$el.on('click', '[data-dismiss="alert"]', function() {
          sessionStorage._schr_dismiss_tips = Scheduler._schr_dismiss_tips = true;
          return true;
        });
      }
      return this;
    };

    Scheduler.prototype._getDateKey = function(date) {
      return date.toISOString().slice(0, 10);
    };

    Scheduler.prototype._betweenDate = function(from, to, pass, func) {
      var cur, p, _getTS;
      _getTS = function(date) {
        if ((date.dataset != null) || (date.innerHTML != null)) {
          return new Date($.data(date, 'date-key')).getTime();
        } else if (date instanceof Date) {
          return date.getTime();
        } else if (typeof date === 'number') {
          return date;
        } else {
          return new Date(date).getTime();
        }
      };
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
          cur += DAY_SPAN;
        }
        return null;
      } else {
        p = [];
        if (to - cur >= DAY_SPAN) {
          while (cur <= to) {
            p.push(func(new Date(cur)));
            cur += DAY_SPAN;
          }
        }
        return p;
      }
    };

    Scheduler.prototype.showSelected = function(target, delay) {
      var _t,
        _this = this;
      if (delay == null) {
        delay = EVENT_DELAY;
      }
      if (target == null) {
        this.showSelected(this.$left[0], delay);
        this.showSelected(this.$right[0], delay);
      } else {
        _t = $.data(target, '_refresh_sel_t');
        if (_t) {
          _t = clearTimeout(_t);
        }
        if (delay < 10) {
          this._showSelected(target);
        } else {
          _t = setTimeout(function() {
            _this._showSelected(target);
            return $.data(target, '_refresh_sel_t', null);
          }, delay);
        }
        $.data(target, '_refresh_sel_t', _t);
      }
      return this;
    };

    Scheduler.prototype._showSelected = function(target) {
      var datepicker, _disabled, _selected;
      datepicker = $.data(target, 'datepicker');
      _selected = this._selected;
      _disabled = this._disabled;
      return $(target).find('.day').each(function() {
        var el, key;
        el = $(this);
        if (!el.is('.disabled')) {
          key = el.data('date-key');
          if (_disabled.hasOwnProperty(key)) {
            return el.addClass('disabled selected');
          } else if (_selected.hasOwnProperty(key)) {
            return el.addClass('active');
          } else {
            return el.removeClass('active');
          }
        }
      });
    };

    Scheduler.prototype._updateHours = function() {
      var q;
      if (this.$hours.is(':visible')) {
        q = this.getHours().map(function(h) {
          return ".hour[data-hour='" + h + "']";
        }).join(',');
        this.$hours.find(".hour.active").removeClass('active');
        if (q) {
          return this.$hours.find(q).addClass('active');
        }
      }
    };

    Scheduler.prototype._getHourText = function(h, m) {
      var p;
      if (!((0 <= h && h < 24))) {
        throw 'invalid hour ' + h;
      }
      p = h >= 12 ? 'pm' : 'am';
      if (h === 0) {
        h = 12;
      } else if (h > 12) {
        h -= 12;
      }
      if (m != null) {
        h = "" + h + ":" + m;
      }
      return h + p;
    };

    Scheduler.prototype.getHoursDesc = function() {
      var c, h, hours, last, show_hours, _i, _len,
        _this = this;
      hours = this.getHours();
      show_hours = [];
      c = hours.length;
      if ((0 < c && c < 24)) {
        last = [];
        for (_i = 0, _len = hours.length; _i < _len; _i++) {
          h = hours[_i];
          if (last.length && h - last[last.length - 1] !== 1) {
            show_hours.push(last);
            last = [];
          }
          last.push(h);
        }
        if (last.length) {
          show_hours.push(last);
        }
        show_hours = show_hours.map(function(a) {
          return "" + (_this._getHourText(a[0])) + " ~ " + (_this._getHourText(a[a.length - 1], 59));
        }).join(', ');
        return show_hours;
      } else {
        return 'whole day';
      }
    };

    Scheduler.prototype._fillHours = function() {
      var makeHTML, _getHourText;
      _getHourText = this._getHourText;
      makeHTML = function(hours) {
        return hours.map(function(h) {
          var str;
          str = _getHourText(h);
          return "<td class=\"hour\" data-hour=\"" + h + "\" title=\"" + str + " ~ " + (_getHourText(h, 59)) + "\">" + str + "</td>";
        }).join('');
      };
      return this.$hours.html("<table><tr><th>AM</th>" + (makeHTML([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])) + "</tr><tr><th>PM</th>" + (makeHTML([12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23])) + "</tr></table>");
    };

    Scheduler.prototype.getDatesDescs = function(format, connector) {
      var date, last, list, selection, spanFrom, _append, _i, _len,
        _this = this;
      if (format == null) {
        format = this.options.displayFormat;
      }
      if (connector == null) {
        connector = ' ~ ';
      }
      selection = this.getDates();
      list = [];
      if (selection.length) {
        spanFrom = null;
        last = new Date(0);
        _append = function(spanFrom, last) {
          var str, str_last;
          if (spanFrom) {
            str = DPGlobal.formatDate(spanFrom, format, 'en');
            if (spanFrom !== last) {
              str_last = DPGlobal.formatDate(last, format, 'en');
              str += "" + connector + str_last;
            }
            return list.push(str);
          }
        };
        for (_i = 0, _len = selection.length; _i < _len; _i++) {
          date = selection[_i];
          if (date.getTime() - last.getTime() > DAY_SPAN * 1.5) {
            _append(spanFrom, last);
            spanFrom = date;
          }
          last = date;
        }
        _append(spanFrom, last);
      }
      return list;
    };

    Scheduler.prototype._updateList = function() {
      var count, date, format, frag, hoursTxt, last, selection, spanFrom, _append, _i, _len,
        _this = this;
      if (this.$list.is(':visible')) {
        selection = this.getDates();
        count = selection.length;
        frag = document.createDocumentFragment();
        if (count) {
          spanFrom = null;
          last = new Date(0);
          hoursTxt = this.getHoursDesc();
          format = this.options.displayFormat;
          _append = function(spanFrom, last) {
            var span, str, str_last;
            if (spanFrom) {
              str = DPGlobal.formatDate(spanFrom, format, 'en');
              if (spanFrom !== last) {
                str_last = DPGlobal.formatDate(last, format, 'en');
                span = 1 + Math.round((last.getTime() - spanFrom.getTime()) / DAY_SPAN);
                str += " ~ " + str_last + " (" + span + " days)";
              } else {
                str += ' (1 day)';
              }
              return $("<li>" + str + " <small title=\"" + hoursTxt + "\">[" + hoursTxt + "]</small></li>").appendTo(frag);
            }
          };
          this.$total.text("(" + count + " " + (count > 1 ? 'days' : 'day') + " selected)");
          for (_i = 0, _len = selection.length; _i < _len; _i++) {
            date = selection[_i];
            if (date.getTime() - last.getTime() > DAY_SPAN * 1.5) {
              _append(spanFrom, last);
              spanFrom = date;
            }
            last = date;
          }
          _append(spanFrom, last);
        } else {
          $("<li>(Empty)</li>").appendTo(frag);
          this.$total.empty();
        }
        return this.$list.empty().append(frag);
      }
    };

    Scheduler.prototype._changed = function() {
      return this.$el.trigger('change', this);
    };

    Scheduler.prototype.toggleDate = function(date) {
      var key;
      if (!(date instanceof Date)) {
        throw 'invalid date which is not a Date object';
      }
      key = this._getDateKey(date);
      if (this._selected.hasOwnProperty(key)) {
        delete this._selected[key];
      } else {
        this._selected[key] = date;
      }
      this._changed();
      return this;
    };

    Scheduler.prototype.addDate = function(date) {
      var key;
      if (!(date instanceof Date)) {
        date = DPGlobal.parseDate(date + '', this.options.displayFormat, 'en');
      }
      key = this._getDateKey(date);
      if (this._disabled.hasOwnProperty(key)) {
        console.warn('date want to add is disabled ' + key);
      } else {
        this._selected[key] = date;
      }
      this._changed();
      return this;
    };

    Scheduler.prototype.removeDate = function(date) {
      var key;
      if (!(date instanceof Date)) {
        throw 'invalid date which is not a Date object';
      }
      key = this._getDateKey(date);
      delete this._selected[key];
      this._changed();
      return this;
    };

    Scheduler.prototype.selectRange = function(from, to, addOrRemove) {
      if (addOrRemove == null) {
        addOrRemove = this.addDate;
      }
      this.$els.find('.day.drag').removeClass('drag');
      this._betweenDate(from, to, true, addOrRemove);
      return this;
    };

    Scheduler.prototype.getDates = function() {
      var sel;
      sel = this._selected;
      return Object.keys(sel).map(function(key) {
        return sel[key];
      }).sort(function(a, b) {
        return a.getTime() - b.getTime();
      });
    };

    Scheduler.prototype.getDatesValue = function(compact) {
      var format, list;
      format = this.options.format;
      if (compact) {
        list = this.getDatesDescs(format, '-');
      } else {
        list = this.getDates().map(function(date) {
          return DPGlobal.formatDate(date, format, 'en');
        });
      }
      return list.join(',');
    };

    Scheduler.prototype.setDates = function(selection) {
      this._selected = {};
      if (selection) {
        if (!Array.isArray(selection)) {
          selection = [selection];
        }
        selection.forEach(this.addDate.bind(this));
      }
      this._changed();
      return this;
    };

    Scheduler.prototype.reset = function() {
      this.setDates(this.options.dates);
      this.setHours(this.options.hours);
      return this;
    };

    Scheduler.prototype.clean = function() {
      this.setDates();
      this.setHours();
      return this;
    };

    Scheduler.prototype.getDisabled = function() {
      var disabled;
      disabled = this._disabled;
      return Object.keys(disabled).map(function(key) {
        return disabled[key];
      });
    };

    Scheduler.prototype.setDisabled = function(disabled) {
      var date, _i, _len;
      this._disabled = {};
      if (disabled) {
        if (!Array.isArray(disabled)) {
          disabled = [disabled];
        }
        for (_i = 0, _len = disabled.length; _i < _len; _i++) {
          date = disabled[_i];
          this._disabled[this._getDateKey(date)] = date;
        }
      }
      this._changed();
      return this;
    };

    Scheduler.prototype.getHours = function() {
      var h, hours, v, _i, _len, _ref;
      hours = [];
      _ref = this._hours;
      for (h = _i = 0, _len = _ref.length; _i < _len; h = ++_i) {
        v = _ref[h];
        if (v) {
          hours.push(h);
        }
      }
      return hours;
    };

    Scheduler.prototype.setHours = function(hours) {
      var h, _i, _len;
      this._hours = [];
      if (hours) {
        for (_i = 0, _len = hours.length; _i < _len; _i++) {
          h = hours[_i];
          this._hours[h] = true;
        }
      }
      return this._changed();
    };

    Scheduler.prototype.go = function(date) {
      var nextMonth;
      if (date == null) {
        date = new Date;
      }
      nextMonth = this.right.moveMonth(date, 1);
      this.left.viewDate = date;
      this.right.viewDate = nextMonth;
      this.left.fill();
      this.right.fill();
      return this.showSelected();
    };

    Scheduler.prototype.highlight = function(from, to) {
      var q, _getDateKey;
      this.$els.find('.day.drag').removeClass('drag');
      if (from && to) {
        _getDateKey = this._getDateKey;
        q = this._betweenDate(from, to, false, function(date) {
          return ".day[data-date-key=" + (_getDateKey(date)) + "]";
        });
        if (q.length) {
          this.$els.find(q.join(',')).addClass('drag');
        }
      }
      return this;
    };

    return Scheduler;

  })();

  window.Scheduler = Scheduler;

  _splitValues = function(array) {
    if (array) {
      return array.split(',');
    } else {
      return [];
    }
  };

  $('[data-scheduler]').each(function() {
    var $el, dates, disabled, el, hours, readonly;
    $el = $(this);
    dates = _splitValues($el.data('dates'));
    hours = _splitValues($el.data('hours'));
    disabled = _splitValues($el.data('disabled-dates'));
    readonly = $el.data('readonly');
    el = this;
    return $el.data('scheduler', new Scheduler({
      el: el,
      dates: dates,
      hours: hours,
      disabled: disabled,
      readonly: readonly
    }));
  });

  $('[data-scheduler-popover]').each(function() {
    var $datesInput, $display, $el, $hoursInput, compact, disabled, popover, readonly, select, show, tpl;
    $el = $(this);
    $datesInput = $($el.data('dates-input'));
    $hoursInput = $($el.data('hours-input'));
    $display = $($el.data('scheduler-display'));
    compact = $el.data('scheduler-compact');
    disabled = _splitValues($el.data('disabled-dates'));
    readonly = $el.data('readonly');
    $display.on({
      keydown: function(e) {
        e.preventDefault();
        $el.focus();
        return false;
      },
      paste: function() {
        return false;
      }
    });
    tpl = $($el.data('scheduler-popover')).html();
    if (!tpl) {
      throw 'scheduler-popover must be a query point to html template';
    }
    $el.popover({
      html: true,
      placement: 'bottom',
      container: 'body',
      trigger: 'manual',
      content: tpl
    });
    popover = $el.data('popover');
    $el.popover('show');
    popover.$tip.addClass('scheduler');
    $el.popover('hide');
    select = function(schr) {
      var hours, text, _ref;
      $datesInput.data('value', schr.getDatesValue(false));
      $datesInput.val(schr.getDatesValue(true));
      if ($hoursInput.length) {
        hours = schr.getHours();
        hours = (0 < (_ref = hours.length) && _ref < 24) ? hours.join(',') : '';
        $hoursInput.val(hours);
      }
      if ($display.length) {
        text = schr.getDatesDescs().join('; ');
        if (text) {
          text += " (" + (schr.getHoursDesc()) + ")";
        }
        if ($display.is('input')) {
          $display.val(text);
        } else {
          $display.text(text);
        }
      }
      $el.popover('hide');
      return true;
    };
    show = function() {
      var $tip, dates, el, hours, scheduler, _ref;
      if (!((_ref = popover.$tip) != null ? _ref.is(':visible') : void 0)) {
        $el.popover('show');
        $tip = popover.$tip.addClass('scheduler');
        $tip.find('.btn-close').click(function() {
          return $el.popover('hide');
        });
        dates = _splitValues($datesInput.data('value') || $datesInput.val());
        hours = _splitValues($hoursInput.val());
        el = $tip;
        scheduler = new Scheduler({
          el: el,
          dates: dates,
          hours: hours,
          disabled: disabled,
          readonly: readonly
        });
        $el.data('scheduler', scheduler);
        return $tip.find('.btn-select').click(function() {
          return select(scheduler);
        });
      }
    };
    return $el.click(show);
  });

}).call(this);

/*
//@ sourceMappingURL=scheduler.map
*/
